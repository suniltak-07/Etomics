import type { NextRequest, NextResponse } from "next/server";
import { ErrorCode } from "@/lib/api/errors";
import {
  isErrorResponse,
  jsonError,
  jsonOk,
  parseJsonBody,
} from "@/lib/api/route-helpers";
import { applyUpstreamCookies, ofoodFetch } from "@/lib/backend/proxy";
import { getRequestAccessToken } from "@/lib/backend/session";
import {
  looksLikeUuid,
  mapOfoodVoucher,
  missingAccessToken,
  toOfoodWriteBody,
  voucherFailedUpstream,
  voucherUnreadable,
} from "@/lib/backend/vouchers";
import { updateVoucherSchema } from "@/features/vouchers/schemas/voucherSchemas";

export const dynamic = "force-dynamic";

async function loadVoucher(id: string, accessToken: string | null) {
  const byId = await ofoodFetch<unknown>(`/api/v1/vouchers/${id}`, {
    accessToken,
  });
  if (byId.ok || looksLikeUuid(id)) return byId;

  return ofoodFetch<unknown>(
    `/api/v1/vouchers/code/${encodeURIComponent(id)}`,
    { accessToken },
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const accessToken = getRequestAccessToken(request);
  const result = await loadVoucher(id, accessToken);

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

async function saveVoucher(
  request: NextRequest,
  id: string,
): Promise<NextResponse> {
  const accessToken = getRequestAccessToken(request);
  if (!accessToken) return missingAccessToken();

  const body = await parseJsonBody(request);
  if (isErrorResponse(body)) return body;

  const parsed = updateVoucherSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation failed", 422, ErrorCode.VALIDATION_ERROR, {
      issues: parsed.error.flatten(),
    });
  }

  const current = await loadVoucher(id, accessToken);
  const existing = current.ok ? mapOfoodVoucher(current.data) : null;

  const result = await ofoodFetch<unknown>(`/api/v1/vouchers/${id}`, {
    method: "PUT",
    accessToken,
    body: toOfoodWriteBody(parsed.data, existing),
  });

  if (!result.ok) {
    return voucherFailedUpstream(
      result.status,
      result.error,
      result.setCookies,
      "Unable to update voucher",
    );
  }

  const voucher = mapOfoodVoucher(result.data);
  if (!voucher) {
    return voucherUnreadable(
      result.setCookies,
      "Voucher was updated but the response could not be read.",
    );
  }

  return applyUpstreamCookies(
    jsonOk(voucher, { message: "Voucher updated" }),
    result.setCookies,
  );
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return saveVoucher(request, id);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return saveVoucher(request, id);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const accessToken = getRequestAccessToken(request);
  if (!accessToken) return missingAccessToken();

  const { id } = await params;
  const result = await ofoodFetch<unknown>(`/api/v1/vouchers/${id}`, {
    method: "DELETE",
    accessToken,
  });

  if (!result.ok) {
    return voucherFailedUpstream(
      result.status,
      result.error,
      result.setCookies,
      "Unable to delete voucher",
    );
  }

  return applyUpstreamCookies(
    jsonOk({ id }, { message: "Voucher deleted" }),
    result.setCookies,
  );
}
