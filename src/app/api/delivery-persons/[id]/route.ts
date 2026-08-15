import type { NextRequest } from "next/server";
import type { DeliveryPerson } from "@/types/entities";
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
import { updateDeliveryPersonSchema } from "@/features/delivery-persons/schemas/deliveryPersonSchemas";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = requireAuth(request);
  if (isErrorResponse(auth)) return auth;
  const denied = requirePermission(auth, Permission.DELIVERY_PERSONS_READ);
  if (denied) return denied;

  const { id } = await context.params;
  const person = getDb().deliveryPersons.find((item) => item.id === id);
  if (!person) {
    return jsonError("Delivery person not found", 404, ErrorCode.NOT_FOUND);
  }
  return jsonOk(person);
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = requireAuth(request);
  if (isErrorResponse(auth)) return auth;
  const denied = requirePermission(auth, Permission.DELIVERY_PERSONS_UPDATE);
  if (denied) return denied;

  const { id } = await context.params;
  const existing = getDb().deliveryPersons.find((item) => item.id === id);
  if (!existing) {
    return jsonError("Delivery person not found", 404, ErrorCode.NOT_FOUND);
  }

  const body = await parseJsonBody(request);
  if (isErrorResponse(body)) return body;

  const parsed = updateDeliveryPersonSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation failed", 422, ErrorCode.VALIDATION_ERROR, {
      issues: parsed.error.flatten(),
    });
  }

  if (parsed.data.pincodeIds) {
    const validPins = new Set(getDb().servicePincodes.map((item) => item.id));
    if (parsed.data.pincodeIds.some((pinId) => !validPins.has(pinId))) {
      return jsonError(
        "One or more pincodes are invalid",
        422,
        ErrorCode.VALIDATION_ERROR,
      );
    }
  }

  const updated: DeliveryPerson = {
    ...existing,
    ...parsed.data,
    email:
      parsed.data.email === ""
        ? undefined
        : (parsed.data.email ?? existing.email),
    updatedAt: nowIso(),
  };

  mutate((db) => {
    const index = db.deliveryPersons.findIndex((item) => item.id === id);
    if (index >= 0) db.deliveryPersons[index] = updated;
  });

  return jsonOk(updated, { message: "Delivery person updated" });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = requireAuth(request);
  if (isErrorResponse(auth)) return auth;
  const denied = requirePermission(auth, Permission.DELIVERY_PERSONS_DELETE);
  if (denied) return denied;

  const { id } = await context.params;
  if (!getDb().deliveryPersons.some((item) => item.id === id)) {
    return jsonError("Delivery person not found", 404, ErrorCode.NOT_FOUND);
  }

  mutate((db) => {
    db.deliveryPersons = db.deliveryPersons.filter((item) => item.id !== id);
  });

  return jsonOk({ id }, { message: "Delivery person deleted" });
}
