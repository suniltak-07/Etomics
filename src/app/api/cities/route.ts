import type { NextRequest } from "next/server";
import type { City } from "@/types/entities";
import { getDb, mutate } from "@/mocks/seed";
import { Permission } from "@/lib/permissions/permissions";
import { ErrorCode } from "@/lib/api/errors";
import {
  createId,
  isErrorResponse,
  jsonError,
  jsonOk,
  nowIso,
  parseJsonBody,
  requireAuth,
  requirePermission,
} from "@/lib/api/route-helpers";
import { createCitySchema } from "@/features/cities/schemas/citySchemas";
import { findCityCatalogEntry } from "@/features/cities/catalog";
import { CityStatus } from "@/types/enums";
import { slugify } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search")?.toLowerCase();
  const activeOnly = searchParams.get("activeOnly") === "true";

  let cities = getDb().cities;
  if (activeOnly) {
    cities = cities.filter((city) => city.status === CityStatus.ACTIVE);
  } else if (status) {
    cities = cities.filter((city) => city.status === status);
  }
  if (search) {
    cities = cities.filter(
      (city) =>
        city.name.toLowerCase().includes(search) ||
        city.state.toLowerCase().includes(search) ||
        city.slug.includes(search),
    );
  }

  return jsonOk(cities);
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (isErrorResponse(auth)) return auth;
  const denied = requirePermission(auth, Permission.CITIES_CREATE);
  if (denied) return denied;

  const body = await parseJsonBody<Record<string, unknown>>(request);
  if (isErrorResponse(body)) return body;

  const name = typeof body.name === "string" ? body.name : "";
  const slugFromBody = typeof body.slug === "string" ? body.slug : "";
  const parsed = createCitySchema.safeParse({
    ...body,
    slug: slugFromBody || slugify(name),
  });
  if (!parsed.success) {
    return jsonError("Validation failed", 422, ErrorCode.VALIDATION_ERROR, {
      issues: parsed.error.flatten(),
    });
  }

  if (getDb().cities.some((city) => city.slug === parsed.data.slug)) {
    return jsonError("City slug already exists", 409, ErrorCode.CONFLICT);
  }

  const timestamp = nowIso();
  const catalog = findCityCatalogEntry(parsed.data.name);
  const city: City = {
    id: createId("city"),
    ...parsed.data,
    centerLat: catalog?.centerLat ?? 20.5937,
    centerLng: catalog?.centerLng ?? 78.9629,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  mutate((db) => {
    db.cities.push(city);
  });

  return jsonOk(city, { status: 201, message: "City created" });
}

export async function PUT() {
  return jsonError("Use /api/cities/[id]", 405, ErrorCode.BAD_REQUEST);
}
