import type { NextRequest } from "next/server";
import { createSession, findUserByEmail } from "@/mocks/seed";
import {
  isErrorResponse,
  jsonError,
  jsonOk,
  parseJsonBody,
  stripPassword,
} from "@/lib/api/route-helpers";
import { loginSchema } from "@/features/auth/schemas/authSchemas";
import { ErrorCode } from "@/lib/api/errors";

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

  const user = findUserByEmail(parsed.data.email);
  if (!user || user.password !== parsed.data.password) {
    return jsonError("Invalid email or password", 401, ErrorCode.UNAUTHORIZED);
  }

  if (!user.isActive) {
    return jsonError("Account is inactive", 403, ErrorCode.FORBIDDEN);
  }

  const token = createSession(user.id);

  return jsonOk({
    user: stripPassword(user),
    token,
  });
}
