import type { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api/route-helpers";
import { ErrorCode } from "@/lib/api/errors";
import { applyUpstreamCookies, ofoodErrorResponse } from "@/lib/backend/proxy";
import {
  getRequestAccessToken,
  loadSessionUser,
  refreshAccessToken,
} from "@/lib/backend/session";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const existingToken = getRequestAccessToken(request);

  if (existingToken) {
    const profile = await loadSessionUser(existingToken);
    if (profile.user) {
      return jsonOk({ user: profile.user, token: existingToken });
    }
    if (profile.status && profile.status !== 401) {
      if (profile.user === null && profile.status < 400) {
        return jsonError(
          "This account does not have a supported role (ROLE_CUSTOMER or ROLE_ADMIN).",
          403,
          ErrorCode.FORBIDDEN,
        );
      }
      return ofoodErrorResponse(
        profile.status,
        profile.error,
        "Unable to load profile",
      );
    }
  }

  const refresh = await refreshAccessToken(request);
  const cookies = refresh.setCookies;
  if (!refresh.token) {
    return applyUpstreamCookies(
      jsonError("Unauthorized", 401, ErrorCode.UNAUTHORIZED),
      cookies,
    );
  }

  const token = refresh.token;
  const profile = await loadSessionUser(token);
  if (!profile.user) {
    const error =
      profile.status < 400
        ? jsonError(
            "This account does not have a supported role (ROLE_CUSTOMER or ROLE_ADMIN).",
            403,
            ErrorCode.FORBIDDEN,
          )
        : ofoodErrorResponse(
            profile.status || 401,
            profile.error,
            "Unable to load profile",
          );
    return applyUpstreamCookies(error, cookies);
  }

  return applyUpstreamCookies(
    jsonOk({
      user: profile.user,
      token,
      expiresIn: refresh.expiresIn,
      refreshed: true,
    }),
    cookies,
  );
}
