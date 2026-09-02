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
  unwrapOfoodPincodes,
} from "@/lib/backend/pincodes";
import { createPincodeSchema } from "@/features/pincodes/schemas/pincodeSchemas";
import type { ServicePincode } from "@/types/entities";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const accessToken = getRequestAccessToken(request);

  const result = await ofoodFetch<unknown>("/api/v1/pincodes", { accessToken });
  if (!result.ok) {
    return pincodeFailedUpstream(
      result.status,
      result.error,
      result.setCookies,
      "Unable to load pincodes",
    );
  }

  let items = unwrapOfoodPincodes(result.data)
    .map(mapOfoodPincode)
    .filter((item): item is ServicePincode => item !== null);

  const cityId = searchParams.get("cityId") ?? undefined;
  const search = searchParams.get("search")?.trim().toLowerCase();
  const activeOnly = searchParams.get("activeOnly") === "true";

  if (cityId) items = items.filter((item) => item.cityId === cityId);
  if (activeOnly) items = items.filter((item) => item.isActive);
  if (search) {
    items = items.filter(
      (item) =>
        item.pincode.includes(search) ||
        item.areaName?.toLowerCase().includes(search),
    );
  }

  return applyUpstreamCookies(jsonOk(items), result.setCookies);
}

export async function POST(request: NextRequest) {
  const accessToken = getRequestAccessToken(request);
  if (!accessToken) return missingAccessToken();

  const body = await parseJsonBody(request);
  if (isErrorResponse(body)) return body;

  const parsed = createPincodeSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation failed", 422, ErrorCode.VALIDATION_ERROR, {
      issues: parsed.error.flatten(),
    });
  }

  const result = await ofoodFetch<unknown>("/api/v1/pincodes", {
    method: "POST",
    accessToken,
    body: toOfoodWriteBody(parsed.data),
  });

  if (!result.ok) {
    return pincodeFailedUpstream(
      result.status,
      result.error,
      result.setCookies,
      "Unable to create pincode",
    );
  }

  const pincode = mapOfoodPincode(result.data);
  if (!pincode) {
    return pincodeUnreadable(
      result.setCookies,
      "Pincode was created but the response could not be read.",
    );
  }

  return applyUpstreamCookies(
    jsonOk(pincode, { status: 201, message: "Pincode added" }),
    result.setCookies,
  );
}
