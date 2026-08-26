import type { NextRequest } from "next/server";
import { ErrorCode } from "@/lib/api/errors";
import {
  isErrorResponse,
  jsonError,
  jsonOk,
  parseJsonBody,
} from "@/lib/api/route-helpers";
import { applyUpstreamCookies, ofoodFetch } from "@/lib/backend/proxy";
import { mapOfoodPlan } from "@/lib/backend/plans";
import { getRequestAccessToken } from "@/lib/backend/session";
import {
  mapOfoodValidation,
  missingAccessToken,
  voucherFailedUpstream,
  voucherUnreadable,
} from "@/lib/backend/vouchers";
import { validateVoucherSchema } from "@/features/vouchers/schemas/voucherSchemas";

export const dynamic = "force-dynamic";

async function resolveOrderValue(
  planId: string,
  orderAmount: number | undefined,
  accessToken: string,
): Promise<{ value: number | null; cookies: string[] }> {
  if (typeof orderAmount === "number" && Number.isFinite(orderAmount)) {
    return { value: orderAmount, cookies: [] };
  }

  const result = await ofoodFetch<unknown>(`/api/v1/plans/${planId}`, {
    accessToken,
  });
  if (!result.ok) {
    return { value: null, cookies: result.setCookies };
  }
  const plan = mapOfoodPlan(result.data);
  return { value: plan?.price ?? null, cookies: result.setCookies };
}

export async function POST(request: NextRequest) {
  const accessToken = getRequestAccessToken(request);
  if (!accessToken) return missingAccessToken();

  const body = await parseJsonBody(request);
  if (isErrorResponse(body)) return body;

  const parsed = validateVoucherSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation failed", 422, ErrorCode.VALIDATION_ERROR, {
      issues: parsed.error.flatten(),
    });
  }

  const resolved = await resolveOrderValue(
    parsed.data.planId,
    parsed.data.orderAmount,
    accessToken,
  );
  if (resolved.value == null || resolved.value <= 0) {
    return jsonError(
      "Order value is required to validate a voucher",
      422,
      ErrorCode.VALIDATION_ERROR,
    );
  }

  const result = await ofoodFetch<unknown>("/api/v1/vouchers/validate", {
    method: "POST",
    accessToken,
    body: {
      code: parsed.data.code.trim(),
      planId: parsed.data.planId,
      orderValue: resolved.value,
    },
  });

  if (!result.ok) {
    return voucherFailedUpstream(
      result.status,
      result.error,
      result.setCookies,
      "Unable to validate voucher",
    );
  }

  const mapped = mapOfoodValidation(result.data, {
    code: parsed.data.code.trim(),
    planPrice: resolved.value,
  });
  if (!mapped) {
    return voucherUnreadable(
      [...resolved.cookies, ...result.setCookies],
      "Voucher was validated but the response could not be read.",
    );
  }

  if (!mapped.valid) {
    return applyUpstreamCookies(
      jsonError(
        mapped.message ?? "Voucher is invalid",
        422,
        ErrorCode.VALIDATION_ERROR,
      ),
      [...resolved.cookies, ...result.setCookies],
    );
  }

  return applyUpstreamCookies(jsonOk(mapped), [
    ...resolved.cookies,
    ...result.setCookies,
  ]);
}
