import type { NextRequest } from "next/server";
import {
  isErrorResponse,
  jsonError,
  jsonOk,
  parseJsonBody,
} from "@/lib/api/route-helpers";
import { changePasswordSchema } from "@/features/auth/schemas/authSchemas";
import { ErrorCode } from "@/lib/api/errors";
import {
  applyUpstreamCookies,
  ofoodErrorResponse,
  ofoodFetch,
} from "@/lib/backend/proxy";
import { getRequestAccessToken } from "@/lib/backend/session";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const accessToken = getRequestAccessToken(request);
  if (!accessToken) {
    return jsonError("Unauthorized", 401, ErrorCode.UNAUTHORIZED);
  }

  const body = await parseJsonBody(request);
  if (isErrorResponse(body)) return body;

  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation failed", 422, ErrorCode.VALIDATION_ERROR, {
      issues: parsed.error.flatten(),
    });
  }

  const result = await ofoodFetch("/api/v1/auth/change-password", {
    method: "POST",
    accessToken,
    body: parsed.data,
  });

  if (!result.ok) {
    return applyUpstreamCookies(
      ofoodErrorResponse(
        result.status,
        result.error,
        "Unable to change password",
      ),
      result.setCookies,
    );
  }

  return applyUpstreamCookies(
    jsonOk({ changed: true }, { message: "Password changed successfully" }),
    result.setCookies,
  );
}
