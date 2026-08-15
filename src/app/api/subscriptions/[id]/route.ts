import type { NextRequest } from "next/server";
import { z } from "zod";
import type { Subscription } from "@/types/entities";
import { getDb, mutate } from "@/mocks/seed";
import { Permission } from "@/lib/permissions/permissions";
import { ErrorCode } from "@/lib/api/errors";
import {
  isAdminRole,
  isErrorResponse,
  jsonError,
  jsonOk,
  nowIso,
  parseJsonBody,
  requireAuth,
  requirePermission,
} from "@/lib/api/route-helpers";
import { SubscriptionStatus, UserRole } from "@/types/enums";

export const dynamic = "force-dynamic";

const patchSubscriptionSchema = z.object({
  action: z
    .enum([
      "pause",
      "resume",
      "cancel",
      "changeAddress",
      "change-address",
      "setStatus",
    ])
    .optional(),
  addressId: z.string().optional(),
  status: z.nativeEnum(SubscriptionStatus).optional(),
  cancellationReason: z.string().optional(),
});

function canAccessSubscription(
  authId: string,
  authRole: UserRole,
  subscription: Subscription,
): boolean {
  if (isAdminRole(authRole)) return true;
  return authRole === UserRole.CUSTOMER && subscription.customerId === authId;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = requireAuth(request);
  if (isErrorResponse(auth)) return auth;

  const denied = requirePermission(auth, Permission.SUBSCRIPTIONS_READ);
  if (denied) return denied;

  const { id } = await context.params;
  const subscription = getDb().subscriptions.find((item) => item.id === id);
  if (!subscription) {
    return jsonError("Subscription not found", 404, ErrorCode.NOT_FOUND);
  }

  if (!canAccessSubscription(auth.id, auth.role, subscription)) {
    return jsonError("Forbidden", 403, ErrorCode.FORBIDDEN);
  }

  return jsonOk(subscription);
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = requireAuth(request);
  if (isErrorResponse(auth)) return auth;

  const { id } = await context.params;
  const existing = getDb().subscriptions.find((item) => item.id === id);
  if (!existing) {
    return jsonError("Subscription not found", 404, ErrorCode.NOT_FOUND);
  }

  if (!canAccessSubscription(auth.id, auth.role, existing)) {
    return jsonError("Forbidden", 403, ErrorCode.FORBIDDEN);
  }

  const body = await parseJsonBody(request);
  if (isErrorResponse(body)) return body;

  const parsed = patchSubscriptionSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation failed", 422, ErrorCode.VALIDATION_ERROR, {
      issues: parsed.error.flatten(),
    });
  }

  const action = parsed.data.action;
  const timestamp = nowIso();
  let updated: Subscription = { ...existing, updatedAt: timestamp };

  if (action === "pause") {
    if (existing.status !== SubscriptionStatus.ACTIVE) {
      return jsonError(
        "Only active subscriptions can be paused",
        409,
        ErrorCode.CONFLICT,
      );
    }
    updated = {
      ...updated,
      status: SubscriptionStatus.PAUSED,
      pausedAt: timestamp,
    };
  } else if (action === "resume") {
    if (existing.status !== SubscriptionStatus.PAUSED) {
      return jsonError(
        "Only paused subscriptions can be resumed",
        409,
        ErrorCode.CONFLICT,
      );
    }
    updated = {
      ...updated,
      status: SubscriptionStatus.ACTIVE,
      pausedAt: undefined,
    };
  } else if (action === "cancel") {
    const denied = requirePermission(auth, Permission.SUBSCRIPTIONS_CANCEL);
    if (denied) return denied;

    if (
      existing.status === SubscriptionStatus.CANCELLED ||
      existing.status === SubscriptionStatus.COMPLETED
    ) {
      return jsonError(
        "Subscription cannot be cancelled",
        409,
        ErrorCode.CONFLICT,
      );
    }
    updated = {
      ...updated,
      status: SubscriptionStatus.CANCELLED,
      cancelledAt: timestamp,
      cancellationReason: parsed.data.cancellationReason,
    };
  } else if (
    action === "changeAddress" ||
    action === "change-address" ||
    parsed.data.addressId
  ) {
    if (!parsed.data.addressId) {
      return jsonError(
        "addressId is required",
        422,
        ErrorCode.VALIDATION_ERROR,
      );
    }
    const address = getDb().addresses.find(
      (item) =>
        item.id === parsed.data.addressId &&
        item.customerId === existing.customerId,
    );
    if (!address) {
      return jsonError(
        "Address not found for customer",
        404,
        ErrorCode.NOT_FOUND,
      );
    }
    updated = { ...updated, addressId: address.id };
  } else if (action === "setStatus" || parsed.data.status) {
    if (!isAdminRole(auth.role)) {
      return jsonError("Forbidden", 403, ErrorCode.FORBIDDEN);
    }
    if (!parsed.data.status) {
      return jsonError("status is required", 422, ErrorCode.VALIDATION_ERROR);
    }
    updated = { ...updated, status: parsed.data.status };
  } else {
    return jsonError("Unsupported action", 400, ErrorCode.BAD_REQUEST);
  }

  mutate((db) => {
    const index = db.subscriptions.findIndex((item) => item.id === id);
    if (index >= 0) db.subscriptions[index] = updated;
  });

  return jsonOk(updated, { message: "Subscription updated" });
}
