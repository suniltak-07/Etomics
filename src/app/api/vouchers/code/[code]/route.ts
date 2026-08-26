import type { NextRequest } from "next/server";
import { ErrorCode } from "@/lib/api/errors";
import { jsonError, jsonOk } from "@/lib/api/route-helpers";
import { applyUpstreamCookies, ofoodFetch } from "@/lib/backend/proxy";
import { getRequestAccessToken } from "@/lib/backend/session";
import { mapOfoodVoucher, voucherFailedUpstream } from "@/lib/backend/vouchers";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const accessToken = getRequestAccessToken(request);
  const result = await ofoodFetch<unknown>(
    `/api/v1/vouchers/code/${encodeURIComponent(code)}`,
    { accessToken },
  );

  if (!result.ok) {
    return voucherFailedUpstream(
      result.status,
      result.error,
      result.setCookies,
      "Voucher not found",
    );
  }

  const voucher = mapOfoodVoucher(result.data);
  if (!voucher) {
    return jsonError("Voucher not found", 404, ErrorCode.NOT_FOUND);
  }

  return applyUpstreamCookies(jsonOk(voucher), result.setCookies);
}
