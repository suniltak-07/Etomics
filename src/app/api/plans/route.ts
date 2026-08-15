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
  jsonPaginated,
  nowIso,
  paginate,
  parseJsonBody,
  parsePagination,
  requireAuth,
  requirePermission,
  slugify,
} from "@/lib/api/route-helpers";
import { createPlanSchema } from "@/features/plans/schemas/planSchemas";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const user = getAuthUser(request);
  const { page, pageSize } = parsePagination(searchParams);
  const status = searchParams.get("status") ?? undefined;
  const featured = searchParams.get("featured");
  const search = searchParams.get("search")?.trim().toLowerCase();

  let plans = getDb().plans;

  const canSeeNonActive = user && isAdminRole(user.role);
  if (!canSeeNonActive) {
    plans = plans.filter((plan) => plan.status === PlanStatus.ACTIVE);
  } else if (status) {
    plans = plans.filter((plan) => plan.status === status);
  }

  if (featured === "true") {
    plans = plans.filter((plan) => plan.isFeatured);
  } else if (featured === "false") {
    plans = plans.filter((plan) => !plan.isFeatured);
  }

  if (search) {
    plans = plans.filter(
      (plan) =>
        plan.name.toLowerCase().includes(search) ||
        plan.slug.toLowerCase().includes(search) ||
        plan.shortDescription.toLowerCase().includes(search),
    );
  }

  plans = [...plans].sort((a, b) => a.displayOrder - b.displayOrder);

  const { items, meta } = paginate(plans, page, pageSize);
  return jsonPaginated(items, meta);
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (isErrorResponse(auth)) return auth;

  const denied = requirePermission(auth, Permission.PLANS_CREATE);
  if (denied) return denied;

  const body = await parseJsonBody(request);
  if (isErrorResponse(body)) return body;

  const parsed = createPlanSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation failed", 422, ErrorCode.VALIDATION_ERROR, {
      issues: parsed.error.flatten(),
    });
  }

  const data = parsed.data;
  const timestamp = nowIso();
  const planId = createId("plan");
  const slug = data.slug?.trim() || slugify(data.name);

  const existing = getDb().plans.find((plan) => plan.slug === slug);
  if (existing) {
    return jsonError("Plan slug already exists", 409, ErrorCode.CONFLICT);
  }

  const meals: PlanMeal[] = (data.meals ?? []).map((meal, index) => ({
    id: meal.id ?? createId("meal"),
    planId,
    mealType: meal.mealType,
    name: meal.name,
    description: meal.description,
    calories: meal.calories,
    servingSize: meal.servingSize,
    ingredients: meal.ingredients,
    nutrition: meal.nutrition,
    imageUrl: meal.imageUrl || undefined,
    displayOrder: meal.displayOrder ?? index + 1,
  }));

  const maxOrder = getDb().plans.reduce(
    (max, plan) => Math.max(max, plan.displayOrder),
    0,
  );

  const plan: Plan = {
    id: planId,
    name: data.name,
    slug,
    shortDescription: data.shortDescription,
    description: data.description,
    image: data.image,
    gallery: data.gallery,
    price: data.price,
    compareAtPrice: data.compareAtPrice,
    currency: data.currency,
    duration: data.duration,
    durationUnit: data.durationUnit,
    mealCount: data.mealCount,
    mealTypes: data.mealTypes,
    mealsPerDay: data.mealsPerDay,
    servingsPerMeal: data.servingsPerMeal,
    calories: data.calories,
    servingSize: data.servingSize,
    features: data.features,
    ingredients: data.ingredients,
    nutrition: data.nutrition,
    meals,
    deliveryInformation: data.deliveryInformation,
    terms: data.terms,
    status: data.status,
    isFeatured: data.isFeatured,
    displayOrder: data.displayOrder ?? maxOrder + 1,
    seoTitle: data.seoTitle,
    seoDescription: data.seoDescription,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  mutate((db) => {
    db.plans.push(plan);
  });

  return jsonOk(plan, { status: 201, message: "Plan created" });
}
