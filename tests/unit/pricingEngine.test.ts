import { describe, expect, it } from "vitest";
import {
  calculateCheckoutPricing,
  calculateTrialPrice,
  evaluateVoucherEligibility,
} from "@/lib/pricing/pricingEngine";
import { DiscountType, VoucherStatus } from "@/types/enums";

const now = new Date("2026-08-10T12:00:00.000Z");

function activeVoucher(
  overrides: Partial<
    Parameters<typeof calculateCheckoutPricing>[0]["voucher"]
  > = {},
) {
  return {
    code: "TEST10",
    discountType: DiscountType.PERCENTAGE,
    discountValue: 10,
    maxDiscount: undefined as number | undefined,
    minimumOrderValue: undefined as number | undefined,
    startDate: "2026-01-01T00:00:00.000Z",
    expiryDate: "2026-12-31T23:59:59.000Z",
    usageLimit: 100,
    usedCount: 0,
    applicablePlans: [] as string[],
    status: VoucherStatus.ACTIVE,
    ...overrides,
  };
}

describe("calculateCheckoutPricing", () => {
  it("computes plan discount from compareAtPrice", () => {
    const result = calculateCheckoutPricing({
      planPrice: 4999,
      compareAtPrice: 5999,
      now,
    });

    expect(result.planDiscount).toBe(1000);
    expect(result.planPrice).toBe(4999);
    expect(result.voucherDiscount).toBe(0);
    expect(result.finalAmount).toBe(4999);
  });

  it("does not invent a plan discount when compareAtPrice is missing or lower", () => {
    expect(
      calculateCheckoutPricing({ planPrice: 4999, now }).planDiscount,
    ).toBe(0);
    expect(
      calculateCheckoutPricing({
        planPrice: 4999,
        compareAtPrice: 4000,
        now,
      }).planDiscount,
    ).toBe(0);
  });

  it("applies a percentage voucher discount", () => {
    const result = calculateCheckoutPricing({
      planPrice: 5000,
      voucher: activeVoucher({
        discountType: DiscountType.PERCENTAGE,
        discountValue: 10,
      }),
      now,
    });

    expect(result.voucherDiscount).toBe(500);
    expect(result.subtotal).toBe(4500);
    expect(result.finalAmount).toBe(4500);
  });

  it("applies a fixed-amount voucher discount", () => {
    const result = calculateCheckoutPricing({
      planPrice: 5499,
      voucher: activeVoucher({
        code: "FLAT500",
        discountType: DiscountType.FIXED_AMOUNT,
        discountValue: 500,
        minimumOrderValue: 4000,
      }),
      planId: "plan_lite",
      now,
    });

    expect(result.voucherDiscount).toBe(500);
    expect(result.subtotal).toBe(4999);
  });

  it("caps percentage discount at maxDiscount", () => {
    const result = calculateCheckoutPricing({
      planPrice: 20000,
      voucher: activeVoucher({
        discountType: DiscountType.PERCENTAGE,
        discountValue: 20,
        maxDiscount: 1000,
      }),
      now,
    });

    expect(result.voucherDiscount).toBe(1000);
    expect(result.subtotal).toBe(19000);
  });

  it("adds tax on subtotal after voucher and delivery", () => {
    const result = calculateCheckoutPricing({
      planPrice: 1000,
      voucher: activeVoucher({
        discountType: DiscountType.FIXED_AMOUNT,
        discountValue: 100,
      }),
      deliveryFee: 50,
      taxRate: 0.05,
      now,
    });

    // subtotal = (1000 - 100) + 50 = 950; tax = 47.5
    expect(result.voucherDiscount).toBe(100);
    expect(result.deliveryFee).toBe(50);
    expect(result.subtotal).toBe(950);
    expect(result.tax).toBe(47.5);
    expect(result.finalAmount).toBe(997.5);
  });

  it("includes delivery fee with no voucher", () => {
    const result = calculateCheckoutPricing({
      planPrice: 4999,
      deliveryFee: 99,
      now,
    });

    expect(result.deliveryFee).toBe(99);
    expect(result.subtotal).toBe(5098);
    expect(result.finalAmount).toBe(5098);
  });

  it("throws when an ineligible voucher is supplied", () => {
    expect(() =>
      calculateCheckoutPricing({
        planPrice: 4999,
        voucher: activeVoucher({ status: VoucherStatus.INACTIVE }),
        now,
      }),
    ).toThrow(/not active/i);
  });
});

describe("calculateTrialPrice", () => {
  it("quotes a 7-day trial as plan price divided by 7, rounded to the nearest rupee", () => {
    expect(calculateTrialPrice(2999)).toBe(428);
    expect(calculateTrialPrice(11999)).toBe(1714);
  });
});

describe("evaluateVoucherEligibility", () => {
  it("rejects expired vouchers", () => {
    const result = evaluateVoucherEligibility(
      activeVoucher({
        expiryDate: "2026-01-01T00:00:00.000Z",
      })!,
      5000,
      "plan_starter",
      now,
    );

    expect(result.eligible).toBe(false);
    expect(result.errorCode).toBe("VOUCHER_EXPIRED");
  });

  it("rejects plans outside applicablePlans", () => {
    const result = evaluateVoucherEligibility(
      activeVoucher({
        applicablePlans: ["plan_family"],
      })!,
      5000,
      "plan_starter",
      now,
    );

    expect(result.eligible).toBe(false);
    expect(result.errorCode).toBe("PLAN_NOT_ELIGIBLE");
  });
});
