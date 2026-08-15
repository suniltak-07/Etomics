import type { NextRequest } from "next/server";
import { z } from "zod";
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
import { MealType, UserRole } from "@/types/enums";
import { assertCanChangeMealOpt } from "@/lib/meals/skipRules";
import { toDateOnly } from "@/lib/calendar/deliveryCalendar";

export const dynamic = "force-dynamic";

const mealsSchema = z.object({
  mealTypes: z.array(z.nativeEnum(MealType)).min(1),
  firstAffectedDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export async function PATCH(
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
  const parsed = mealsSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation failed", 422, ErrorCode.VALIDATION_ERROR, {
      issues: parsed.error.flatten(),
    });
  }

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

  const firstAffected = parsed.data.firstAffectedDate ?? toDateOnly(new Date());
  try {
    assertCanChangeMealOpt(firstAffected);
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Opt window closed",
      409,
      ErrorCode.CONFLICT,
    );
  }

  const updated = {
    ...existing,
    mealTypes: parsed.data.mealTypes,
    updatedAt: nowIso(),
  };
  mutate((db) => {
    const index = db.subscriptions.findIndex((item) => item.id === id);
    if (index >= 0) db.subscriptions[index] = updated;
  });
  return jsonOk(updated, { message: "Meal choices updated" });
}
