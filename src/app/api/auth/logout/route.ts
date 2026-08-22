import type { NextRequest } from "next/server";
import { jsonOk } from "@/lib/api/route-helpers";
import {
  applyUpstreamCookies,
  ofoodErrorResponse,
  ofoodFetch,
  pickRefreshCookieHeader,
} from "@/lib/backend/proxy";
import { getRequestAccessToken } from "@/lib/backend/session";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const accessToken = getRequestAccessToken(request);
  const cookieHeader = pickRefreshCookieHeader(request);

  if (!accessToken && !cookieHeader) {
    return jsonOk({ loggedOut: true }, { message: "Logged out" });
  }

  const result = await ofoodFetch("/api/v1/auth/logout", {
    method: "POST",
    accessToken,
    cookieHeader,
  });

  if (!result.ok && result.status !== 401 && result.status !== 204) {
    return applyUpstreamCookies(
      ofoodErrorResponse(result.status, result.error, "Unable to log out"),
      result.setCookies,
    );
  }

  return applyUpstreamCookies(
    jsonOk({ loggedOut: true }, { message: "Logged out" }),
    result.setCookies,
  );
}
