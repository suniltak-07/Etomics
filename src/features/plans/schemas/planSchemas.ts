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

const planMealSchema = z.object({
  id: z.string().optional(),
  mealType: mealTypeSchema,
  name: z.string().min(1),
  description: z.string().optional(),
  calories: z.number().nonnegative().optional(),
  servingSize: z.string().optional(),
  ingredients: z.array(z.string()).optional(),
  nutrition: nutritionSchema,
  imageUrl: z.string().url().optional().or(z.literal("")),
  displayOrder: z.number().int().nonnegative().optional(),
});

export const createPlanSchema = z.object({
  name: z.string().min(1).max(120),
  slug: z.string().min(1).max(120).optional(),
  shortDescription: z.string().min(1).max(280),
  description: z.string().min(1),
  image: z.string().min(1),
  gallery: z.array(z.string()).optional(),
  price: z.number().positive(),
  compareAtPrice: z.number().positive().optional(),
  currency: z.string().min(1).default("INR"),
  duration: z.number().int().positive(),
  durationUnit: durationUnitSchema.default(DurationUnit.DAYS),
  mealCount: z.number().int().positive(),
  mealTypes: z.array(mealTypeSchema).min(1),
  mealsPerDay: z.number().int().positive(),
  servingsPerMeal: z.number().int().positive().optional(),
  calories: z.string().optional(),
  servingSize: z.string().optional(),
  features: z.array(z.string()).default([]),
  ingredients: z.array(z.string()).default([]),
  nutrition: nutritionSchema,
  meals: z.array(planMealSchema).default([]),
  deliveryInformation: z.string().optional(),
  terms: z.string().optional(),
  status: planStatusSchema.default(PlanStatus.DRAFT),
  isFeatured: z.boolean().default(false),
  displayOrder: z.number().int().nonnegative().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
});

export const updatePlanSchema = createPlanSchema.partial();

export const planStatusActionSchema = z.object({
  status: planStatusSchema,
});

export type CreatePlanInput = z.infer<typeof createPlanSchema>;
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;
