import type { NextRequest } from "next/server";
import { createSession, findUserByEmail, mutate } from "@/mocks/seed";
import {
  createId,
  isErrorResponse,
  jsonError,
  jsonOk,
  nowIso,
  parseJsonBody,
  stripPassword,
} from "@/lib/api/route-helpers";
import { signupSchema } from "@/features/auth/schemas/authSchemas";
import { UserRole } from "@/types/enums";
import type { Customer, User } from "@/types/entities";
import { ErrorCode } from "@/lib/api/errors";

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

  if (findUserByEmail(parsed.data.email)) {
    return jsonError("Email already registered", 409, ErrorCode.CONFLICT);
  }

  const timestamp = nowIso();
  const id = createId("user_customer");

  const user: User = {
    id,
    email: parsed.data.email.trim().toLowerCase(),
    password: parsed.data.password,
    role: UserRole.CUSTOMER,
    firstName: parsed.data.firstName.trim(),
    lastName: parsed.data.lastName.trim(),
    mobile: parsed.data.mobile,
    isActive: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  const customer: Customer = {
    ...user,
    role: UserRole.CUSTOMER,
    preferences: {
      dietaryRestrictions: [],
      allergies: [],
      spiceLevel: "medium",
    },
  };

  mutate((db) => {
    db.users.push(user);
    db.customers.push(customer);
  });

  const token = createSession(user.id);

  return jsonOk(
    {
      user: stripPassword(customer),
      token,
    },
    { status: 201, message: "Account created" },
  );
}
