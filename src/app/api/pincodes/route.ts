import type { NextRequest } from "next/server";
import type { ServicePincode } from "@/types/entities";
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
import { createPincodeSchema } from "@/features/pincodes/schemas/pincodeSchemas";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const cityId = searchParams.get("cityId") ?? undefined;
  const search = searchParams.get("search")?.toLowerCase();
  const activeOnly = searchParams.get("activeOnly") === "true";

  let items = getDb().servicePincodes;
  if (cityId) items = items.filter((item) => item.cityId === cityId);
  if (activeOnly) items = items.filter((item) => item.isActive);
  if (search) {
    items = items.filter(
      (item) =>
        item.pincode.includes(search) ||
        item.areaName?.toLowerCase().includes(search),
    );
  }

  return jsonOk(items);
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (isErrorResponse(auth)) return auth;
  const denied = requirePermission(auth, Permission.PINCODES_CREATE);
  if (denied) return denied;

  const body = await parseJsonBody(request);
  if (isErrorResponse(body)) return body;

  const parsed = createPincodeSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation failed", 422, ErrorCode.VALIDATION_ERROR, {
      issues: parsed.error.flatten(),
    });
  }

  const city = getDb().cities.find((item) => item.id === parsed.data.cityId);
  if (!city) return jsonError("City not found", 404, ErrorCode.NOT_FOUND);

  if (
    getDb().servicePincodes.some((item) => item.pincode === parsed.data.pincode)
  ) {
    return jsonError("Pincode already exists", 409, ErrorCode.CONFLICT);
  }

  const timestamp = nowIso();
  const pincode: ServicePincode = {
    id: createId("pin"),
    cityId: parsed.data.cityId,
    pincode: parsed.data.pincode,
    areaName: parsed.data.areaName,
    isActive: parsed.data.isActive,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  mutate((db) => {
    db.servicePincodes.push(pincode);
  });

  return jsonOk(pincode, { status: 201, message: "Pincode added" });
}
