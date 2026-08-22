import type { NextRequest } from "next/server";
import {
  isErrorResponse,
  jsonError,
  parseJsonBody,
} from "@/lib/api/route-helpers";
import { ErrorCode } from "@/lib/api/errors";
import { signupSchema } from "@/features/auth/schemas/authSchemas";
import { ofoodErrorResponse, ofoodFetch } from "@/lib/backend/proxy";
import { jsonAuthOk, loginWithOfood } from "@/lib/backend/session";
import type { OfoodRegistrationResponse } from "@/lib/backend/types";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = await parseJsonBody(request);
  if (isErrorResponse(body)) return body;

  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation failed", 422, ErrorCode.VALIDATION_ERROR, {
      issues: parsed.error.flatten(),
    });
  }

  const { email, password, firstName, lastName, mobile } = parsed.data;
  const register = await ofoodFetch<OfoodRegistrationResponse>(
    "/api/v1/auth/register",
    {
      method: "POST",
      body: {
        email: email.trim().toLowerCase(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        fullName: `${firstName.trim()} ${lastName.trim()}`.trim(),
        ...(mobile?.trim() ? { mobile: mobile.trim() } : {}),
      },
    },
  );

  if (!register.ok) {
    return ofoodErrorResponse(
      register.status || 400,
      register.error,
      "Unable to create account",
    );
  }

  const session = await loginWithOfood(email.trim().toLowerCase(), password);
  if (!session.payload) {
    return (
      session.error ??
      jsonError("Account created. Please log in.", 201, ErrorCode.UNKNOWN)
    );
  }

  return jsonAuthOk(session.payload, session.cookies, {
    status: 201,
    message: register.data?.message ?? "Account created",
  });
}
