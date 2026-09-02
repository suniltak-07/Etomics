import type { NextResponse } from "next/server";
import { jsonError } from "@/lib/api/route-helpers";
import { ErrorCode } from "@/lib/api/errors";
import { applyUpstreamCookies, ofoodErrorResponse } from "@/lib/backend/proxy";
import type { OfoodApiError } from "@/lib/backend/types";
import type {
  CreatePincodeInput,
  UpdatePincodeInput,
} from "@/features/pincodes/schemas/pincodeSchemas";
import type { ServiceAreaPolygon, ServicePincode } from "@/types/entities";

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

export function unwrapOfoodPincodes(payload: unknown): unknown[] {
  const unwrapped = unwrapPayload(payload);
  return Array.isArray(unwrapped) ? unwrapped : [];
}

export function unwrapOfoodPincode(payload: unknown): unknown {
  const unwrapped = unwrapPayload(payload);
  return isRecord(unwrapped) ? unwrapped : null;
}

function mapRing(value: unknown): [number, number][] | undefined {
  if (!Array.isArray(value) || value.length < 3) return undefined;
  const points: [number, number][] = [];
  for (const item of value) {
    if (!Array.isArray(item) || item.length < 2) continue;
    const lat = Number(item[0]);
    const lng = Number(item[1]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    points.push([lat, lng]);
  }
  return points.length >= 3 ? points : undefined;
}

function mapServiceArea(value: unknown): ServiceAreaPolygon | undefined {
  if (!isRecord(value)) return undefined;
  const ring = mapRing(value.ring);
  return ring ? { ring } : undefined;
}

function mapIsActive(raw: Record<string, unknown>): boolean {
  if (typeof raw.isActive === "boolean") return raw.isActive;
  const status = asString(raw.status).toUpperCase();
  if (status === "INACTIVE" || status === "DISABLED") return false;
  return true;
}

export function mapOfoodPincode(payload: unknown): ServicePincode | null {
  const raw = unwrapOfoodPincode(payload);
  if (!isRecord(raw) || typeof raw.id !== "string") return null;

  const areaName = asString(raw.areaName).trim();

  return {
    id: raw.id,
    cityId: asString(raw.cityId),
    pincode: asString(raw.pincode),
    areaName: areaName || undefined,
    isActive: mapIsActive(raw),
    serviceArea: mapServiceArea(raw.serviceArea),
    createdAt: asString(raw.createdAt),
    updatedAt: asString(raw.updatedAt),
  };
}

function writeServiceArea(
  input: CreatePincodeInput | UpdatePincodeInput,
  existing?: ServicePincode | null,
): { ring: [number, number][] } | null {
  if (input.serviceArea === undefined) {
    return existing?.serviceArea ? { ring: existing.serviceArea.ring } : null;
  }
  if (input.serviceArea === null) return null;
  return { ring: input.serviceArea.ring };
}

export function toOfoodWriteBody(
  input: CreatePincodeInput | UpdatePincodeInput,
  existing?: ServicePincode | null,
): Record<string, unknown> {
  const isActive = input.isActive ?? existing?.isActive ?? true;
  const areaName = (input.areaName ?? existing?.areaName ?? "").trim();

  return {
    pincode: (input.pincode ?? existing?.pincode ?? "").trim(),
    cityId: input.cityId ?? existing?.cityId ?? "",
    areaName: areaName || null,
    isActive,
    status: isActive ? "ACTIVE" : "INACTIVE",
    serviceArea: writeServiceArea(input, existing),
  };
}

export function pincodeFailedUpstream(
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

export function pincodeUnreadable(
  cookies: string[],
  fallback: string,
): NextResponse {
  return pincodeFailedUpstream(
    502,
    { code: ErrorCode.BAD_GATEWAY, message: fallback },
    cookies,
    fallback,
  );
}

export function missingAccessToken() {
  return jsonError("Unauthorized", 401, ErrorCode.UNAUTHORIZED);
}
