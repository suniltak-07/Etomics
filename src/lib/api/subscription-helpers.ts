import type { Plan, Subscription, Voucher } from "@/types/entities";
import {
  DurationKind,
  DurationUnit,
  MealType,
  SubscriptionStatus,
} from "@/types/enums";
import {
  calculateCheckoutPricing,
  calculateTrialPrice,
} from "@/lib/pricing/pricingEngine";
import {
  addCalendarDaysInclusive,
  addDeliveryDays,
  FULL_PLAN_DELIVERY_DAYS,
  nextDeliveryDate,
  parseDateOnly,
  toDateOnly,
  TRIAL_CALENDAR_DAYS,
} from "@/lib/calendar/deliveryCalendar";
import { createId, nowIso } from "@/lib/api/route-helpers";

export function resolvePlanCharge(
  plan: Plan,
  durationKind: DurationKind = DurationKind.FULL,
): number {
  return durationKind === DurationKind.TRIAL
    ? calculateTrialPrice(plan.price)
    : plan.price;
}

export function computeSubscriptionEndDate(
  startDate: Date,
  durationKind: DurationKind,
  plan: Plan,
): Date {
  const start = nextDeliveryDate(startDate);
  if (durationKind === DurationKind.TRIAL) {
    return addCalendarDaysInclusive(start, TRIAL_CALENDAR_DAYS);
  }
  if (plan.durationUnit === DurationUnit.DAYS) {
    return addDeliveryDays(start, plan.duration);
  }
  return addDeliveryDays(start, FULL_PLAN_DELIVERY_DAYS);
}

export function addPlanDuration(startDate: Date, plan: Plan): Date {
  return computeSubscriptionEndDate(startDate, DurationKind.FULL, plan);
}

export { toDateOnly };

export function computeSubscriptionPricing(
  plan: Plan,
  voucher?: Voucher | null,
  durationKind: DurationKind = DurationKind.FULL,
) {
  const planPrice = resolvePlanCharge(plan, durationKind);
  return calculateCheckoutPricing({
    planPrice,
    compareAtPrice:
      durationKind === DurationKind.TRIAL ? undefined : plan.compareAtPrice,
    voucher: voucher ?? null,
    planId: plan.id,
  });
}

export function buildSubscriptionRecord(input: {
  customerId: string;
  plan: Plan;
  addressId: string;
  pricing: ReturnType<typeof computeSubscriptionPricing>;
  voucherId?: string;
  paymentId?: string;
  status?: SubscriptionStatus;
  durationKind?: DurationKind;
  mealTypes?: MealType[];
  startDate?: string;
}): Subscription {
  const timestamp = nowIso();
  const durationKind = input.durationKind ?? DurationKind.FULL;
  const start = input.startDate
    ? nextDeliveryDate(parseDateOnly(input.startDate))
    : nextDeliveryDate(new Date());
  const end = computeSubscriptionEndDate(start, durationKind, input.plan);

  return {
    id: createId("sub"),
    customerId: input.customerId,
    planId: input.plan.id,
    addressId: input.addressId,
    startDate: toDateOnly(start),
    endDate: toDateOnly(end),
    status: input.status ?? SubscriptionStatus.PENDING,
    durationKind,
    mealTypes:
      input.mealTypes && input.mealTypes.length > 0
        ? input.mealTypes
        : input.plan.mealTypes,
    price: input.pricing.planPrice,
    planDiscount: input.pricing.planDiscount,
    voucherDiscount: input.pricing.voucherDiscount,
    tax: input.pricing.tax,
    deliveryFee: input.pricing.deliveryFee,
    finalAmount: input.pricing.finalAmount,
    voucherId: input.voucherId,
    paymentId: input.paymentId,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}
