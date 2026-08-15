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

  const denied = requirePermission(auth, Permission.NOTIFICATIONS_READ);
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const { page, pageSize } = parsePagination(searchParams);
  const unreadOnly = searchParams.get("unread") === "true";
  const userIdParam = searchParams.get("userId");

  let notifications = getDb().notifications;

  if (isAdminRole(auth.role) && userIdParam) {
    notifications = notifications.filter((item) => item.userId === userIdParam);
  } else {
    notifications = notifications.filter((item) => item.userId === auth.id);
  }

  if (unreadOnly) {
    notifications = notifications.filter((item) => !item.isRead);
  }

  notifications = [...notifications].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );

  const { items, meta } = paginate(notifications, page, pageSize);
  return jsonPaginated(items, meta);
}
