import type { MealSkip, Subscription } from "@/types/entities";
import type { MockDb } from "@/mocks/seed";
import { MealType, SubscriptionStatus } from "@/types/enums";
import { isSunday, parseDateOnly } from "@/lib/calendar/deliveryCalendar";

export interface KitchenSheetRow {
  id: string;
  subscriptionId: string;
  customerId: string;
  customerName: string;
  mobile?: string;
  planId: string;
  planName: string;
  mealTypes: MealType[];
  foodPreference?: string;
  allergies: string[];
  healthGoal?: string;
  address: string;
  pincode: string;
  city: string;
  latitude?: number;
  longitude?: number;
  skippedMealTypes: MealType[];
}

export function hasActiveCoverage(
  subscription: Subscription,
  dateOnly: string,
): boolean {
  if (subscription.status !== SubscriptionStatus.ACTIVE) return false;
  return dateOnly >= subscription.startDate && dateOnly <= subscription.endDate;
}

export function mealsDueOnDate(
  subscription: Subscription,
  dateOnly: string,
  skips: MealSkip[],
  mealFilter?: MealType | null,
): MealType[] {
  const skipped = new Set(
    skips
      .filter(
        (skip) =>
          skip.subscriptionId === subscription.id && skip.date === dateOnly,
      )
      .map((skip) => skip.mealType),
  );
  return subscription.mealTypes.filter((mealType) => {
    if (mealFilter && mealType !== mealFilter) return false;
    return !skipped.has(mealType);
  });
}

export function buildKitchenSheet(
  db: MockDb,
  dateOnly: string,
  mealFilter?: MealType | null,
): KitchenSheetRow[] {
  if (isSunday(parseDateOnly(dateOnly))) {
    return [];
  }

  const rows: KitchenSheetRow[] = [];

  for (const subscription of db.subscriptions) {
    if (!hasActiveCoverage(subscription, dateOnly)) continue;
    const due = mealsDueOnDate(
      subscription,
      dateOnly,
      db.mealSkips,
      mealFilter,
    );
    if (due.length === 0) continue;

    const customer = db.customers.find(
      (item) => item.id === subscription.customerId,
    );
    const plan = db.plans.find((item) => item.id === subscription.planId);
    const address = db.addresses.find(
      (item) => item.id === subscription.addressId,
    );
    if (!customer || !plan || !address) continue;

    const skippedMealTypes = db.mealSkips
      .filter(
        (skip) =>
          skip.subscriptionId === subscription.id && skip.date === dateOnly,
      )
      .map((skip) => skip.mealType);

    rows.push({
      id: subscription.id,
      subscriptionId: subscription.id,
      customerId: customer.id,
      customerName: `${customer.firstName} ${customer.lastName}`,
      mobile: customer.mobile,
      planId: plan.id,
      planName: plan.name,
      mealTypes: due,
      foodPreference: customer.preferences?.foodPreference,
      allergies: customer.preferences?.allergies ?? [],
      healthGoal: customer.preferences?.healthGoal,
      address: [
        address.addressLine1,
        address.addressLine2,
        address.area,
        address.city,
      ]
        .filter(Boolean)
        .join(", "),
      pincode: address.pincode,
      city: address.city,
      latitude: address.latitude,
      longitude: address.longitude,
      skippedMealTypes,
    });
  }

  return rows.sort((a, b) => a.customerName.localeCompare(b.customerName));
}
