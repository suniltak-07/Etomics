import type { NextRequest } from "next/server";
import { ErrorCode } from "@/lib/api/errors";
import {
  isErrorResponse,
  jsonError,
  jsonOk,
  jsonPaginated,
  paginate,
  parseJsonBody,
  parsePagination,
} from "@/lib/api/route-helpers";
import { applyUpstreamCookies, ofoodFetch } from "@/lib/backend/proxy";
import { getRequestAccessToken } from "@/lib/backend/session";
import {
  mapOfoodVoucher,
  missingAccessToken,
  toOfoodWriteBody,
  unwrapOfoodVouchers,
  voucherFailedUpstream,
  voucherUnreadable,
} from "@/lib/backend/vouchers";
import { createVoucherSchema } from "@/features/vouchers/schemas/voucherSchemas";
import type { Voucher } from "@/types/entities";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const accessToken = getRequestAccessToken(request);

  const result = await ofoodFetch<unknown>("/api/v1/vouchers", { accessToken });
  if (!result.ok) {
    return voucherFailedUpstream(
      result.status,
      result.error,
      result.setCookies,
      "Unable to load vouchers",
    );
  }

  let vouchers = unwrapOfoodVouchers(result.data)
    .map(mapOfoodVoucher)
    .filter((voucher): voucher is Voucher => voucher !== null);

  const status = searchParams.get("status") ?? undefined;
  const search = searchParams.get("search")?.trim().toLowerCase();

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

  const { page, pageSize } = parsePagination(searchParams);
  const { items, meta } = paginate(vouchers, page, pageSize);
  return applyUpstreamCookies(jsonPaginated(items, meta), result.setCookies);
}

export async function POST(request: NextRequest) {
  const accessToken = getRequestAccessToken(request);
  if (!accessToken) return missingAccessToken();

  const body = await parseJsonBody(request);
  if (isErrorResponse(body)) return body;

  const parsed = createVoucherSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation failed", 422, ErrorCode.VALIDATION_ERROR, {
      issues: parsed.error.flatten(),
    });
  }

  const result = await ofoodFetch<unknown>("/api/v1/vouchers", {
    method: "POST",
    accessToken,
    body: toOfoodWriteBody(parsed.data),
  });

  if (!result.ok) {
    return voucherFailedUpstream(
      result.status,
      result.error,
      result.setCookies,
      "Unable to create voucher",
    );
  }

  const voucher = mapOfoodVoucher(result.data);
  if (!voucher) {
    return voucherUnreadable(
      result.setCookies,
      "Voucher was created but the response could not be read.",
    );
  }

  return applyUpstreamCookies(
    jsonOk(voucher, { status: 201, message: "Voucher created" }),
    result.setCookies,
  );
}
