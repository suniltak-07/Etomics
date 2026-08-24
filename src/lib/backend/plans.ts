import type { NutritionInfo, Plan, PlanMeal } from "@/types/entities";
import { DurationUnit, MealType, PlanStatus } from "@/types/enums";

type ClearableNumber = number | null | undefined;

interface PlanWriteMeal {
  mealType?: string;
  name?: string;
  description?: string;
  calories?: ClearableNumber;
  servingSize?: string;
  ingredients?: string[];
  nutrition?: NutritionInfo;
  imageUrl?: string;
  displayOrder?: ClearableNumber;
}

interface PlanWriteInput {
  name?: string;
  shortDescription?: string;
  description?: string;
  image?: string;
  gallery?: string[];
  price?: ClearableNumber;
  compareAtPrice?: ClearableNumber;
  currency?: string;
  duration?: ClearableNumber;
  durationUnit?: string;
  mealCount?: ClearableNumber;
  mealsPerDay?: ClearableNumber;
  servingsPerMeal?: ClearableNumber;
  mealTypes?: string[];
  features?: string[];
  ingredients?: string[];
  nutrition?: NutritionInfo;
  calories?: string;
  caloriesLabel?: string;
  servingSize?: string;
  deliveryInformation?: string;
  terms?: string;
  seoTitle?: string;
  seoDescription?: string;
  status?: string;
  isFeatured?: boolean;
  displayOrder?: number;
  meals?: PlanWriteMeal[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  if (typeof value === "string" && value.trim()) {
    return [value];
  }
  if (isRecord(value)) {
    return Object.values(value).filter(
      (item): item is string => typeof item === "string",
    );
  }
  return [];
}

function unwrapPayload(payload: unknown): unknown {
  if (Array.isArray(payload) || !isRecord(payload)) return payload;
  if ("id" in payload && typeof payload.id === "string") return payload;
  if ("data" in payload) return unwrapPayload(payload.data);
  return payload;
}

export function unwrapOfoodPlans(payload: unknown): unknown[] {
  const unwrapped = unwrapPayload(payload);
  return Array.isArray(unwrapped) ? unwrapped : [];
}

export function unwrapOfoodPlan(payload: unknown): unknown {
  const unwrapped = unwrapPayload(payload);
  return isRecord(unwrapped) ? unwrapped : null;
}

function mapMealType(value: unknown): MealType {
  const raw = asString(value).toUpperCase();
  if ((Object.values(MealType) as string[]).includes(raw)) {
    return raw as MealType;
  }
  return MealType.LUNCH;
}

function mapDurationUnit(value: unknown): DurationUnit {
  const raw = asString(value).toUpperCase();
  if ((Object.values(DurationUnit) as string[]).includes(raw)) {
    return raw as DurationUnit;
  }
  return DurationUnit.DAYS;
}

function mapStatus(value: unknown): PlanStatus {
  const raw = asString(value).toUpperCase();
  if ((Object.values(PlanStatus) as string[]).includes(raw)) {
    return raw as PlanStatus;
  }
  return PlanStatus.DRAFT;
}

function mapNutrition(value: unknown): NutritionInfo | undefined {
  if (!isRecord(value)) return undefined;
  return value as NutritionInfo;
}

function mapMeal(
  value: unknown,
  planId: string,
  index: number,
): PlanMeal | null {
  if (!isRecord(value)) return null;
  const id = asString(value.id);
  const name = asString(value.name);
  if (!id || !name) return null;

  return {
    id,
    planId,
    mealType: mapMealType(value.mealType),
    name,
    description: asString(value.description) || undefined,
    calories: typeof value.calories === "number" ? value.calories : undefined,
    servingSize: asString(value.servingSize) || undefined,
    ingredients: asStringArray(value.ingredients),
    nutrition: mapNutrition(value.nutrition),
    imageUrl: asString(value.imageUrl) || undefined,
    displayOrder: asNumber(value.displayOrder, index + 1),
  };
}

export function mapOfoodPlan(payload: unknown): Plan | null {
  const raw = unwrapOfoodPlan(payload);
  if (!isRecord(raw) || typeof raw.id !== "string") return null;

  const id = raw.id;
  const meals = Array.isArray(raw.meals)
    ? raw.meals
        .map((meal, index) => mapMeal(meal, id, index))
        .filter((meal): meal is PlanMeal => meal !== null)
    : [];

  return {
    id,
    name: asString(raw.name),
    slug: asString(raw.slug),
    shortDescription: asString(raw.shortDescription),
    description: asString(raw.description),
    image: asString(raw.image),
    gallery: asStringArray(raw.gallery),
    price: asNumber(raw.price),
    compareAtPrice:
      typeof raw.compareAtPrice === "number" ? raw.compareAtPrice : undefined,
    currency: asString(raw.currency, "INR") || "INR",
    duration: asNumber(raw.duration),
    durationUnit: mapDurationUnit(raw.durationUnit),
    mealCount: asNumber(raw.mealCount),
    mealTypes: asStringArray(raw.mealTypes).map(mapMealType),
    mealsPerDay: asNumber(raw.mealsPerDay),
    servingsPerMeal:
      typeof raw.servingsPerMeal === "number" ? raw.servingsPerMeal : undefined,
    calories: asString(raw.caloriesLabel || raw.calories) || undefined,
    features: asStringArray(raw.features),
    ingredients: asStringArray(raw.ingredients),
    nutrition: mapNutrition(raw.nutrition),
    meals,
    deliveryInformation: asString(raw.deliveryInformation) || undefined,
    terms: asString(raw.terms) || undefined,
    status: mapStatus(raw.status),
    isFeatured: asBoolean(raw.isFeatured),
    displayOrder: asNumber(raw.displayOrder),
    seoTitle: asString(raw.seoTitle) || undefined,
    seoDescription: asString(raw.seoDescription) || undefined,
    createdAt: asString(raw.createdAt),
    updatedAt: asString(raw.updatedAt),
  };
}

/** Drop only omitted fields; keep "" / [] / null so clears reach OFOOD. */
function omitUndefined<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => {
      if (item === undefined) return false;
      if (typeof item === "number" && Number.isNaN(item)) return false;
      return true;
    }),
  ) as T;
}

