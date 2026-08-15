import { describe, expect, it } from "vitest";
import { menuItemForPreference } from "@/lib/meals/menuByPreference";
import { FoodPreference } from "@/types/enums";

const slot = {
  veg: { name: "Millet porridge" },
  nonVeg: { name: "Egg-white millet scramble" },
};

describe("menuItemForPreference", () => {
  it("packs the veg line for veg, vegan, and eggetarian", () => {
    expect(menuItemForPreference(slot, FoodPreference.VEG)?.name).toBe(
      "Millet porridge",
    );
    expect(menuItemForPreference(slot, FoodPreference.VEGAN)?.name).toBe(
      "Millet porridge",
    );
    expect(menuItemForPreference(slot, FoodPreference.EGGETARIAN)?.name).toBe(
      "Millet porridge",
    );
  });

  it("packs the non-veg line for non-veg customers", () => {
    expect(menuItemForPreference(slot, FoodPreference.NON_VEG)?.name).toBe(
      "Egg-white millet scramble",
    );
  });
});
