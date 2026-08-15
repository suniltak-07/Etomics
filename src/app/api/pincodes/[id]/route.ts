import type { NextRequest } from "next/server";
import type { ServicePincode } from "@/types/entities";
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
import { updatePincodeSchema } from "@/features/pincodes/schemas/pincodeSchemas";

export const dynamic = "force-dynamic";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = requireAuth(request);
  if (isErrorResponse(auth)) return auth;
  const denied = requirePermission(auth, Permission.PINCODES_UPDATE);
  if (denied) return denied;

  const { id } = await context.params;
  const existing = getDb().servicePincodes.find((item) => item.id === id);
  if (!existing)
    return jsonError("Pincode not found", 404, ErrorCode.NOT_FOUND);

  const body = await parseJsonBody(request);
  if (isErrorResponse(body)) return body;

  const parsed = updatePincodeSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation failed", 422, ErrorCode.VALIDATION_ERROR, {
      issues: parsed.error.flatten(),
    });
  }

  if (
    parsed.data.pincode &&
    getDb().servicePincodes.some(
      (item) => item.pincode === parsed.data.pincode && item.id !== id,
    )
  ) {
    return jsonError("Pincode already exists", 409, ErrorCode.CONFLICT);
  }

  if (
    parsed.data.cityId &&
    !getDb().cities.some((city) => city.id === parsed.data.cityId)
  ) {
    return jsonError("City not found", 404, ErrorCode.NOT_FOUND);
  }

  const updated: ServicePincode = {
    ...existing,
    ...parsed.data,
    updatedAt: nowIso(),
  };

  mutate((db) => {
    const index = db.servicePincodes.findIndex((item) => item.id === id);
    if (index >= 0) db.servicePincodes[index] = updated;
  });

  return jsonOk(updated, { message: "Pincode updated" });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = requireAuth(request);
  if (isErrorResponse(auth)) return auth;
  const denied = requirePermission(auth, Permission.PINCODES_DELETE);
  if (denied) return denied;

  const { id } = await context.params;
  if (!getDb().servicePincodes.some((item) => item.id === id)) {
    return jsonError("Pincode not found", 404, ErrorCode.NOT_FOUND);
  }

  mutate((db) => {
    db.servicePincodes = db.servicePincodes.filter((item) => item.id !== id);
    for (const person of db.deliveryPersons) {
      person.pincodeIds = person.pincodeIds.filter((pinId) => pinId !== id);
    }
  });

  return jsonOk({ id }, { message: "Pincode deleted" });
}
