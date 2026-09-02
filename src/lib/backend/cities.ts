import type { NextResponse } from "next/server";
import { jsonError } from "@/lib/api/route-helpers";
import { ErrorCode } from "@/lib/api/errors";
import { applyUpstreamCookies, ofoodErrorResponse } from "@/lib/backend/proxy";
import type { OfoodApiError } from "@/lib/backend/types";
import { CITY_CATALOG, findCityCatalogEntry } from "@/features/cities/catalog";
import type {
  CreateCityInput,
  UpdateCityInput,
} from "@/features/cities/schemas/citySchemas";
import type { City } from "@/types/entities";
import { CityStatus } from "@/types/enums";

const INDIA_MAP_CENTER = { centerLat: 20.5937, centerLng: 78.9629 };

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function unwrapPayload(payload: unknown): unknown {
  if (Array.isArray(payload) || !isRecord(payload)) return payload;
  if ("id" in payload && typeof payload.id === "string") return payload;
  if ("data" in payload) return unwrapPayload(payload.data);
  if (Array.isArray(payload.content)) return payload.content;
  return payload;
}

export function unwrapOfoodCities(payload: unknown): unknown[] {
  const unwrapped = unwrapPayload(payload);
  return Array.isArray(unwrapped) ? unwrapped : [];
}

export function unwrapOfoodCity(payload: unknown): unknown {
  const unwrapped = unwrapPayload(payload);
  return isRecord(unwrapped) ? unwrapped : null;
}

function mapStatus(value: unknown): CityStatus {
  const raw = asString(value).toUpperCase();
  if ((Object.values(CityStatus) as string[]).includes(raw)) {
    return raw as CityStatus;
  }
  return CityStatus.ACTIVE;
}

function catalogCoords(name: string, slug: string) {
  const byName = findCityCatalogEntry(name);
  if (byName) {
    return { centerLat: byName.centerLat, centerLng: byName.centerLng };
  }
  const bySlug = CITY_CATALOG.find(
    (city) => city.slug === slug.trim().toLowerCase(),
  );
  if (bySlug) {
    return { centerLat: bySlug.centerLat, centerLng: bySlug.centerLng };
  }
  return INDIA_MAP_CENTER;
}

export function mapOfoodCity(payload: unknown): City | null {
  const raw = unwrapOfoodCity(payload);
  if (!isRecord(raw) || typeof raw.id !== "string") return null;

  const name = asString(raw.name);
  const slug = asString(raw.slug);
  const coords = catalogCoords(name, slug);

  return {
    id: raw.id,
    name,
    slug,
    state: asString(raw.state),
    status: mapStatus(raw.status),
    centerLat: asNumber(raw.centerLat) ?? coords.centerLat,
    centerLng: asNumber(raw.centerLng) ?? coords.centerLng,
    createdAt: asString(raw.createdAt),
    updatedAt: asString(raw.updatedAt),
  };
}

export function toOfoodWriteBody(
  input: CreateCityInput | UpdateCityInput,
  existing?: City | null,
): Record<string, unknown> {
  return {
    name: (input.name ?? existing?.name ?? "").trim(),
    slug: (input.slug ?? existing?.slug ?? "").trim(),
    state: (input.state ?? existing?.state ?? "").trim(),
    status: input.status ?? existing?.status ?? CityStatus.ACTIVE,
  };
}

export function cityFailedUpstream(
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

export function cityUnreadable(
  cookies: string[],
  fallback: string,
): NextResponse {
  return cityFailedUpstream(
    502,
    { code: ErrorCode.BAD_GATEWAY, message: fallback },
    cookies,
    fallback,
  );
}

export function missingAccessToken() {
  return jsonError("Unauthorized", 401, ErrorCode.UNAUTHORIZED);
}
