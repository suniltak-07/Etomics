import type { NextRequest } from "next/server";
import type { Voucher } from "@/types/entities";
import { getDb, mutate } from "@/mocks/seed";
import { Permission } from "@/lib/permissions/permissions";
import { ErrorCode } from "@/lib/api/errors";
import {
  createId,
  isErrorResponse,
  jsonError,
  jsonOk,
  jsonPaginated,
  nowIso,
  paginate,
  parseJsonBody,
  parsePagination,
  requireAuth,
  requirePermission,
} from "@/lib/api/route-helpers";
import { createVoucherSchema } from "@/features/vouchers/schemas/voucherSchemas";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (isErrorResponse(auth)) return auth;

  const denied = requirePermission(auth, Permission.VOUCHERS_READ);
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const { page, pageSize } = parsePagination(searchParams);
  const status = searchParams.get("status");
  const search = searchParams.get("search")?.trim().toLowerCase();

  let vouchers = getDb().vouchers;
  if (status) {
    vouchers = vouchers.filter((voucher) => voucher.status === status);
  }
  if (search) {
    vouchers = vouchers.filter(
      (voucher) =>
        voucher.code.toLowerCase().includes(search) ||
        voucher.name.toLowerCase().includes(search),
    );
  }

  const { items, meta } = paginate(vouchers, page, pageSize);
  return jsonPaginated(items, meta);
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (isErrorResponse(auth)) return auth;

  const denied = requirePermission(auth, Permission.VOUCHERS_CREATE);
  if (denied) return denied;

  const body = await parseJsonBody(request);
  if (isErrorResponse(body)) return body;

  const parsed = createVoucherSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation failed", 422, ErrorCode.VALIDATION_ERROR, {
      issues: parsed.error.flatten(),
    });
  }

  const code = parsed.data.code.trim().toUpperCase();
  if (getDb().vouchers.some((voucher) => voucher.code.toUpperCase() === code)) {
    return jsonError("Voucher code already exists", 409, ErrorCode.CONFLICT);
  }

  const timestamp = nowIso();
  const voucher: Voucher = {
    id: createId("voucher"),
    code,
    name: parsed.data.name,
    description: parsed.data.description,
    discountType: parsed.data.discountType,
    discountValue: parsed.data.discountValue,
    maxDiscount: parsed.data.maxDiscount,
    minimumOrderValue: parsed.data.minimumOrderValue,
    startDate: parsed.data.startDate,
    expiryDate: parsed.data.expiryDate,
    usageLimit: parsed.data.usageLimit,
    usagePerCustomer: parsed.data.usagePerCustomer,
    usedCount: 0,
    applicablePlans: parsed.data.applicablePlans,
    status: parsed.data.status,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  mutate((db) => {
    db.vouchers.push(voucher);
  });

  return jsonOk(voucher, { status: 201, message: "Voucher created" });
}
