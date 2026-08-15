import type { NextRequest } from "next/server";
import {
  isErrorResponse,
  jsonOk,
  parseJsonBody,
  jsonError,
} from "@/lib/api/route-helpers";
import { forgotPasswordSchema } from "@/features/auth/schemas/authSchemas";
import { ErrorCode } from "@/lib/api/errors";

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

  return jsonOk(
    { sent: true },
    {
      message:
        "If an account exists for that email, password reset instructions have been sent.",
    },
  );
}
