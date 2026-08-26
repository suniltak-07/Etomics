import { z } from "zod";
import { DurationUnit, MealType, PlanStatus } from "@/types/enums";

const mealTypeSchema = z.nativeEnum(MealType);
const durationUnitSchema = z.nativeEnum(DurationUnit);
const planStatusSchema = z.nativeEnum(PlanStatus);

const nutritionSchema = z
  .object({
    calories: z.number().nonnegative().optional(),
    proteinGrams: z.number().nonnegative().optional(),
    carbsGrams: z.number().nonnegative().optional(),
    fatGrams: z.number().nonnegative().optional(),
    fiberGrams: z.number().nonnegative().optional(),
    sugarGrams: z.number().nonnegative().optional(),
    sodiumMg: z.number().nonnegative().optional(),
    additional: z.record(z.union([z.string(), z.number()])).optional(),
  })
  .optional();

const optionalNumber = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) return undefined;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}, z.number().optional());

/** Empty form values become `null` so updates can clear the field upstream. */
const clearableNumber = z.preprocess((value) => {
  if (value === "" || value === null) return null;
  if (value === undefined) return undefined;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}, z.number().nullable().optional());

const planMealSchema = z.object({
  id: z.string().optional(),
  mealType: mealTypeSchema,
  name: z.string().min(1),
  description: z.string().optional(),
  calories: clearableNumber,
  servingSize: z.string().optional(),
  ingredients: z.array(z.string()).optional(),
  nutrition: nutritionSchema,
  imageUrl: z.string().optional().or(z.literal("")),
  displayOrder: clearableNumber,
});

export const createPlanSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  shortDescription: z
    .string()
    .trim()
    .min(1, "Short description is required")
    .max(280),
  description: z.string().trim().min(1, "Description is required"),
});

export const updatePlanSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  shortDescription: z.string().trim().max(280).optional(),
  description: z.string().optional(),
  image: z.string().optional(),
  gallery: z.array(z.string()).optional(),
  price: clearableNumber,
  compareAtPrice: clearableNumber,
  currency: z.string().optional(),
  duration: clearableNumber,
  durationUnit: durationUnitSchema.optional(),
  mealCount: clearableNumber,
  mealTypes: z.array(mealTypeSchema).optional(),
  mealsPerDay: clearableNumber,
  servingsPerMeal: clearableNumber,
  calories: z.string().optional(),
  caloriesLabel: z.string().optional(),
  servingSize: z.string().optional(),
  features: z.array(z.string()).optional(),
  ingredients: z.array(z.string()).optional(),
  nutrition: nutritionSchema,
  meals: z.array(planMealSchema).optional(),
  deliveryInformation: z.string().optional(),
  terms: z.string().optional(),
  status: planStatusSchema.optional(),
  isFeatured: z.boolean().optional(),
  displayOrder: optionalNumber,
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
});

export const planEditFormSchema = updatePlanSchema.extend({
  name: z.string().trim().min(1, "Name is required").max(120),
  shortDescription: z
    .string()
    .trim()
    .min(1, "Short description is required")
    .max(280),
  description: z.string().trim().min(1, "Description is required"),
});

export const planStatusActionSchema = z.object({
  status: planStatusSchema,
});

export const PLAN_TAB_FIELDS = {
  basic: ["name", "shortDescription", "description"],
  pricing: ["price", "compareAtPrice", "currency"],
  configuration: [
    "duration",
    "durationUnit",
    "mealCount",
    "mealsPerDay",
    "servingsPerMeal",
    "calories",
    "mealTypes",
  ],
  benefits: ["features", "ingredients"],
  media: ["image", "gallery"],
  delivery: ["deliveryInformation", "terms"],
  seo: ["seoTitle", "seoDescription"],
  settings: ["status", "displayOrder", "isFeatured"],
} as const;

export type PlanTabId = keyof typeof PLAN_TAB_FIELDS;

export function pickPlanTabUpdate(
  values: PlanEditFormInput,
  tab: PlanTabId,
): UpdatePlanInput {
  const payload: Record<string, unknown> = {};
  for (const key of PLAN_TAB_FIELDS[tab]) {
    payload[key] = values[key];
  }
  return payload as UpdatePlanInput;
}

export type CreatePlanInput = z.infer<typeof createPlanSchema>;
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;
export type PlanEditFormInput = z.infer<typeof planEditFormSchema>;
