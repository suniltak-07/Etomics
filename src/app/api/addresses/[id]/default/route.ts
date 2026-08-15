import type { NextRequest } from "next/server";
import { getDb, mutate } from "@/mocks/seed";
import { Permission } from "@/lib/permissions/permissions";
import { ErrorCode } from "@/lib/api/errors";
import {
  isAdminRole,
  isErrorResponse,
  jsonError,
  jsonOk,
  nowIso,
  requireAuth,
  requirePermission,
} from "@/lib/api/route-helpers";
import type { Address } from "@/types/entities";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = requireAuth(request);
  if (isErrorResponse(auth)) return auth;

  const denied = requirePermission(auth, Permission.ADDRESSES_UPDATE);
  if (denied && !isAdminRole(auth.role)) return denied;

  const { id } = await context.params;
  const existing = getDb().addresses.find((item) => item.id === id);
  if (!existing) {
    return jsonError("Address not found", 404, ErrorCode.NOT_FOUND);
  }

  if (!isAdminRole(auth.role) && existing.customerId !== auth.id) {
    return jsonError("Forbidden", 403, ErrorCode.FORBIDDEN);
  }

  const timestamp = nowIso();
  let updated: Address = existing;

  mutate((db) => {
    for (const item of db.addresses) {
      if (item.customerId !== existing.customerId) continue;
      item.isDefault = item.id === id;
      item.updatedAt = timestamp;
      if (item.id === id) updated = { ...item };
    }
  });

  return jsonOk(updated, { message: "Default address updated" });
}
