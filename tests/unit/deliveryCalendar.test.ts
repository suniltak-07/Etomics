import { describe, expect, it } from "vitest";
import { MealType } from "@/types/enums";
import {
  addDeliveryDays,
  canChangeMealOpt,
  canSkipMeal,
  isSunday,
  nextDeliveryDate,
  parseDateOnly,
  toDateOnly,
} from "@/lib/calendar/deliveryCalendar";

describe("deliveryCalendar", () => {
  it("skips Sunday when finding the next delivery date", () => {
    const sunday = parseDateOnly("2026-08-16");
    expect(isSunday(sunday)).toBe(true);
    expect(toDateOnly(nextDeliveryDate(sunday))).toBe("2026-08-17");
  });

  it("counts 26 delivery days excluding Sundays", () => {
    const start = parseDateOnly("2026-08-17");
    const end = addDeliveryDays(start, 26);
    expect(toDateOnly(end)).toBe("2026-09-15");
  });

  it("blocks skips inside the 5-hour window", () => {
    const now = new Date("2026-08-15T13:00:00+05:30");
    expect(canSkipMeal("2026-08-15", MealType.DINNER, now)).toBe(true);
    expect(canSkipMeal("2026-08-15", MealType.LUNCH, now)).toBe(false);
  });

  it("requires 24 hours before changing meal opt-in", () => {
    const now = new Date("2026-08-15T08:00:00+05:30");
    expect(canChangeMealOpt("2026-08-17", now)).toBe(true);
    expect(canChangeMealOpt("2026-08-16", now)).toBe(false);
  });
});
