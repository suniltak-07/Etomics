import type { NextRequest } from "next/server";
import { checkPincodeServiceability } from "@/lib/serviceability/checkPincode";
import { jsonOk } from "@/lib/api/route-helpers";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const pincode = new URL(request.url).searchParams.get("pincode") ?? "";
  const result = checkPincodeServiceability(pincode);
  return jsonOk(result);
}
