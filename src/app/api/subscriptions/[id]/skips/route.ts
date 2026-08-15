import type { NextRequest } from "next/server";
import { z } from "zod";
import { getDb, mutate } from "@/mocks/seed";
import { Permission } from "@/lib/permissions/permissions";
import { ErrorCode } from "@/lib/api/errors";
import {
  createId,
  isAdminRole,
  isErrorResponse,
  jsonError,
  jsonOk,
  nowIso,
  parseJsonBody,
  requireAuth,
  requirePermission,
} from "@/lib/api/route-helpers";
import { MealType, UserRole } from "@/types/enums";
import { assertCanSkipMeal } from "@/lib/meals/skipRules";

export const dynamic = "force-dynamic";

const skipSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mealType: z.nativeEnum(MealType),
});

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = requireAuth(request);
  if (isErrorResponse(auth)) return auth;
  const denied = requirePermission(auth, Permission.SUBSCRIPTIONS_READ);
  if (denied) return denied;

  const { id } = await context.params;
  const db = getDb();
  const subscription = db.subscriptions.find((item) => item.id === id);
  if (!subscription) {
    return jsonError("Subscription not found", 404, ErrorCode.NOT_FOUND);
  }
  if (
    !isAdminRole(auth.role) &&
    !(auth.role === UserRole.CUSTOMER && subscription.customerId === auth.id)
  ) {
    return jsonError("Forbidden", 403, ErrorCode.FORBIDDEN);
  }

  const skips = db.mealSkips.filter((item) => item.subscriptionId === id);
  return jsonOk(skips);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = requireAuth(request);
  if (isErrorResponse(auth)) return auth;
  const denied = requirePermission(auth, Permission.SUBSCRIPTIONS_UPDATE);
  if (denied) return denied;

  const { id } = await context.params;
  const body = await parseJsonBody(request);
  if (isErrorResponse(body)) return body;
  const parsed = skipSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation failed", 422, ErrorCode.VALIDATION_ERROR, {
      issues: parsed.error.flatten(),
    });
  }

  const subscription = getDb().subscriptions.find((item) => item.id === id);
  if (!subscription) {
    return jsonError("Subscription not found", 404, ErrorCode.NOT_FOUND);
  }
  if (
    !isAdminRole(auth.role) &&
    !(auth.role === UserRole.CUSTOMER && subscription.customerId === auth.id)
  ) {
    return jsonError("Forbidden", 403, ErrorCode.FORBIDDEN);
  }

  try {
    assertCanSkipMeal(parsed.data.date, parsed.data.mealType);
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Skip window closed",
      409,
      ErrorCode.CONFLICT,
    );
  }

  const existing = getDb().mealSkips.find(
    (item) =>
      item.subscriptionId === id &&
      item.date === parsed.data.date &&
      item.mealType === parsed.data.mealType,
  );
  if (existing) {
    return jsonOk(existing, { message: "Already skipped" });
  }

  const skip = {
    id: createId("skip"),
    subscriptionId: id,
    customerId: subscription.customerId,
    date: parsed.data.date,
    mealType: parsed.data.mealType,
    createdAt: nowIso(),
  };

  mutate((db) => {
    db.mealSkips.push(skip);
  });
  return jsonOk(skip, { status: 201, message: "Meal skipped" });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = requireAuth(request);
  if (isErrorResponse(auth)) return auth;
  const denied = requirePermission(auth, Permission.SUBSCRIPTIONS_UPDATE);
  if (denied) return denied;

  const { id } = await context.params;
  const { searchParams } = new URL(request.url);
  const parsed = skipSchema.safeParse({
    date: searchParams.get("date"),
    mealType: searchParams.get("mealType"),
  });
  if (!parsed.success) {
    return jsonError(
      "date and mealType are required",
      422,
      ErrorCode.VALIDATION_ERROR,
    );
  }

  const subscription = getDb().subscriptions.find((item) => item.id === id);
  if (!subscription) {
    return jsonError("Subscription not found", 404, ErrorCode.NOT_FOUND);
  }
  if (
    !isAdminRole(auth.role) &&
    !(auth.role === UserRole.CUSTOMER && subscription.customerId === auth.id)
  ) {
    return jsonError("Forbidden", 403, ErrorCode.FORBIDDEN);
  }

  try {
    assertCanSkipMeal(parsed.data.date, parsed.data.mealType);
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Restore window closed",
      409,
      ErrorCode.CONFLICT,
    );
  }

  mutate((db) => {
    db.mealSkips = db.mealSkips.filter(
      (item) =>
        !(
          item.subscriptionId === id &&
          item.date === parsed.data.date &&
          item.mealType === parsed.data.mealType
        ),
    );
  });
  return jsonOk({ restored: true }, { message: "Meal restored" });
}
