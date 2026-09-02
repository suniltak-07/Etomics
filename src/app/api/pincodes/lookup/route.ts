import type { NextRequest } from "next/server";
import { ErrorCode } from "@/lib/api/errors";
import { jsonError, jsonOk } from "@/lib/api/route-helpers";
import { lookupIndianPincode } from "@/lib/pincodes/lookup";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const pincode = request.nextUrl.searchParams.get("pincode")?.trim() ?? "";
  if (!/^\d{6}$/.test(pincode)) {
    return jsonError(
      "Enter a valid 6-digit pincode",
      422,
      ErrorCode.VALIDATION_ERROR,
    );
  }

  try {
    const result = await lookupIndianPincode(pincode);
    if (!result) {
      return jsonError("Pincode not found", 404, ErrorCode.NOT_FOUND);
    }
    return jsonOk(result);
  } catch {
    return jsonError("Unable to look up pincode", 502, ErrorCode.BAD_GATEWAY);
  }
}
