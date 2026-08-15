import { describe, expect, it } from "vitest";
import { createPlanSchema } from "@/features/plans/schemas/planSchemas";
import { DurationUnit, MealType, PlanStatus } from "@/types/enums";

const validPlan = {
  name: "Starter Plan",
  shortDescription: "Breakfast-focused wellness plan for busy mornings.",
  description: "A full description of the starter meal plan.",
  image: "https://images.unsplash.com/photo-1494597564530-871f2b93ac55?w=1200",
  price: 4999,
  compareAtPrice: 5999,
  currency: "INR",
  duration: 30,
  durationUnit: DurationUnit.DAYS,
  mealCount: 30,
  mealTypes: [MealType.BREAKFAST],
  mealsPerDay: 1,
  features: ["Portion controlled"],
  ingredients: ["oats"],
  meals: [],
  status: PlanStatus.DRAFT,
  isFeatured: false,
};

describe("createPlanSchema", () => {
  it("accepts a valid plan create payload and applies defaults", () => {
    const parsed = createPlanSchema.parse(validPlan);

    expect(parsed.name).toBe("Starter Plan");
    expect(parsed.price).toBe(4999);
    expect(parsed.currency).toBe("INR");
    expect(parsed.durationUnit).toBe(DurationUnit.DAYS);
    expect(parsed.status).toBe(PlanStatus.DRAFT);
    expect(parsed.features).toEqual(["Portion controlled"]);
    expect(parsed.meals).toEqual([]);
  });

  it("rejects missing required fields", () => {
    const result = createPlanSchema.safeParse({
      name: "Incomplete",
      price: 1000,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((issue) => issue.path.join("."));
      expect(paths).toContain("shortDescription");
      expect(paths).toContain("description");
      expect(paths).toContain("image");
      expect(paths).toContain("mealTypes");
    }
  });

  it("rejects non-positive price and empty mealTypes", () => {
    const zeroPrice = createPlanSchema.safeParse({
      ...validPlan,
      price: 0,
    });
    expect(zeroPrice.success).toBe(false);

    const emptyMeals = createPlanSchema.safeParse({
      ...validPlan,
      mealTypes: [],
    });
    expect(emptyMeals.success).toBe(false);
  });

  it("rejects oversized name and invalid meal type values", () => {
    const longName = createPlanSchema.safeParse({
      ...validPlan,
      name: "x".repeat(121),
    });
    expect(longName.success).toBe(false);

    const badMeal = createPlanSchema.safeParse({
      ...validPlan,
      mealTypes: ["BRUNCH"],
    });
    expect(badMeal.success).toBe(false);
  });

  it("accepts optional nutrition and meal entries", () => {
    const parsed = createPlanSchema.parse({
      ...validPlan,
      nutrition: {
        calories: 400,
        proteinGrams: 22,
      },
      meals: [
        {
          mealType: MealType.BREAKFAST,
          name: "Balanced Breakfast Bowl",
          calories: 400,
        },
      ],
    });

    expect(parsed.nutrition?.calories).toBe(400);
    expect(parsed.meals).toHaveLength(1);
    expect(parsed.meals[0]?.name).toBe("Balanced Breakfast Bowl");
  });
});
