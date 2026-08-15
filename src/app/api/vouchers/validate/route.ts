import type { NextRequest } from "next/server";
import { getDb } from "@/mocks/seed";
import { ErrorCode } from "@/lib/api/errors";
import {
  countCustomerVoucherUsage,
  getAuthUser,
  isErrorResponse,
  jsonError,
  jsonOk,
  parseJsonBody,
} from "@/lib/api/route-helpers";
import { validateVoucherSchema } from "@/features/vouchers/schemas/voucherSchemas";
import { validateVoucher } from "@/features/vouchers/utils/validateVoucher";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = await parseJsonBody(request);
  if (isErrorResponse(body)) return body;

  const parsed = validateVoucherSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation failed", 422, ErrorCode.VALIDATION_ERROR, {
      issues: parsed.error.flatten(),
    });
  }

  const db = getDb();
  const plan = db.plans.find((item) => item.id === parsed.data.planId);
  if (!plan) {
    return jsonError("Plan not found", 404, ErrorCode.NOT_FOUND);
  }

  const voucher = db.vouchers.find(
    (item) => item.code.toUpperCase() === parsed.data.code.trim().toUpperCase(),
  );

  const auth = getAuthUser(request);
  const customerId = parsed.data.customerId ?? auth?.id;
  const customerUsageCount = customerId
    ? countCustomerVoucherUsage(customerId, voucher?.id ?? "")
    : 0;

  const planPrice = parsed.data.orderAmount ?? plan.price;
  const result = validateVoucher({
    voucher,
    planPrice,
    planId: plan.id,
    customerUsageCount,
  });

  if (!result.valid) {
    return jsonError(
      result.message ?? "Voucher is invalid",
      422,
      result.errorCode ?? ErrorCode.VALIDATION_ERROR,
    );
  }

  return jsonOk({
    valid: true,
    code: voucher!.code,
    voucherId: voucher!.id,
    discountAmount: result.discountAmount ?? 0,
    planPrice,
    message: result.message,
  });
}
