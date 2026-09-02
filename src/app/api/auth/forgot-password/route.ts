import type { NextRequest } from "next/server";
import {
  isErrorResponse,
  jsonError,
  jsonOk,
  parseJsonBody,
} from "@/lib/api/route-helpers";
import { forgotPasswordSchema } from "@/features/auth/schemas/authSchemas";
import { ErrorCode } from "@/lib/api/errors";
import { ofoodErrorResponse, ofoodFetch } from "@/lib/backend/proxy";
import type { OfoodMessageResponse } from "@/lib/backend/types";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = await parseJsonBody(request);
  if (isErrorResponse(body)) return body;

  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation failed", 422, ErrorCode.VALIDATION_ERROR, {
      issues: parsed.error.flatten(),
    });
  }

  const result = await ofoodFetch<OfoodMessageResponse>(
    "/api/v1/auth/forgot-password",
    {
      method: "POST",
      body: { email: parsed.data.email.trim().toLowerCase() },
    },
  );

  if (!result.ok) {
    return ofoodErrorResponse(
      result.status || 400,
      result.error,
      "Unable to send reset email",
    );
  }

  return jsonOk(
    { sent: true },
    { message: result.data?.message ?? "Operation successful" },
  );
}
