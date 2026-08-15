import type { NextRequest } from "next/server";
import type { Address } from "@/types/entities";
import { getDb, mutate } from "@/mocks/seed";
import { Permission } from "@/lib/permissions/permissions";
import { ErrorCode } from "@/lib/api/errors";
import {
  createId,
  isAdminRole,
  isErrorResponse,
  jsonError,
  jsonOk,
  nowIso,
  parseJsonBody,
  requireAuth,
  requirePermission,
} from "@/lib/api/route-helpers";
import { createAddressSchema } from "@/features/addresses/schemas/addressSchemas";
import { UserRole } from "@/types/enums";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (isErrorResponse(auth)) return auth;

  const denied = requirePermission(auth, Permission.ADDRESSES_READ);
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const customerIdParam = searchParams.get("customerId") ?? undefined;

  let customerId = customerIdParam;
  if (auth.role === UserRole.CUSTOMER) {
    customerId = auth.id;
  } else if (!customerId) {
    return jsonError(
      "customerId query parameter is required",
      400,
      ErrorCode.BAD_REQUEST,
    );
  }

  if (
    auth.role === UserRole.CUSTOMER &&
    customerIdParam &&
    customerIdParam !== auth.id
  ) {
    return jsonError("Forbidden", 403, ErrorCode.FORBIDDEN);
  }

  const addresses = getDb().addresses.filter(
    (address) => address.customerId === customerId,
  );

  return jsonOk(addresses);
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (isErrorResponse(auth)) return auth;

  const denied = requirePermission(auth, Permission.ADDRESSES_CREATE);
  if (denied) {
    // Admins can create on behalf of customers even without ADDRESSES_CREATE
    if (!isAdminRole(auth.role)) return denied;
  }

  const body = await parseJsonBody(request);
  if (isErrorResponse(body)) return body;

  const parsed = createAddressSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation failed", 422, ErrorCode.VALIDATION_ERROR, {
      issues: parsed.error.flatten(),
    });
  }

  const customerId =
    auth.role === UserRole.CUSTOMER ? auth.id : parsed.data.customerId;

  if (!customerId) {
    return jsonError("customerId is required", 422, ErrorCode.VALIDATION_ERROR);
  }

  if (
    auth.role === UserRole.CUSTOMER &&
    parsed.data.customerId &&
    parsed.data.customerId !== auth.id
  ) {
    return jsonError("Forbidden", 403, ErrorCode.FORBIDDEN);
  }

  const customer = getDb().customers.find((item) => item.id === customerId);
  if (!customer) {
    return jsonError("Customer not found", 404, ErrorCode.NOT_FOUND);
  }

  const { checkPincodeServiceability } =
    await import("@/lib/serviceability/checkPincode");
  const serviceability = checkPincodeServiceability(parsed.data.pincode);
  if (!serviceability.serviceable || !serviceability.city) {
    return jsonError(serviceability.message, 422, ErrorCode.VALIDATION_ERROR);
  }

  const timestamp = nowIso();
  const makeDefault =
    parsed.data.isDefault === true ||
    !getDb().addresses.some((address) => address.customerId === customerId);

  const address: Address = {
    id: createId("addr"),
    customerId,
    fullName: parsed.data.fullName,
    mobile: parsed.data.mobile,
    addressLine1: parsed.data.addressLine1,
    addressLine2: parsed.data.addressLine2,
    landmark: parsed.data.landmark,
    area: parsed.data.area ?? serviceability.servicePincode?.areaName,
    city: serviceability.city.name,
    state: serviceability.city.state,
    pincode: parsed.data.pincode,
    cityId: serviceability.city.id,
    latitude: parsed.data.latitude,
    longitude: parsed.data.longitude,
    googleMapsUrl: parsed.data.googleMapsUrl || undefined,
    addressType: parsed.data.addressType,
    isDefault: makeDefault,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  mutate((db) => {
    if (makeDefault) {
      for (const item of db.addresses) {
        if (item.customerId === customerId) {
          item.isDefault = false;
          item.updatedAt = timestamp;
        }
      }
    }
    db.addresses.push(address);
  });

  return jsonOk(address, { status: 201, message: "Address created" });
}
