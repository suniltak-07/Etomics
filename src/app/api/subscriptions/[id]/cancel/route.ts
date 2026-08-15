import type { NextRequest } from "next/server";
import { getDb, mutate } from "@/mocks/seed";
import { Permission } from "@/lib/permissions/permissions";
import { ErrorCode } from "@/lib/api/errors";
import {
  isAdminRole,
  isErrorResponse,
  jsonError,
  jsonOk,
  nowIso,
  requireAuth,
  requirePermission,
} from "@/lib/api/route-helpers";
import { SubscriptionStatus, UserRole } from "@/types/enums";
import type { Subscription } from "@/types/entities";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = requireAuth(request);
  if (isErrorResponse(auth)) return auth;

  const denied = requirePermission(auth, Permission.SUBSCRIPTIONS_CANCEL);
  if (denied) return denied;

  const { id } = await context.params;
  const existing = getDb().subscriptions.find((item) => item.id === id);
  if (!existing) {
    return jsonError("Subscription not found", 404, ErrorCode.NOT_FOUND);
  }

  if (
    !isAdminRole(auth.role) &&
    !(auth.role === UserRole.CUSTOMER && existing.customerId === auth.id)
  ) {
    return jsonError("Forbidden", 403, ErrorCode.FORBIDDEN);
  }

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

  let cancellationReason: string | undefined;
  try {
    const body = (await request.json()) as { cancellationReason?: string };
    cancellationReason = body?.cancellationReason;
  } catch {
    cancellationReason = undefined;
  }

  const timestamp = nowIso();
  const updated: Subscription = {
    ...existing,
    status: SubscriptionStatus.CANCELLED,
    cancelledAt: timestamp,
    cancellationReason,
    updatedAt: timestamp,
  };

  mutate((db) => {
    const index = db.subscriptions.findIndex((item) => item.id === id);
    if (index >= 0) db.subscriptions[index] = updated;
  });

  return jsonOk(updated, { message: "Subscription cancelled" });
}
