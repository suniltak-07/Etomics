import type { NextRequest } from "next/server";
import { ErrorCode } from "@/lib/api/errors";
import {
  isErrorResponse,
  jsonError,
  jsonOk,
  parseJsonBody,
} from "@/lib/api/route-helpers";
import { applyUpstreamCookies, ofoodFetch } from "@/lib/backend/proxy";
import { getRequestAccessToken } from "@/lib/backend/session";
import {
  cityFailedUpstream,
  cityUnreadable,
  mapOfoodCity,
  missingAccessToken,
  toOfoodWriteBody,
  unwrapOfoodCities,
} from "@/lib/backend/cities";
import { createCitySchema } from "@/features/cities/schemas/citySchemas";
import { findCityCatalogEntry } from "@/features/cities/catalog";
import { slugify } from "@/lib/utils/format";
import { CityStatus } from "@/types/enums";
import type { City } from "@/types/entities";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const accessToken = getRequestAccessToken(request);

  const result = await ofoodFetch<unknown>("/api/v1/cities", { accessToken });
  if (!result.ok) {
    return cityFailedUpstream(
      result.status,
      result.error,
      result.setCookies,
      "Unable to load cities",
    );
  }

  let cities = unwrapOfoodCities(result.data)
    .map(mapOfoodCity)
    .filter((city): city is City => city !== null);

  const status = searchParams.get("status") ?? undefined;
  const search = searchParams.get("search")?.trim().toLowerCase();
  const activeOnly = searchParams.get("activeOnly") === "true";

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

  return applyUpstreamCookies(jsonOk(cities), result.setCookies);
}

export async function POST(request: NextRequest) {
  const accessToken = getRequestAccessToken(request);
  if (!accessToken) return missingAccessToken();

  const body = await parseJsonBody<Record<string, unknown>>(request);
  if (isErrorResponse(body)) return body;

  const name = typeof body.name === "string" ? body.name : "";
  const slugFromBody = typeof body.slug === "string" ? body.slug : "";
  const catalog = findCityCatalogEntry(name);
  const parsed = createCitySchema.safeParse({
    ...body,
    name: catalog?.name ?? name,
    slug: catalog?.slug ?? (slugFromBody || slugify(name)),
    state: catalog?.state ?? body.state,
  });
  if (!parsed.success) {
    return jsonError("Validation failed", 422, ErrorCode.VALIDATION_ERROR, {
      issues: parsed.error.flatten(),
    });
  }

  const result = await ofoodFetch<unknown>("/api/v1/cities", {
    method: "POST",
    accessToken,
    body: toOfoodWriteBody(parsed.data),
  });

  if (!result.ok) {
    return cityFailedUpstream(
      result.status,
      result.error,
      result.setCookies,
      "Unable to create city",
    );
  }

  const city = mapOfoodCity(result.data);
  if (!city) {
    return cityUnreadable(
      result.setCookies,
      "City was created but the response could not be read.",
    );
  }

  return applyUpstreamCookies(
    jsonOk(city, { status: 201, message: "City created" }),
    result.setCookies,
  );
}
