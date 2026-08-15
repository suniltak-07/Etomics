import type { NextRequest } from "next/server";
import type { Address } from "@/types/entities";
import { getDb, mutate } from "@/mocks/seed";
import { Permission } from "@/lib/permissions/permissions";
import { ErrorCode } from "@/lib/api/errors";
import {
  isAdminRole,
  isErrorResponse,
  jsonError,
  jsonOk,
  nowIso,
  parseJsonBody,
  requireAuth,
  requirePermission,
} from "@/lib/api/route-helpers";
import { updateAddressSchema } from "@/features/addresses/schemas/addressSchemas";
import { UserRole } from "@/types/enums";

export const dynamic = "force-dynamic";

function canManageAddress(
  authId: string,
  authRole: UserRole,
  address: Address,
): boolean {
  if (isAdminRole(authRole)) return true;
  return authRole === UserRole.CUSTOMER && address.customerId === authId;
}

export async function PUT(
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

  if (!canManageAddress(auth.id, auth.role, existing)) {
    return jsonError("Forbidden", 403, ErrorCode.FORBIDDEN);
  }

  const body = await parseJsonBody(request);
  if (isErrorResponse(body)) return body;

  const parsed = updateAddressSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation failed", 422, ErrorCode.VALIDATION_ERROR, {
      issues: parsed.error.flatten(),
    });
  }

  let cityName = parsed.data.city ?? existing.city;
  let stateName = parsed.data.state ?? existing.state;
  let cityId = parsed.data.cityId ?? existing.cityId;
  const nextPincode = parsed.data.pincode ?? existing.pincode;

  if (parsed.data.pincode || parsed.data.latitude || parsed.data.longitude) {
    const { checkPincodeServiceability } =
      await import("@/lib/serviceability/checkPincode");
    const serviceability = checkPincodeServiceability(nextPincode);
    if (!serviceability.serviceable || !serviceability.city) {
      return jsonError(serviceability.message, 422, ErrorCode.VALIDATION_ERROR);
    }
    cityName = serviceability.city.name;
    stateName = serviceability.city.state;
    cityId = serviceability.city.id;
  }

  const timestamp = nowIso();
  const updated: Address = {
    ...existing,
    ...parsed.data,
    city: cityName,
    state: stateName,
    cityId,
    pincode: nextPincode,
    isDefault: parsed.data.isDefault ?? existing.isDefault,
    updatedAt: timestamp,
  };

  mutate((db) => {
    if (updated.isDefault) {
      for (const item of db.addresses) {
        if (
          item.customerId === existing.customerId &&
          item.id !== existing.id
        ) {
          item.isDefault = false;
          item.updatedAt = timestamp;
        }
      }
    }
    const index = db.addresses.findIndex((item) => item.id === id);
    if (index >= 0) db.addresses[index] = updated;
  });

  return jsonOk(updated, { message: "Address updated" });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = requireAuth(request);
  if (isErrorResponse(auth)) return auth;

  const denied = requirePermission(auth, Permission.ADDRESSES_DELETE);
  if (denied && !isAdminRole(auth.role)) return denied;

  const { id } = await context.params;
  const existing = getDb().addresses.find((item) => item.id === id);
  if (!existing) {
    return jsonError("Address not found", 404, ErrorCode.NOT_FOUND);
  }

  if (!canManageAddress(auth.id, auth.role, existing)) {
    return jsonError("Forbidden", 403, ErrorCode.FORBIDDEN);
  }

  mutate((db) => {
    db.addresses = db.addresses.filter((item) => item.id !== id);
    if (existing.isDefault) {
      const next = db.addresses.find(
        (item) => item.customerId === existing.customerId,
      );
      if (next) {
        next.isDefault = true;
        next.updatedAt = nowIso();
      }
    }
  });

  return jsonOk({ id }, { message: "Address deleted" });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  // Generic PATCH supports set-default via { isDefault: true } or action
  const auth = requireAuth(request);
  if (isErrorResponse(auth)) return auth;

  const denied = requirePermission(auth, Permission.ADDRESSES_UPDATE);
  if (denied && !isAdminRole(auth.role)) return denied;

  const { id } = await context.params;
  const existing = getDb().addresses.find((item) => item.id === id);
  if (!existing) {
    return jsonError("Address not found", 404, ErrorCode.NOT_FOUND);
  }

  if (!canManageAddress(auth.id, auth.role, existing)) {
    return jsonError("Forbidden", 403, ErrorCode.FORBIDDEN);
  }

  const body = await parseJsonBody<Record<string, unknown>>(request);
  if (isErrorResponse(body)) return body;

  const setDefault =
    body.isDefault === true ||
    body.action === "set-default" ||
    body.action === "setDefault";

  if (!setDefault) {
    return jsonError("Unsupported address action", 400, ErrorCode.BAD_REQUEST);
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
