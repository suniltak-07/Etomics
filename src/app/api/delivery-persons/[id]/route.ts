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
} from "@/lib/backend/delivery-persons";
import { updateDeliveryPersonSchema } from "@/features/delivery-persons/schemas/deliveryPersonSchemas";

export const dynamic = "force-dynamic";

async function loadDeliveryPerson(id: string, accessToken: string | null) {
  return ofoodFetch<unknown>(`/api/v1/delivery-persons/${id}`, {
    accessToken,
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const accessToken = getRequestAccessToken(request);
  const result = await loadDeliveryPerson(id, accessToken);

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

  return applyUpstreamCookies(jsonOk(person), result.setCookies);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const accessToken = getRequestAccessToken(request);
  if (!accessToken) return missingAccessToken();

  const { id } = await params;
  const body = await parseJsonBody(request);
  if (isErrorResponse(body)) return body;

  const parsed = updateDeliveryPersonSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation failed", 422, ErrorCode.VALIDATION_ERROR, {
      issues: parsed.error.flatten(),
    });
  }

  const current = await loadDeliveryPerson(id, accessToken);
  const existing = current.ok ? mapOfoodDeliveryPerson(current.data) : null;

  const result = await ofoodFetch<unknown>(`/api/v1/delivery-persons/${id}`, {
    method: "PUT",
    accessToken,
    body: toOfoodWriteBody(parsed.data, existing),
  });

  if (!result.ok) {
    return deliveryPersonFailedUpstream(
      result.status,
      result.error,
      result.setCookies,
      "Unable to update delivery person",
    );
  }

  const person = mapOfoodDeliveryPerson(result.data);
  if (!person) {
    return deliveryPersonUnreadable(
      result.setCookies,
      "Delivery person was updated but the response could not be read.",
    );
  }

  return applyUpstreamCookies(
    jsonOk(person, { message: "Delivery person updated" }),
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
  const result = await ofoodFetch<unknown>(`/api/v1/delivery-persons/${id}`, {
    method: "DELETE",
    accessToken,
  });

  if (!result.ok) {
    return deliveryPersonFailedUpstream(
      result.status,
      result.error,
      result.setCookies,
      "Unable to delete delivery person",
    );
  }

  return applyUpstreamCookies(
    jsonOk({ id }, { message: "Delivery person deleted" }),
    result.setCookies,
  );
}
