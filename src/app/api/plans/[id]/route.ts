import type { NextRequest } from "next/server";
import type { Plan, PlanMeal } from "@/types/entities";
import { PlanStatus } from "@/types/enums";
import { getDb, mutate } from "@/mocks/seed";
import { Permission } from "@/lib/permissions/permissions";
import { ErrorCode } from "@/lib/api/errors";
import {
  createId,
  getAuthUser,
  isAdminRole,
  isErrorResponse,
  jsonError,
  jsonOk,
  nowIso,
  parseJsonBody,
  requireAuth,
  requirePermission,
  slugify,
} from "@/lib/api/route-helpers";
import {
  planStatusActionSchema,
  updatePlanSchema,
} from "@/features/plans/schemas/planSchemas";

export const dynamic = "force-dynamic";

function findPlan(idOrSlug: string): Plan | undefined {
  const db = getDb();
  return (
    db.plans.find((plan) => plan.id === idOrSlug) ??
    db.plans.find((plan) => plan.slug === idOrSlug)
  );
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  const key = slug || id;

  const plan = findPlan(key);
  if (!plan) {
    return jsonError("Plan not found", 404, ErrorCode.NOT_FOUND);
  }

  const user = getAuthUser(request);
  if (plan.status !== PlanStatus.ACTIVE && !(user && isAdminRole(user.role))) {
    return jsonError("Plan not found", 404, ErrorCode.NOT_FOUND);
  }

  return jsonOk(plan);
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = requireAuth(request);
  if (isErrorResponse(auth)) return auth;

  const denied = requirePermission(auth, Permission.PLANS_UPDATE);
  if (denied) return denied;

  const { id } = await context.params;
  const existing = findPlan(id);
  if (!existing) {
    return jsonError("Plan not found", 404, ErrorCode.NOT_FOUND);
  }

  const body = await parseJsonBody(request);
  if (isErrorResponse(body)) return body;

  const parsed = updatePlanSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation failed", 422, ErrorCode.VALIDATION_ERROR, {
      issues: parsed.error.flatten(),
    });
  }

  const data = parsed.data;
  const nextSlug =
    data.slug?.trim() || (data.name ? slugify(data.name) : existing.slug);

  const slugConflict = getDb().plans.find(
    (plan) => plan.slug === nextSlug && plan.id !== existing.id,
  );
  if (slugConflict) {
    return jsonError("Plan slug already exists", 409, ErrorCode.CONFLICT);
  }

  let meals = existing.meals;
  if (data.meals) {
    meals = data.meals.map((meal, index) => ({
      id: meal.id ?? createId("meal"),
      planId: existing.id,
      mealType: meal.mealType,
      name: meal.name,
      description: meal.description,
      calories: meal.calories,
      servingSize: meal.servingSize,
      ingredients: meal.ingredients,
      nutrition: meal.nutrition,
      imageUrl: meal.imageUrl || undefined,
      displayOrder: meal.displayOrder ?? index + 1,
    })) as PlanMeal[];
  }

  const updated: Plan = {
    ...existing,
    ...data,
    slug: nextSlug,
    meals,
    image: data.image ?? existing.image,
    gallery: data.gallery ?? existing.gallery,
    updatedAt: nowIso(),
  };

  mutate((db) => {
    const index = db.plans.findIndex((plan) => plan.id === existing.id);
    if (index >= 0) db.plans[index] = updated;
  });

  return jsonOk(updated, { message: "Plan updated" });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = requireAuth(request);
  if (isErrorResponse(auth)) return auth;

  const denied = requirePermission(auth, Permission.PLANS_UPDATE);
  if (denied) return denied;

  const { id } = await context.params;
  const existing = findPlan(id);
  if (!existing) {
    return jsonError("Plan not found", 404, ErrorCode.NOT_FOUND);
  }

  const body = await parseJsonBody(request);
  if (isErrorResponse(body)) return body;

  const parsed = planStatusActionSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation failed", 422, ErrorCode.VALIDATION_ERROR, {
      issues: parsed.error.flatten(),
    });
  }

  const updated: Plan = {
    ...existing,
    status: parsed.data.status,
    updatedAt: nowIso(),
  };

  mutate((db) => {
    const index = db.plans.findIndex((plan) => plan.id === existing.id);
    if (index >= 0) db.plans[index] = updated;
  });

  return jsonOk(updated, { message: "Plan status updated" });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = requireAuth(request);
  if (isErrorResponse(auth)) return auth;

  const denied = requirePermission(auth, Permission.PLANS_DELETE);
  if (denied) return denied;

  const { id } = await context.params;
  const existing = findPlan(id);
  if (!existing) {
    return jsonError("Plan not found", 404, ErrorCode.NOT_FOUND);
  }

  mutate((db) => {
    db.plans = db.plans.filter((plan) => plan.id !== existing.id);
  });

  return jsonOk({ id: existing.id }, { message: "Plan deleted" });
}
