import type { NextRequest } from "next/server";
import { getDb } from "@/mocks/seed";
import { Permission } from "@/lib/permissions/permissions";
import { ErrorCode } from "@/lib/api/errors";
import {
  isErrorResponse,
  jsonError,
  jsonOk,
  requireAuth,
  requirePermission,
} from "@/lib/api/route-helpers";
import { MealType } from "@/types/enums";
import { buildKitchenSheet } from "@/lib/kitchen/buildKitchenSheet";
import { orderStopsNearestNeighbor } from "@/lib/delivery/routeOrder";
import { toDateOnly } from "@/lib/calendar/deliveryCalendar";

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
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") ?? toDateOnly(new Date());
  const mealParam = searchParams.get("mealType");
  const mealType =
    mealParam && Object.values(MealType).includes(mealParam as MealType)
      ? (mealParam as MealType)
      : null;

  const db = getDb();
  const person = db.deliveryPersons.find((item) => item.id === id);
  if (!person) {
    return jsonError("Delivery person not found", 404, ErrorCode.NOT_FOUND);
  }

  const pinSet = new Set(
    db.servicePincodes
      .filter((pin) => person.pincodeIds.includes(pin.id))
      .map((pin) => pin.pincode),
  );

  const kitchenRows = buildKitchenSheet(db, date, mealType).filter((row) =>
    pinSet.has(row.pincode),
  );

  const withCoords = kitchenRows.filter(
    (row) =>
      typeof row.latitude === "number" && typeof row.longitude === "number",
  );

  const origin = {
    latitude: person.lastLat ?? 12.9716,
    longitude: person.lastLng ?? 77.5946,
  };

  const ordered = orderStopsNearestNeighbor(
    withCoords.map((row) => ({
      ...row,
      id: row.subscriptionId,
      latitude: row.latitude as number,
      longitude: row.longitude as number,
    })),
    origin,
  );

  return jsonOk({
    date,
    mealType,
    person,
    origin,
    stops: ordered.map((stop, index) => ({
      sequence: index + 1,
      ...stop,
    })),
  });
}