function clearablePositiveNumber(
  value: ClearableNumber,
  minimum = 1,
): number | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return value >= minimum ? value : null;
}

function optionalTrimmedString(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  return value.trim();
}

export function toOfoodCreateBody(input: {
  name: string;
  shortDescription: string;
  description: string;
}): {
  name: string;
  shortDescription: string;
  description: string;
} {
  return {
    name: input.name.trim(),
    shortDescription: input.shortDescription.trim(),
    description: input.description.trim(),
  };
}

export function toOfoodUpdateBody(
  input: PlanWriteInput,
): Record<string, unknown> {
  const meals = input.meals?.map((meal, index) =>
    omitUndefined({
      mealType: meal.mealType,
      name: meal.name,
      description: meal.description,
      calories: meal.calories === undefined ? undefined : meal.calories,
      servingSize: optionalTrimmedString(meal.servingSize),
      ingredients: meal.ingredients,
      nutrition: meal.nutrition,
      imageUrl: optionalTrimmedString(meal.imageUrl),
      displayOrder:
        meal.displayOrder === undefined
          ? index + 1
          : meal.displayOrder === null
            ? null
            : meal.displayOrder,
    }),
  );

  return omitUndefined({
    name: optionalTrimmedString(input.name),
    shortDescription: optionalTrimmedString(input.shortDescription),
    description: optionalTrimmedString(input.description),
    image: optionalTrimmedString(input.image),
    gallery: input.gallery,
    price: clearablePositiveNumber(input.price, 0.01),
    compareAtPrice: clearablePositiveNumber(input.compareAtPrice, 0.01),
    currency: optionalTrimmedString(input.currency),
    duration: clearablePositiveNumber(input.duration, 1),
    durationUnit: input.durationUnit,
    mealCount: clearablePositiveNumber(input.mealCount, 1),
    mealsPerDay: clearablePositiveNumber(input.mealsPerDay, 1),
    servingsPerMeal: clearablePositiveNumber(input.servingsPerMeal, 1),
    mealTypes: input.mealTypes,
    features: input.features,
    ingredients: input.ingredients,
    nutrition: input.nutrition,
    caloriesLabel: optionalTrimmedString(input.caloriesLabel ?? input.calories),
    servingSize: optionalTrimmedString(input.servingSize),
    deliveryInformation: optionalTrimmedString(input.deliveryInformation),
    terms: optionalTrimmedString(input.terms),
    seoTitle: optionalTrimmedString(input.seoTitle),
    seoDescription: optionalTrimmedString(input.seoDescription),
    status: input.status,
    isFeatured: input.isFeatured,
    displayOrder:
      typeof input.displayOrder === "number" ? input.displayOrder : undefined,
    meals,
  });
}
