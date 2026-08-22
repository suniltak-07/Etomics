import type { NextRequest } from "next/server";
import {
  isErrorResponse,
  jsonError,
  parseJsonBody,
} from "@/lib/api/route-helpers";
import { ErrorCode } from "@/lib/api/errors";
import { loginSchema } from "@/features/auth/schemas/authSchemas";
import { jsonAuthOk, loginWithOfood } from "@/lib/backend/session";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = await parseJsonBody(request);
  if (isErrorResponse(body)) return body;

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation failed", 422, ErrorCode.VALIDATION_ERROR, {
      issues: parsed.error.flatten(),
    });
  }

  const result = await loginWithOfood(parsed.data.email, parsed.data.password);

  if (!result.payload) {
    return (
      result.error ??
      jsonError("Unable to sign in", 401, ErrorCode.UNAUTHORIZED)
    );
  }

  return jsonAuthOk(result.payload, result.cookies);
}
