import type { NextRequest } from "next/server";
import type { Customer } from "@/types/entities";
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
  stripPassword,
} from "@/lib/api/route-helpers";
import { applyUpstreamCookies, ofoodFetch } from "@/lib/backend/proxy";
import { getRequestAccessToken } from "@/lib/backend/session";
import {
  customerFailedUpstream,
  mapOfoodCustomer,
  missingAccessToken,
  unwrapOfoodCustomers,
  type PublicCustomer,
} from "@/lib/backend/customers";
import { UserRole } from "@/types/enums";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const accessToken = getRequestAccessToken(request);
  if (!accessToken) return missingAccessToken();

  const { id } = await context.params;

  const byId = await ofoodFetch<unknown>(`/api/v1/customers/${id}`, {
    accessToken,
  });
  if (byId.ok) {
    const customer = mapOfoodCustomer(byId.data);
    if (customer) {
      return applyUpstreamCookies(jsonOk(customer), byId.setCookies);
    }
  }

  const list = await ofoodFetch<unknown>("/api/v1/customers", { accessToken });
  if (list.ok) {
    const customer = unwrapOfoodCustomers(list.data)
      .map(mapOfoodCustomer)
      .find((item): item is PublicCustomer => item?.id === id);
    if (customer) {
      return applyUpstreamCookies(jsonOk(customer), list.setCookies);
    }
  }

  const me = await ofoodFetch<unknown>("/api/v1/auth/me", { accessToken });
  if (me.ok) {
    const self = mapOfoodCustomer(me.data);
    if (self?.id === id) {
      return applyUpstreamCookies(jsonOk(self), me.setCookies);
    }
  }

  if (byId.status === 401 || list.status === 401) {
    const failed = byId.status === 401 ? byId : list;
    return customerFailedUpstream(
      failed.status,
      failed.error,
      failed.setCookies,
      "Unable to load customer",
    );
  }

  return jsonError("Customer not found", 404, ErrorCode.NOT_FOUND);
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = requireAuth(request);
  if (isErrorResponse(auth)) return auth;

  const { id } = await context.params;
  const isSelf = auth.id === id && auth.role === UserRole.CUSTOMER;

  if (!isSelf) {
    const denied = requirePermission(auth, Permission.CUSTOMERS_UPDATE);
    if (denied) return denied;
  } else {
    const denied = requirePermission(auth, Permission.PROFILE_UPDATE);
    if (denied) return denied;
  }

  const existing = getDb().customers.find((item) => item.id === id);
  if (!existing) {
    return jsonError("Customer not found", 404, ErrorCode.NOT_FOUND);
  }

  const body = await parseJsonBody<Record<string, unknown>>(request);
  if (isErrorResponse(body)) return body;

  const allowedKeys = [
    "firstName",
    "lastName",
    "mobile",
    "avatarUrl",
    "dateOfBirth",
    "preferences",
  ] as const;

  const patch: Partial<Customer> = {};
  for (const key of allowedKeys) {
    if (key in body) {
      (patch as Record<string, unknown>)[key] = body[key];
    }
  }

  if (body.preferences && typeof body.preferences === "object") {
    patch.preferences = {
      ...existing.preferences,
      ...(body.preferences as Customer["preferences"]),
    };
  }

  if (isAdminRole(auth.role) && typeof body.isActive === "boolean") {
    patch.isActive = body.isActive;
  }

  const timestamp = nowIso();
  const updated: Customer = {
    ...existing,
    ...patch,
    updatedAt: timestamp,
  };

  mutate((db) => {
    const customerIndex = db.customers.findIndex((item) => item.id === id);
    if (customerIndex >= 0) db.customers[customerIndex] = updated;

    const userIndex = db.users.findIndex((item) => item.id === id);
    if (userIndex >= 0) {
      db.users[userIndex] = {
        ...db.users[userIndex],
        firstName: updated.firstName,
        lastName: updated.lastName,
        mobile: updated.mobile,
        avatarUrl: updated.avatarUrl,
        isActive: updated.isActive,
        updatedAt: timestamp,
      };
    }
  });

  return jsonOk(stripPassword(updated), { message: "Customer updated" });
}
