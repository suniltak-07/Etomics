import type { NextRequest } from "next/server";
import { getDb } from "@/mocks/seed";
import { Permission } from "@/lib/permissions/permissions";
import {
  isAdminRole,
  isErrorResponse,
  jsonPaginated,
  paginate,
  parsePagination,
  requireAuth,
  requirePermission,
} from "@/lib/api/route-helpers";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (isErrorResponse(auth)) return auth;

  const denied = requirePermission(auth, Permission.ORDERS_READ);
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const { page, pageSize } = parsePagination(searchParams);
  const status = searchParams.get("status");
  const customerIdParam = searchParams.get("customerId");

  let orders = getDb().orders;

  if (isAdminRole(auth.role) && customerIdParam) {
    orders = orders.filter((item) => item.customerId === customerIdParam);
  } else if (!isAdminRole(auth.role)) {
    orders = orders.filter((item) => item.customerId === auth.id);
  }

  if (status) {
    orders = orders.filter((item) => item.status === status);
  }

  orders = [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const { items, meta } = paginate(orders, page, pageSize);
  return jsonPaginated(items, meta);
}
