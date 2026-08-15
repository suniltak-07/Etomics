import type { NextRequest } from "next/server";
import type { DeliveryPerson } from "@/types/entities";
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
import { createDeliveryPersonSchema } from "@/features/delivery-persons/schemas/deliveryPersonSchemas";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (isErrorResponse(auth)) return auth;
  const denied = requirePermission(auth, Permission.DELIVERY_PERSONS_READ);
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? undefined;
  const search = searchParams.get("search")?.toLowerCase();

  let items = getDb().deliveryPersons;
  if (status) items = items.filter((item) => item.status === status);
  if (search) {
    items = items.filter(
      (item) =>
        item.fullName.toLowerCase().includes(search) ||
        item.mobile.includes(search) ||
        item.email?.toLowerCase().includes(search),
    );
  }

  return jsonOk(items);
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (isErrorResponse(auth)) return auth;
  const denied = requirePermission(auth, Permission.DELIVERY_PERSONS_CREATE);
  if (denied) return denied;

  const body = await parseJsonBody(request);
  if (isErrorResponse(body)) return body;

  const parsed = createDeliveryPersonSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation failed", 422, ErrorCode.VALIDATION_ERROR, {
      issues: parsed.error.flatten(),
    });
  }

  const validPins = new Set(getDb().servicePincodes.map((item) => item.id));
  if (parsed.data.pincodeIds.some((id) => !validPins.has(id))) {
    return jsonError(
      "One or more pincodes are invalid",
      422,
      ErrorCode.VALIDATION_ERROR,
    );
  }

  const timestamp = nowIso();
  const person: DeliveryPerson = {
    id: createId("dp"),
    fullName: parsed.data.fullName,
    mobile: parsed.data.mobile,
    email: parsed.data.email || undefined,
    vehicleType: parsed.data.vehicleType,
    vehicleNumber: parsed.data.vehicleNumber,
    status: parsed.data.status,
    pincodeIds: parsed.data.pincodeIds,
    notes: parsed.data.notes,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  mutate((db) => {
    db.deliveryPersons.push(person);
  });

  return jsonOk(person, { status: 201, message: "Delivery person created" });
}
