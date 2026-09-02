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
} from "@/lib/backend/cities";
import { updateCitySchema } from "@/features/cities/schemas/citySchemas";
import { findCityCatalogEntry } from "@/features/cities/catalog";

export const dynamic = "force-dynamic";

async function loadCity(id: string, accessToken: string | null) {
  return ofoodFetch<unknown>(`/api/v1/cities/${id}`, { accessToken });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const accessToken = getRequestAccessToken(request);
  const result = await loadCity(id, accessToken);

  if (!result.ok) {
    return cityFailedUpstream(
      result.status,
      result.error,
      result.setCookies,
      "City not found",
    );
  }

  const city = mapOfoodCity(result.data);
  if (!city) {
    return jsonError("City not found", 404, ErrorCode.NOT_FOUND);
  }

  return applyUpstreamCookies(jsonOk(city), result.setCookies);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const accessToken = getRequestAccessToken(request);
  if (!accessToken) return missingAccessToken();

  const { id } = await params;
  const body = await parseJsonBody<Record<string, unknown>>(request);
  if (isErrorResponse(body)) return body;

  const name = typeof body.name === "string" ? body.name : "";
  const catalog = findCityCatalogEntry(name);
  const parsed = updateCitySchema.safeParse(
    catalog
      ? {
          ...body,
          name: catalog.name,
          slug: catalog.slug,
          state: catalog.state,
        }
      : body,
  );
  if (!parsed.success) {
    return jsonError("Validation failed", 422, ErrorCode.VALIDATION_ERROR, {
      issues: parsed.error.flatten(),
    });
  }

  const current = await loadCity(id, accessToken);
  const existing = current.ok ? mapOfoodCity(current.data) : null;

  const result = await ofoodFetch<unknown>(`/api/v1/cities/${id}`, {
    method: "PUT",
    accessToken,
    body: toOfoodWriteBody(parsed.data, existing),
  });

  if (!result.ok) {
    return cityFailedUpstream(
      result.status,
      result.error,
      result.setCookies,
      "Unable to update city",
    );
  }

  const city = mapOfoodCity(result.data);
  if (!city) {
    return cityUnreadable(
      result.setCookies,
      "City was updated but the response could not be read.",
    );
  }

  return applyUpstreamCookies(
    jsonOk(city, { message: "City updated" }),
    result.setCookies,
  );
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const accessToken = getRequestAccessToken(request);
  if (!accessToken) return missingAccessToken();

  const { id } = await params;
  const result = await ofoodFetch<unknown>(`/api/v1/cities/${id}`, {
    method: "DELETE",
    accessToken,
  });

  if (!result.ok) {
    return cityFailedUpstream(
      result.status,
      result.error,
      result.setCookies,
      "Unable to delete city",
    );
  }

  return applyUpstreamCookies(
    jsonOk({ id }, { message: "City deleted" }),
    result.setCookies,
  );
}
