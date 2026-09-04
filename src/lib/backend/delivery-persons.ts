import type { NextResponse } from "next/server";
import { jsonError } from "@/lib/api/route-helpers";
import { ErrorCode } from "@/lib/api/errors";
import { applyUpstreamCookies, ofoodErrorResponse } from "@/lib/backend/proxy";
import type { OfoodApiError } from "@/lib/backend/types";
import type {
  CreateDeliveryPersonInput,
  UpdateDeliveryPersonInput,
} from "@/features/delivery-persons/schemas/deliveryPersonSchemas";
import type { DeliveryPerson } from "@/types/entities";
import { DeliveryPersonStatus, VehicleType } from "@/types/enums";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function unwrapPayload(payload: unknown): unknown {
  if (Array.isArray(payload) || !isRecord(payload)) return payload;
  if ("id" in payload && typeof payload.id === "string") return payload;
  if ("data" in payload) return unwrapPayload(payload.data);
  if (Array.isArray(payload.content)) return payload.content;
  return payload;
}

export function unwrapOfoodDeliveryPersons(payload: unknown): unknown[] {
  const unwrapped = unwrapPayload(payload);
  return Array.isArray(unwrapped) ? unwrapped : [];
}

export function unwrapOfoodDeliveryPerson(payload: unknown): unknown {
  const unwrapped = unwrapPayload(payload);
  return isRecord(unwrapped) ? unwrapped : null;
}

function mapStatus(value: unknown): DeliveryPersonStatus {
  const raw = asString(value).toUpperCase();
  if ((Object.values(DeliveryPersonStatus) as string[]).includes(raw)) {
    return raw as DeliveryPersonStatus;
  }
  return DeliveryPersonStatus.ACTIVE;
}

function mapVehicleType(value: unknown): VehicleType {
  const raw = asString(value).toUpperCase();
  if ((Object.values(VehicleType) as string[]).includes(raw)) {
    return raw as VehicleType;
  }
  return VehicleType.OTHER;
}

function mapPincodeIds(raw: Record<string, unknown>): string[] {
  const source = raw.servicePincodes ?? raw.pincodeIds;
  if (!Array.isArray(source)) return [];

  const ids: string[] = [];
  for (const item of source) {
    if (typeof item === "string" && item.trim()) {
      ids.push(item.trim());
      continue;
    }
    if (!isRecord(item)) continue;
    const id =
      asString(item.id) || asString(item.pincodeId) || asString(item.pincode);
    if (id) ids.push(id);
  }
  return ids;
}

export function deliveryPersonDisplayName(
  firstName: string,
  lastName: string,
): string {
  return `${firstName} ${lastName}`.trim();
}

export function mapOfoodDeliveryPerson(
  payload: unknown,
): DeliveryPerson | null {
  const raw = unwrapOfoodDeliveryPerson(payload);
  if (!isRecord(raw) || typeof raw.id !== "string") return null;

  const firstName = asString(raw.firstName).trim();
  const lastName = asString(raw.lastName).trim();
  const vehicleNumber = asString(raw.vehicleNumber).trim();

  return {
    id: raw.id,
    firstName,
    lastName,
    fullName: deliveryPersonDisplayName(firstName, lastName),
    mobile: asString(raw.mobile).trim(),
    vehicleType: mapVehicleType(raw.vehicleType),
    vehicleNumber: vehicleNumber || undefined,
    status: mapStatus(raw.status),
    pincodeIds: mapPincodeIds(raw),
    createdAt: asString(raw.createdAt),
    updatedAt: asString(raw.updatedAt),
  };
}

export function toOfoodWriteBody(
  input: CreateDeliveryPersonInput | UpdateDeliveryPersonInput,
  existing?: DeliveryPerson | null,
): Record<string, unknown> {
  const vehicleNumber = (
    input.vehicleNumber ??
    existing?.vehicleNumber ??
    ""
  ).trim();

  return {
    firstName: (input.firstName ?? existing?.firstName ?? "").trim(),
    lastName: (input.lastName ?? existing?.lastName ?? "").trim(),
    mobile: (input.mobile ?? existing?.mobile ?? "").trim(),
    vehicleType: input.vehicleType ?? existing?.vehicleType ?? VehicleType.BIKE,
    vehicleNumber,
    status: input.status ?? existing?.status ?? DeliveryPersonStatus.ACTIVE,
    pincodeIds: input.pincodeIds ?? existing?.pincodeIds ?? [],
  };
}

export function deliveryPersonFailedUpstream(
  status: number,
  error: OfoodApiError | null,
  cookies: string[],
  fallback: string,
): NextResponse {
  return applyUpstreamCookies(
    ofoodErrorResponse(status, error, fallback),
    cookies,
  );
}

export function deliveryPersonUnreadable(
  cookies: string[],
  fallback: string,
): NextResponse {
  return deliveryPersonFailedUpstream(
    502,
    { code: ErrorCode.BAD_GATEWAY, message: fallback },
    cookies,
    fallback,
  );
}

export function missingAccessToken() {
  return jsonError("Unauthorized", 401, ErrorCode.UNAUTHORIZED);
}
