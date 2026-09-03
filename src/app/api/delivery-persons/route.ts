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
  deliveryPersonFailedUpstream,
  deliveryPersonUnreadable,
  mapOfoodDeliveryPerson,
  missingAccessToken,
  toOfoodWriteBody,
  unwrapOfoodDeliveryPersons,
} from "@/lib/backend/delivery-persons";
import { createDeliveryPersonSchema } from "@/features/delivery-persons/schemas/deliveryPersonSchemas";
import type { DeliveryPerson } from "@/types/entities";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const accessToken = getRequestAccessToken(request);

  const result = await ofoodFetch<unknown>("/api/v1/delivery-persons", {
    accessToken,
  });
  if (!result.ok) {
    return deliveryPersonFailedUpstream(
      result.status,
      result.error,
      result.setCookies,
      "Unable to load delivery persons",
    );
  }

  let items = unwrapOfoodDeliveryPersons(result.data)
    .map(mapOfoodDeliveryPerson)
    .filter((item): item is DeliveryPerson => item !== null);

  const status = searchParams.get("status") ?? undefined;
  const search = searchParams.get("search")?.trim().toLowerCase();

  if (status) {
    items = items.filter((item) => item.status === status);
  }
  if (search) {
    items = items.filter(
      (item) =>
        item.fullName.toLowerCase().includes(search) ||
        item.firstName.toLowerCase().includes(search) ||
        item.lastName.toLowerCase().includes(search) ||
        item.mobile.includes(search),
    );
  }

  return applyUpstreamCookies(jsonOk(items), result.setCookies);
}

export async function POST(request: NextRequest) {
  const accessToken = getRequestAccessToken(request);
  if (!accessToken) return missingAccessToken();

  const body = await parseJsonBody(request);
  if (isErrorResponse(body)) return body;

  const parsed = createDeliveryPersonSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation failed", 422, ErrorCode.VALIDATION_ERROR, {
      issues: parsed.error.flatten(),
    });
  }

  const result = await ofoodFetch<unknown>("/api/v1/delivery-persons", {
    method: "POST",
    accessToken,
    body: toOfoodWriteBody(parsed.data),
  });

  if (!result.ok) {
    return deliveryPersonFailedUpstream(
      result.status,
      result.error,
      result.setCookies,
      "Unable to create delivery person",
    );
  }

  const person = mapOfoodDeliveryPerson(result.data);
  if (!person) {
    return deliveryPersonUnreadable(
      result.setCookies,
      "Delivery person was created but the response could not be read.",
    );
  }

  return applyUpstreamCookies(
    jsonOk(person, { status: 201, message: "Delivery person created" }),
    result.setCookies,
  );
}
