import type { Voucher } from "@/types/entities";
import { DiscountType, VoucherStatus } from "@/types/enums";

export type VoucherValidationErrorCode =
  | "VOUCHER_NOT_FOUND"
  | "VOUCHER_INACTIVE"
  | "VOUCHER_NOT_STARTED"
  | "VOUCHER_EXPIRED"
  | "USAGE_LIMIT_REACHED"
  | "CUSTOMER_USAGE_LIMIT_REACHED"
  | "MINIMUM_ORDER_NOT_MET"
  | "PLAN_NOT_ELIGIBLE"
  | "INVALID_VOUCHER";

export interface ValidateVoucherInput {
  voucher: Voucher | null | undefined;
  planPrice: number;
  planId?: string;
  /** How many times this customer has already used the voucher */
  customerUsageCount?: number;
  now?: Date;
}

export interface ValidateVoucherResult {
  valid: boolean;
  errorCode?: VoucherValidationErrorCode;
  message?: string;
  discountAmount?: number;
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function computeDiscount(voucher: Voucher, planPrice: number): number {
  let discountAmount = 0;

  if (voucher.discountType === DiscountType.PERCENTAGE) {
    discountAmount = (planPrice * voucher.discountValue) / 100;
    if (typeof voucher.maxDiscount === "number") {
      discountAmount = Math.min(discountAmount, voucher.maxDiscount);
    }
  } else if (voucher.discountType === DiscountType.FIXED_AMOUNT) {
    discountAmount = voucher.discountValue;
  }

  return roundMoney(Math.min(Math.max(discountAmount, 0), planPrice));
}

/**
 * Pure voucher validation covering all checkout rules from the EatOmics spec.
 */
export function validateVoucher(
  input: ValidateVoucherInput,
): ValidateVoucherResult {
  const {
    voucher,
    planPrice,
    planId,
    customerUsageCount = 0,
    now = new Date(),
  } = input;

  if (!voucher) {
    return {
      valid: false,
      errorCode: "VOUCHER_NOT_FOUND",
      message: "Voucher does not exist",
    };
  }

  if (voucher.status === VoucherStatus.EXPIRED) {
    return {
      valid: false,
      errorCode: "VOUCHER_EXPIRED",
      message: "Voucher has expired",
    };
  }

  if (
    voucher.status === VoucherStatus.INACTIVE ||
    voucher.status === VoucherStatus.DRAFT
  ) {
    return {
      valid: false,
      errorCode: "VOUCHER_INACTIVE",
      message: "Voucher is not active",
    };
  }

  if (voucher.status !== VoucherStatus.ACTIVE) {
    return {
      valid: false,
      errorCode: "VOUCHER_INACTIVE",
      message: "Voucher is not active",
    };
  }

  const start = new Date(voucher.startDate);
  const expiry = new Date(voucher.expiryDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(expiry.getTime())) {
    return {
      valid: false,
      errorCode: "INVALID_VOUCHER",
      message: "Voucher configuration is invalid",
    };
  }

  if (now < start) {
    return {
      valid: false,
      errorCode: "VOUCHER_NOT_STARTED",
      message: "Voucher has not started yet",
    };
  }

  if (now > expiry) {
    return {
      valid: false,
      errorCode: "VOUCHER_EXPIRED",
      message: "Voucher has expired",
    };
  }

  if (
    typeof voucher.usageLimit === "number" &&
    voucher.usedCount >= voucher.usageLimit
  ) {
    return {
      valid: false,
      errorCode: "USAGE_LIMIT_REACHED",
      message: "Voucher usage limit has been reached",
    };
  }

  if (
    typeof voucher.usagePerCustomer === "number" &&
    customerUsageCount >= voucher.usagePerCustomer
  ) {
    return {
      valid: false,
      errorCode: "CUSTOMER_USAGE_LIMIT_REACHED",
      message: "You have already used this voucher the maximum number of times",
    };
  }

  if (
    typeof voucher.minimumOrderValue === "number" &&
    planPrice < voucher.minimumOrderValue
  ) {
    return {
      valid: false,
      errorCode: "MINIMUM_ORDER_NOT_MET",
      message: `Minimum order value of ${voucher.minimumOrderValue} required`,
    };
  }

  if (
    voucher.applicablePlans &&
    voucher.applicablePlans.length > 0 &&
    planId &&
    !voucher.applicablePlans.includes(planId)
  ) {
    return {
      valid: false,
      errorCode: "PLAN_NOT_ELIGIBLE",
      message: "Voucher is not applicable to this plan",
    };
  }

  const discountAmount = computeDiscount(voucher, planPrice);

  return {
    valid: true,
    discountAmount,
    message: "Voucher applied successfully",
  };
}
