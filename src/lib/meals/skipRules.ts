import { MealType } from "@/types/enums";
import {
  canChangeMealOpt,
  canSkipMeal,
  OPT_CHANGE_LEAD_HOURS,
  SKIP_LEAD_HOURS,
  toDateOnly,
} from "@/lib/calendar/deliveryCalendar";

export function assertCanSkipMeal(
  dateOnly: string,
  mealType: MealType,
  now: Date = new Date(),
): void {
  if (!canSkipMeal(dateOnly, mealType, now)) {
    throw new Error(
      `Meals can be skipped only ${SKIP_LEAD_HOURS} hours before the delivery window.`,
    );
  }
}

export function assertCanChangeMealOpt(
  firstAffectedDate: string,
  now: Date = new Date(),
): void {
  if (!canChangeMealOpt(firstAffectedDate, now)) {
    throw new Error(
      `Meal choices can be updated only ${OPT_CHANGE_LEAD_HOURS} hours before the first affected delivery.`,
    );
  }
}

export function defaultFirstAffectedDate(now: Date = new Date()): string {
  return toDateOnly(
    new Date(
      now.getTime() + OPT_CHANGE_LEAD_HOURS * 60 * 60 * 1000 + 60 * 60 * 1000,
    ),
  );
}
