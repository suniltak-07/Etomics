import type { NextRequest } from "next/server";
import { getDb } from "@/mocks/seed";
import {
  isErrorResponse,
  jsonOk,
  requireAuth,
  stripPassword,
} from "@/lib/api/route-helpers";
import { UserRole } from "@/types/enums";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (isErrorResponse(auth)) return auth;

  if (auth.role === UserRole.CUSTOMER) {
    const customer = getDb().customers.find((item) => item.id === auth.id);
    if (customer) {
      return jsonOk({ user: stripPassword(customer) });
    }
  }

  return jsonOk({ user: auth });
}
