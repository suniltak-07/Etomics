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
  mapOfoodPincode,
  missingAccessToken,
  pincodeFailedUpstream,
  pincodeUnreadable,
  toOfoodWriteBody,
} from "@/lib/backend/pincodes";
import { updatePincodeSchema } from "@/features/pincodes/schemas/pincodeSchemas";

export const dynamic = "force-dynamic";

async function loadPincode(id: string, accessToken: string | null) {
  return ofoodFetch<unknown>(`/api/v1/pincodes/${id}`, { accessToken });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const accessToken = getRequestAccessToken(request);
  const result = await loadPincode(id, accessToken);

  if (!result.ok) {
    return pincodeFailedUpstream(
      result.status,
      result.error,
      result.setCookies,
      "Pincode not found",
    );
  }

  const pincode = mapOfoodPincode(result.data);
  if (!pincode) {
    return jsonError("Pincode not found", 404, ErrorCode.NOT_FOUND);
  }

  return applyUpstreamCookies(jsonOk(pincode), result.setCookies);
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

  const parsed = updatePincodeSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation failed", 422, ErrorCode.VALIDATION_ERROR, {
      issues: parsed.error.flatten(),
    });
  }

  const current = await loadPincode(id, accessToken);
  const existing = current.ok ? mapOfoodPincode(current.data) : null;

  const result = await ofoodFetch<unknown>(`/api/v1/pincodes/${id}`, {
    method: "PUT",
    accessToken,
    body: toOfoodWriteBody(parsed.data, existing),
  });

  if (!result.ok) {
    return pincodeFailedUpstream(
      result.status,
      result.error,
      result.setCookies,
      "Unable to update pincode",
    );
  }

  const pincode = mapOfoodPincode(result.data);
  if (!pincode) {
    return pincodeUnreadable(
      result.setCookies,
      "Pincode was updated but the response could not be read.",
    );
  }

  return applyUpstreamCookies(
    jsonOk(pincode, { message: "Pincode updated" }),
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
  const result = await ofoodFetch<unknown>(`/api/v1/pincodes/${id}`, {
    method: "DELETE",
    accessToken,
  });

  if (!result.ok) {
    return pincodeFailedUpstream(
      result.status,
      result.error,
      result.setCookies,
      "Unable to delete pincode",
    );
  }

  return applyUpstreamCookies(
    jsonOk({ id }, { message: "Pincode deleted" }),
    result.setCookies,
  );
}
