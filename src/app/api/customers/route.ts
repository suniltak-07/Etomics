import type { NextRequest } from "next/server";
import { getDb } from "@/mocks/seed";
import { Permission } from "@/lib/permissions/permissions";
import {
  isErrorResponse,
  jsonPaginated,
  paginate,
  parsePagination,
  requireAuth,
  requirePermission,
  stripPassword,
} from "@/lib/api/route-helpers";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (isErrorResponse(auth)) return auth;

  const denied = requirePermission(auth, Permission.CUSTOMERS_READ);
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const { page, pageSize } = parsePagination(searchParams);
  const search = searchParams.get("search")?.trim().toLowerCase();

  let customers = getDb().customers;
  if (search) {
    customers = customers.filter((customer) => {
      const haystack = [
        customer.email,
        customer.firstName,
        customer.lastName,
        customer.mobile ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(search);
    });
  }

  const sanitized = customers.map((customer) => stripPassword(customer));
  const { items, meta } = paginate(sanitized, page, pageSize);
  return jsonPaginated(items, meta);
}
