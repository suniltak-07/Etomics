import { FoodPreference, HealthGoal, MealType } from "@/types/enums";

export const FOOD_PREFERENCE_LABELS: Record<FoodPreference, string> = {
  [FoodPreference.VEG]: "Veg",
  [FoodPreference.NON_VEG]: "Non-veg",
  [FoodPreference.EGGETARIAN]: "Eggetarian",
  [FoodPreference.VEGAN]: "Vegan",
};

export const HEALTH_GOAL_LABELS: Record<HealthGoal, string> = {
  [HealthGoal.WEIGHT_LOSS]: "Weight loss",
  [HealthGoal.WEIGHT_GAIN]: "Weight gain",
  [HealthGoal.FITNESS]: "Fitness",
  [HealthGoal.DIABETES_FRIENDLY]: "Diabetes-friendly",
  [HealthGoal.HEALTHY_LIFESTYLE]: "Healthy lifestyle",
};

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  [MealType.BREAKFAST]: "Breakfast",
  [MealType.LUNCH]: "Lunch",
  [MealType.DINNER]: "Dinner",
  [MealType.SNACK]: "Snack",
};

export function formatFoodPreference(value?: string | null): string {
  if (!value) return "—";
  return FOOD_PREFERENCE_LABELS[value as FoodPreference] ?? value;
}

export function formatHealthGoal(value?: string | null): string {
  if (!value) return "—";
  return HEALTH_GOAL_LABELS[value as HealthGoal] ?? value;
}

export function formatMealTypes(types?: MealType[] | null): string {
  if (!types?.length) return "—";
  return types.map((type) => MEAL_TYPE_LABELS[type] ?? type).join(" · ");
}
