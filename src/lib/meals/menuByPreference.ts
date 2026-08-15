import type { DailyMenuItem, DailyMenuSlot } from "@/types/entities";
import { FoodPreference } from "@/types/enums";

/** Veg, vegan, and eggetarian pack from the veg line; non-veg packs the non-veg line. */
export function isNonVegPreference(preference?: string | null): boolean {
  return preference === FoodPreference.NON_VEG;
}

export function menuItemForPreference(
  slot: DailyMenuSlot | DailyMenuItem | undefined,
  preference?: string | null,
): DailyMenuItem | undefined {
  if (!slot) return undefined;
  if ("veg" in slot || "nonVeg" in slot) {
    const typed = slot as DailyMenuSlot;
    if (isNonVegPreference(preference)) {
      return typed.nonVeg ?? typed.veg;
    }
    return typed.veg ?? typed.nonVeg;
  }
  return slot as DailyMenuItem;
}

export function packingLineLabel(
  preference?: string | null,
): "VEG" | "NON_VEG" {
  return isNonVegPreference(preference) ? "NON_VEG" : "VEG";
}
