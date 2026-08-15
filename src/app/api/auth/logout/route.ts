import type { NextRequest } from "next/server";
import { destroySession } from "@/mocks/seed";
import { getBearerToken, jsonOk } from "@/lib/api/route-helpers";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const token = getBearerToken(request);
  if (token) {
    destroySession(token);
  }
  return jsonOk({ loggedOut: true }, { message: "Logged out" });
}
