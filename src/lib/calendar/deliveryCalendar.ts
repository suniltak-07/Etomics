import { addDays, parseISO, startOfDay } from "date-fns";
import { MealType } from "@/types/enums";

const KOLKATA = "Asia/Kolkata";

export const MEAL_WINDOW_MINUTES: Record<
  Exclude<MealType, "SNACK">,
  { hour: number; minute: number }
> = {
  [MealType.BREAKFAST]: { hour: 7, minute: 0 },
  [MealType.LUNCH]: { hour: 12, minute: 30 },
  [MealType.DINNER]: { hour: 19, minute: 0 },
};

export const SKIP_LEAD_HOURS = 5;
export const OPT_CHANGE_LEAD_HOURS = 24;
export const FULL_PLAN_DELIVERY_DAYS = 26;
export const TRIAL_CALENDAR_DAYS = 7;

export function isSunday(date: Date): boolean {
  return date.getDay() === 0;
}

export function parseDateOnly(value: string): Date {
  const parsed = parseISO(value.length === 10 ? `${value}T00:00:00` : value);
  return startOfDay(parsed);
}

export function toDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function nextDeliveryDate(from: Date): Date {
  let cursor = startOfDay(from);
  if (isSunday(cursor)) {
    cursor = addDays(cursor, 1);
  }
  return cursor;
}

export function addDeliveryDays(start: Date, deliveryDays: number): Date {
  if (deliveryDays < 1) {
    throw new Error("deliveryDays must be at least 1");
  }
  let remaining = deliveryDays;
  let cursor = nextDeliveryDate(start);
  remaining -= 1;
  while (remaining > 0) {
    cursor = addDays(cursor, 1);
    if (!isSunday(cursor)) {
      remaining -= 1;
    }
  }
  return cursor;
}

export function addCalendarDaysInclusive(
  start: Date,
  calendarDays: number,
): Date {
  return addDays(nextDeliveryDate(start), calendarDays - 1);
}

export function isDeliveryDay(date: Date): boolean {
  return !isSunday(date);
}

function zonedParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: KOLKATA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value ?? "0");
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
  };
}

/** Approximate IST instant for a local wall clock on a date-only string. */
export function mealWindowStart(dateOnly: string, mealType: MealType): Date {
  const window =
    mealType === MealType.SNACK
      ? MEAL_WINDOW_MINUTES[MealType.LUNCH]
      : MEAL_WINDOW_MINUTES[mealType];
  return new Date(
    `${dateOnly}T${String(window.hour).padStart(2, "0")}:${String(window.minute).padStart(2, "0")}:00+05:30`,
  );
}

export function hoursUntil(target: Date, now: Date): number {
  return (target.getTime() - now.getTime()) / (1000 * 60 * 60);
}

export function canSkipMeal(
  dateOnly: string,
  mealType: MealType,
  now: Date,
): boolean {
  return (
    hoursUntil(mealWindowStart(dateOnly, mealType), now) >= SKIP_LEAD_HOURS
  );
}

export function canChangeMealOpt(
  firstAffectedDate: string,
  now: Date,
): boolean {
  const firstWindow = mealWindowStart(firstAffectedDate, MealType.BREAKFAST);
  return hoursUntil(firstWindow, now) >= OPT_CHANGE_LEAD_HOURS;
}

export function upcomingDeliveryDates(
  startDate: string,
  endDate: string,
  limit = 14,
): string[] {
  const dates: string[] = [];
  let cursor = parseDateOnly(startDate);
  const end = parseDateOnly(endDate);
  while (cursor <= end && dates.length < limit) {
    if (!isSunday(cursor)) {
      dates.push(toDateOnly(cursor));
    }
    cursor = addDays(cursor, 1);
  }
  return dates;
}

export { zonedParts };
