import type { NextRequest } from "next/server";
import type { City } from "@/types/entities";
import { getDb, mutate } from "@/mocks/seed";
import { Permission } from "@/lib/permissions/permissions";
import { ErrorCode } from "@/lib/api/errors";
import {
  isErrorResponse,
  jsonError,
  jsonOk,
  nowIso,
  parseJsonBody,
  requireAuth,
  requirePermission,
} from "@/lib/api/route-helpers";
import { updateCitySchema } from "@/features/cities/schemas/citySchemas";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const city = getDb().cities.find((item) => item.id === id);
  if (!city) return jsonError("City not found", 404, ErrorCode.NOT_FOUND);
  return jsonOk(city);
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = requireAuth(request);
  if (isErrorResponse(auth)) return auth;
  const denied = requirePermission(auth, Permission.CITIES_UPDATE);
  if (denied) return denied;

  const { id } = await context.params;
  const existing = getDb().cities.find((item) => item.id === id);
  if (!existing) return jsonError("City not found", 404, ErrorCode.NOT_FOUND);

  const body = await parseJsonBody(request);
  if (isErrorResponse(body)) return body;

  const parsed = updateCitySchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation failed", 422, ErrorCode.VALIDATION_ERROR, {
      issues: parsed.error.flatten(),
    });
  }

  if (
    parsed.data.slug &&
    getDb().cities.some(
      (city) => city.slug === parsed.data.slug && city.id !== id,
    )
  ) {
    return jsonError("City slug already exists", 409, ErrorCode.CONFLICT);
  }

  const updated: City = {
    ...existing,
    ...parsed.data,
    updatedAt: nowIso(),
  };

  mutate((db) => {
    const index = db.cities.findIndex((item) => item.id === id);
    if (index >= 0) db.cities[index] = updated;
  });

  return jsonOk(updated, { message: "City updated" });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = requireAuth(request);
  if (isErrorResponse(auth)) return auth;
  const denied = requirePermission(auth, Permission.CITIES_DELETE);
  if (denied) return denied;

  const { id } = await context.params;
  const existing = getDb().cities.find((item) => item.id === id);
  if (!existing) return jsonError("City not found", 404, ErrorCode.NOT_FOUND);

  const linked = getDb().servicePincodes.some((item) => item.cityId === id);
  if (linked) {
    return jsonError(
      "Remove or reassign pincodes before deleting this city",
      409,
      ErrorCode.CONFLICT,
    );
  }

  mutate((db) => {
    db.cities = db.cities.filter((item) => item.id !== id);
  });

  return jsonOk({ id }, { message: "City deleted" });
}
