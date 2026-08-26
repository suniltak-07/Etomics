import type { NextResponse } from "next/server";
import { jsonError } from "@/lib/api/route-helpers";
import { ErrorCode } from "@/lib/api/errors";
import { applyUpstreamCookies, ofoodErrorResponse } from "@/lib/backend/proxy";
import type { OfoodApiError } from "@/lib/backend/types";
import type { Voucher } from "@/types/entities";
import { DiscountType, VoucherStatus } from "@/types/enums";
import type {
  CreateVoucherInput,
  UpdateVoucherInput,
} from "@/features/vouchers/schemas/voucherSchemas";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  return [];
}

function unwrapPayload(payload: unknown): unknown {
  if (Array.isArray(payload) || !isRecord(payload)) return payload;
  if ("id" in payload && typeof payload.id === "string") return payload;
  if ("data" in payload) return unwrapPayload(payload.data);
  if (Array.isArray(payload.content)) return payload.content;
  return payload;
}

export function unwrapOfoodVouchers(payload: unknown): unknown[] {
  const unwrapped = unwrapPayload(payload);
  return Array.isArray(unwrapped) ? unwrapped : [];
}

export function unwrapOfoodVoucher(payload: unknown): unknown {
  const unwrapped = unwrapPayload(payload);
  return isRecord(unwrapped) ? unwrapped : null;
}

function mapDiscountType(value: unknown): DiscountType {
  const raw = asString(value).toUpperCase();
  if ((Object.values(DiscountType) as string[]).includes(raw)) {
    return raw as DiscountType;
  }
  return DiscountType.PERCENTAGE;
}

function mapStatus(value: unknown): VoucherStatus {
  const raw = asString(value).toUpperCase();
  if ((Object.values(VoucherStatus) as string[]).includes(raw)) {
    return raw as VoucherStatus;
  }
  return VoucherStatus.DRAFT;
}

function optionalNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function omitUndefined<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => {
      if (item === undefined) return false;
      if (typeof item === "number" && Number.isNaN(item)) return false;
      return true;
    }),
  ) as T;
}

export function mapOfoodVoucher(payload: unknown): Voucher | null {
  const raw = unwrapOfoodVoucher(payload);
  if (!isRecord(raw) || typeof raw.id !== "string") return null;

  const applicablePlans = asStringArray(
    raw.applicablePlanIds ?? raw.applicablePlans,
  );

  return {
    id: raw.id,
    code: asString(raw.code),
    name: asString(raw.name),
    description: asString(raw.description) || undefined,
    discountType: mapDiscountType(raw.discountType),
    discountValue: asNumber(raw.discountValue),
    maxDiscount: optionalNumber(raw.maxDiscount),
    minimumOrderValue: optionalNumber(raw.minimumOrderValue),
    startDate: asString(raw.startDate),
    expiryDate: asString(raw.expiryDate),
    usageLimit: optionalNumber(raw.usageLimit),
    usagePerCustomer: optionalNumber(raw.usagePerCustomer),
    usedCount: asNumber(raw.usedCount, 0),
    applicablePlans: applicablePlans.length > 0 ? applicablePlans : undefined,
    status: mapStatus(raw.status),
    createdAt: asString(raw.createdAt),
    updatedAt: asString(raw.updatedAt),
  };
}

export function toOfoodWriteBody(
  input: CreateVoucherInput | UpdateVoucherInput,
  existing?: Voucher | null,
): Record<string, unknown> {
  const code = (input.code ?? existing?.code ?? "").trim().toUpperCase();
  const name = (input.name ?? existing?.name ?? "").trim();
  const discountType = input.discountType ?? existing?.discountType;
  const discountValue = input.discountValue ?? existing?.discountValue;
  const status = input.status ?? existing?.status;

  const applicableSource =
    input.applicablePlans !== undefined
      ? input.applicablePlans
      : existing?.applicablePlans;
  const applicablePlanIds =
    applicableSource && applicableSource.length > 0 ? applicableSource : null;

  const description =
    input.description !== undefined
      ? input.description.trim() || null
      : existing?.description;

  return omitUndefined({
    code,
    name,
    description,
    discountType,
    discountValue,
    maxDiscount:
      input.maxDiscount !== undefined
        ? input.maxDiscount
        : existing?.maxDiscount,
    minimumOrderValue:
      input.minimumOrderValue !== undefined
        ? input.minimumOrderValue
        : existing?.minimumOrderValue,
    startDate: input.startDate ?? existing?.startDate,
    expiryDate: input.expiryDate ?? existing?.expiryDate,
    usageLimit:
      input.usageLimit !== undefined ? input.usageLimit : existing?.usageLimit,
    usagePerCustomer:
      input.usagePerCustomer !== undefined
        ? input.usagePerCustomer
        : existing?.usagePerCustomer,
    status,
    applicablePlanIds,
  });
}

export function mapOfoodValidation(
  payload: unknown,
  fallback: { code: string; planPrice: number },
): {
  valid: boolean;
  code: string;
  voucherId: string;
  discountAmount: number;
  planPrice: number;
  message?: string;
} | null {
  const raw = unwrapPayload(payload);
  if (!isRecord(raw)) return null;

  const valid = asBoolean(raw.valid, false);
  const discountAmount = asNumber(raw.discountAmount, 0);
  const message = asString(raw.message) || undefined;

  return {
    valid,
    code: asString(raw.voucherCode, fallback.code),
    voucherId: asString(raw.voucherId),
    discountAmount,
    planPrice:
      typeof raw.finalAmount === "number"
        ? asNumber(raw.finalAmount) + discountAmount
        : fallback.planPrice,
    message,
  };
}

export function voucherFailedUpstream(
  status: number,
  error: OfoodApiError | null,
  cookies: string[],
  fallback: string,
): NextResponse {
  return applyUpstreamCookies(
    ofoodErrorResponse(status, error, fallback),
    cookies,
  );
}

export function voucherUnreadable(
  cookies: string[],
  fallback: string,
): NextResponse {
  return voucherFailedUpstream(
    502,
    { code: ErrorCode.BAD_GATEWAY, message: fallback },
    cookies,
    fallback,
  );
}

export function missingAccessToken() {
  return jsonError("Unauthorized", 401, ErrorCode.UNAUTHORIZED);
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function looksLikeUuid(value: string): boolean {
  return UUID_RE.test(value);
}
