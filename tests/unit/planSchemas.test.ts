import { describe, expect, it } from "vitest";
import { createPlanSchema } from "@/features/plans/schemas/planSchemas";

const validPlan = {
  name: "Starter Plan",
  shortDescription: "Breakfast-focused wellness plan for busy mornings.",
  description: "A full description of the starter meal plan.",
};

describe("createPlanSchema", () => {
  it("accepts a valid plan create payload", () => {
    const parsed = createPlanSchema.parse(validPlan);

    expect(parsed.name).toBe("Starter Plan");
    expect(parsed.shortDescription).toBe(
      "Breakfast-focused wellness plan for busy mornings.",
    );
    expect(parsed.description).toBe(
      "A full description of the starter meal plan.",
    );
  });

  it("rejects missing required fields", () => {
    const result = createPlanSchema.safeParse({
      name: "Incomplete",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((issue) => issue.path.join("."));
      expect(paths).toContain("shortDescription");
      expect(paths).toContain("description");
    }
  });

  it("rejects oversized name", () => {
    const longName = createPlanSchema.safeParse({
      ...validPlan,
      name: "x".repeat(121),
    });
    expect(longName.success).toBe(false);
  });
});
