import type { Voucher } from "@/types/entities";
import { DiscountType, VoucherStatus } from "@/types/enums";

export interface CheckoutPricingInput {
  planPrice: number;
  compareAtPrice?: number;
  voucher?: Pick<
    Voucher,
    | "code"
    | "discountType"
    | "discountValue"
    | "maxDiscount"
    | "minimumOrderValue"
    | "startDate"
    | "expiryDate"
    | "usageLimit"
    | "usedCount"
    | "applicablePlans"
    | "status"
  > | null;
  planId?: string;
  taxRate?: number;
  deliveryFee?: number;
  now?: Date;
}

export interface CheckoutPricingResult {
  planPrice: number;
  planDiscount: number;
  voucherDiscount: number;
  tax: number;
  deliveryFee: number;
  subtotal: number;
  finalAmount: number;
}

export type VoucherEligibilityError =
  | "VOUCHER_INACTIVE"
  | "VOUCHER_NOT_STARTED"
  | "VOUCHER_EXPIRED"
  | "USAGE_LIMIT_REACHED"
  | "MINIMUM_ORDER_NOT_MET"
  | "PLAN_NOT_ELIGIBLE"
  | "INVALID_VOUCHER";

export interface VoucherEligibilityResult {
  eligible: boolean;
  errorCode?: VoucherEligibilityError;
  message?: string;
  discountAmount: number;
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** 7-day trial quote: plan price divided by 7, rounded to the nearest rupee. */
export function calculateTrialPrice(planPrice: number): number {
  assertNonNegative(planPrice, "planPrice");
  return Math.round(planPrice / 7);
}

function assertNonNegative(value: number, field: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${field} must be a non-negative finite number`);
  }
}

/**
 * Server-side style voucher eligibility check used by the pricing engine.
 * Does not check per-customer usage (that requires customer context — see validateVoucher).
 */
export function evaluateVoucherEligibility(
  voucher: NonNullable<CheckoutPricingInput["voucher"]>,
  planPriceAfterPlanDiscount: number,
  planId?: string,
  now: Date = new Date(),
): VoucherEligibilityResult {
  if (!voucher) {
    return {
      eligible: false,
      errorCode: "INVALID_VOUCHER",
      message: "Voucher is invalid",
      discountAmount: 0,
    };
  }

  if (voucher.status !== VoucherStatus.ACTIVE) {
    return {
      eligible: false,
      errorCode: "VOUCHER_INACTIVE",
      message: "Voucher is not active",
      discountAmount: 0,
    };
  }

  const start = new Date(voucher.startDate);
  const expiry = new Date(voucher.expiryDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(expiry.getTime())) {
    return {
      eligible: false,
      errorCode: "INVALID_VOUCHER",
      message: "Voucher dates are invalid",
      discountAmount: 0,
    };
  }

  if (now < start) {
    return {
      eligible: false,
      errorCode: "VOUCHER_NOT_STARTED",
      message: "Voucher has not started yet",
      discountAmount: 0,
    };
  }

  if (now > expiry) {
    return {
      eligible: false,
      errorCode: "VOUCHER_EXPIRED",
      message: "Voucher has expired",
      discountAmount: 0,
    };
  }

  if (
    typeof voucher.usageLimit === "number" &&
    voucher.usedCount >= voucher.usageLimit
  ) {
    return {
      eligible: false,
      errorCode: "USAGE_LIMIT_REACHED",
      message: "Voucher usage limit has been reached",
      discountAmount: 0,
    };
  }

  if (
    typeof voucher.minimumOrderValue === "number" &&
    planPriceAfterPlanDiscount < voucher.minimumOrderValue
  ) {
    return {
      eligible: false,
      errorCode: "MINIMUM_ORDER_NOT_MET",
      message: `Minimum order value of ${voucher.minimumOrderValue} required`,
      discountAmount: 0,
    };
  }

  if (
    voucher.applicablePlans &&
    voucher.applicablePlans.length > 0 &&
    planId &&
    !voucher.applicablePlans.includes(planId)
  ) {
    return {
      eligible: false,
      errorCode: "PLAN_NOT_ELIGIBLE",
      message: "Voucher is not applicable to this plan",
      discountAmount: 0,
    };
  }

  let discountAmount = 0;

  if (voucher.discountType === DiscountType.PERCENTAGE) {
    discountAmount = (planPriceAfterPlanDiscount * voucher.discountValue) / 100;
    if (typeof voucher.maxDiscount === "number") {
      discountAmount = Math.min(discountAmount, voucher.maxDiscount);
    }
  } else if (voucher.discountType === DiscountType.FIXED_AMOUNT) {
    discountAmount = voucher.discountValue;
  }

  discountAmount = roundMoney(
    Math.min(Math.max(discountAmount, 0), planPriceAfterPlanDiscount),
  );

  return {
    eligible: true,
    discountAmount,
  };
}

/**
 * Centralized checkout pricing. Do not recalculate amounts in UI components.
 */
export function calculateCheckoutPricing(
  input: CheckoutPricingInput,
): CheckoutPricingResult {
  const {
    planPrice,
    compareAtPrice,
    voucher,
    planId,
    taxRate = 0,
    deliveryFee = 0,
    now = new Date(),
  } = input;

  assertNonNegative(planPrice, "planPrice");
  assertNonNegative(taxRate, "taxRate");
  assertNonNegative(deliveryFee, "deliveryFee");

  if (compareAtPrice !== undefined) {
    assertNonNegative(compareAtPrice, "compareAtPrice");
  }

  const planDiscount =
    compareAtPrice !== undefined && compareAtPrice > planPrice
      ? roundMoney(compareAtPrice - planPrice)
      : 0;

  const baseForVoucher = planPrice;

  let voucherDiscount = 0;
  if (voucher) {
    const eligibility = evaluateVoucherEligibility(
      voucher,
      baseForVoucher,
      planId,
      now,
    );
    if (!eligibility.eligible) {
      throw new Error(
        eligibility.message ?? `Voucher rejected: ${eligibility.errorCode}`,
      );
    }
    voucherDiscount = eligibility.discountAmount;
  }

  const subtotal = roundMoney(
    Math.max(planPrice - voucherDiscount, 0) + deliveryFee,
  );
  const tax = roundMoney(subtotal * taxRate);
  const finalAmount = roundMoney(subtotal + tax);

  return {
    planPrice: roundMoney(planPrice),
    planDiscount,
    voucherDiscount,
    tax,
    deliveryFee: roundMoney(deliveryFee),
    subtotal,
    finalAmount,
  };
}
