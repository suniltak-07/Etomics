import { afterEach, describe, expect, it } from "vitest";
import { getDb, resetDb } from "@/mocks/seed";
import { validateVoucher } from "@/features/vouchers/utils/validateVoucher";
import type { Voucher } from "@/types/entities";
import { DiscountType, VoucherStatus } from "@/types/enums";

const now = new Date("2026-08-10T12:00:00.000Z");

function baseVoucher(overrides: Partial<Voucher> = {}): Voucher {
  return {
    id: "voucher_test",
    code: "TEST",
    name: "Test voucher",
    discountType: DiscountType.PERCENTAGE,
    discountValue: 10,
    maxDiscount: 1000,
    minimumOrderValue: 2000,
    startDate: "2026-01-01T00:00:00.000Z",
    expiryDate: "2026-12-31T23:59:59.000Z",
    usageLimit: 100,
    usagePerCustomer: 1,
    usedCount: 0,
    applicablePlans: [],
    status: VoucherStatus.ACTIVE,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-08-10T10:00:00.000Z",
    ...overrides,
  };
}

afterEach(() => {
  resetDb();
});

describe("validateVoucher", () => {
  it("rejects a missing voucher", () => {
    const result = validateVoucher({ voucher: null, planPrice: 5000, now });
    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe("VOUCHER_NOT_FOUND");
  });

  it("rejects expired status and date-expired vouchers", () => {
    expect(
      validateVoucher({
        voucher: baseVoucher({ status: VoucherStatus.EXPIRED }),
        planPrice: 5000,
        now,
      }).errorCode,
    ).toBe("VOUCHER_EXPIRED");

    expect(
      validateVoucher({
        voucher: baseVoucher({
          status: VoucherStatus.ACTIVE,
          expiryDate: "2026-01-01T00:00:00.000Z",
        }),
        planPrice: 5000,
        now,
      }).errorCode,
    ).toBe("VOUCHER_EXPIRED");
  });

  it("rejects inactive and draft vouchers", () => {
    expect(
      validateVoucher({
        voucher: baseVoucher({ status: VoucherStatus.INACTIVE }),
        planPrice: 5000,
        now,
      }).errorCode,
    ).toBe("VOUCHER_INACTIVE");

    expect(
      validateVoucher({
        voucher: baseVoucher({ status: VoucherStatus.DRAFT }),
        planPrice: 5000,
        now,
      }).errorCode,
    ).toBe("VOUCHER_INACTIVE");
  });

  it("rejects when minimum order value is not met", () => {
    const result = validateVoucher({
      voucher: baseVoucher({ minimumOrderValue: 8000 }),
      planPrice: 4999,
      now,
    });

    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe("MINIMUM_ORDER_NOT_MET");
  });

  it("rejects plans outside applicablePlans", () => {
    const result = validateVoucher({
      voucher: baseVoucher({
        applicablePlans: ["plan_family"],
      }),
      planPrice: 5000,
      planId: "plan_starter",
      now,
    });

    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe("PLAN_NOT_ELIGIBLE");
  });

  it("rejects when global usage limit is reached", () => {
    const result = validateVoucher({
      voucher: baseVoucher({ usageLimit: 10, usedCount: 10 }),
      planPrice: 5000,
      now,
    });

    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe("USAGE_LIMIT_REACHED");
  });

  it("rejects when customer usage limit is reached", () => {
    const result = validateVoucher({
      voucher: baseVoucher({ usagePerCustomer: 1 }),
      planPrice: 5000,
      customerUsageCount: 1,
      now,
    });

    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe("CUSTOMER_USAGE_LIMIT_REACHED");
  });

  it("accepts seed WELCOME10 and returns capped percentage discount", () => {
    const db = getDb();
    const welcome = db.vouchers.find((v) => v.code === "WELCOME10");
    expect(welcome).toBeDefined();

    const result = validateVoucher({
      voucher: welcome,
      planPrice: 20000,
      planId: "plan_diabetic",
      now,
    });

    expect(result.valid).toBe(true);
    // 10% of 20000 = 2000, capped by maxDiscount 1000
    expect(result.discountAmount).toBe(1000);
  });

  it("accepts seed FLAT500 for an eligible plan", () => {
    const db = getDb();
    const flat = db.vouchers.find((v) => v.code === "FLAT500");

    const result = validateVoucher({
      voucher: flat,
      planPrice: 5499,
      planId: "plan_lite",
      now,
    });

    expect(result.valid).toBe(true);
    expect(result.discountAmount).toBe(500);
  });

  it("rejects vouchers that have not started yet", () => {
    const result = validateVoucher({
      voucher: baseVoucher({
        startDate: "2026-09-01T00:00:00.000Z",
      }),
      planPrice: 5000,
      now,
    });

    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe("VOUCHER_NOT_STARTED");
  });
});
