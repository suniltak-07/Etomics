import type { NextRequest } from "next/server";
import { getDb } from "@/mocks/seed";
import { ErrorCode } from "@/lib/api/errors";
import { jsonError, jsonOk } from "@/lib/api/route-helpers";
import { applyUpstreamCookies, ofoodFetch } from "@/lib/backend/proxy";
import { getRequestAccessToken } from "@/lib/backend/session";
import {
  deliveryPersonFailedUpstream,
  mapOfoodDeliveryPerson,
} from "@/lib/backend/delivery-persons";
import { MealType } from "@/types/enums";
import { buildKitchenSheet } from "@/lib/kitchen/buildKitchenSheet";
import { orderStopsNearestNeighbor } from "@/lib/delivery/routeOrder";
import { toDateOnly } from "@/lib/calendar/deliveryCalendar";

export const dynamic = "force-dynamic";

const DEFAULT_ORIGIN = { latitude: 12.9716, longitude: 77.5946 };

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const accessToken = getRequestAccessToken(request);
  const { searchParams } = request.nextUrl;
  const date = searchParams.get("date") ?? toDateOnly(new Date());
  const mealParam = searchParams.get("mealType");
  const mealType =
    mealParam && Object.values(MealType).includes(mealParam as MealType)
      ? (mealParam as MealType)
      : null;

  const result = await ofoodFetch<unknown>(`/api/v1/delivery-persons/${id}`, {
    accessToken,
  });
  if (!result.ok) {
    return deliveryPersonFailedUpstream(
      result.status,
      result.error,
      result.setCookies,
      "Delivery person not found",
    );
  }

  const person = mapOfoodDeliveryPerson(result.data);
  if (!person) {
    return jsonError("Delivery person not found", 404, ErrorCode.NOT_FOUND);
  }

  const db = getDb();
  const pinSet = new Set(
    db.servicePincodes
      .filter(
        (pin) =>
          person.pincodeIds.includes(pin.id) ||
          person.pincodeIds.includes(pin.pincode),
      )
      .map((pin) => pin.pincode),
  );

  const kitchenRows = buildKitchenSheet(db, date, mealType).filter((row) =>
    pinSet.has(row.pincode),
  );

  const withCoords = kitchenRows.filter(
    (row) =>
      typeof row.latitude === "number" && typeof row.longitude === "number",
  );

  const ordered = orderStopsNearestNeighbor(
    withCoords.map((row) => ({
      ...row,
      id: row.subscriptionId,
      latitude: row.latitude as number,
      longitude: row.longitude as number,
    })),
    DEFAULT_ORIGIN,
  );

  return applyUpstreamCookies(
    jsonOk({
      date,
      mealType,
      person,
      origin: DEFAULT_ORIGIN,
      stops: ordered.map((stop, index) => ({
        sequence: index + 1,
        ...stop,
      })),
    }),
    result.setCookies,
  );
}
