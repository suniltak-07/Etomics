import type { NextRequest } from "next/server";
import { jsonError } from "@/lib/api/route-helpers";
import { ErrorCode } from "@/lib/api/errors";
import { ofoodErrorResponse } from "@/lib/backend/proxy";
import {
  jsonAuthOk,
  refreshAccessToken,
  buildSessionFromTokens,
} from "@/lib/backend/session";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const refresh = await refreshAccessToken(request);
  if (!refresh.token) {
    return ofoodErrorResponse(
      refresh.status || 401,
      refresh.error,
      "Unable to refresh session",
    );
  }

  const session = await buildSessionFromTokens(
    { accessToken: refresh.token, expiresIn: refresh.expiresIn },
    refresh.setCookies,
  );

  if (!session.payload) {
    return (
      session.error ??
      jsonError("Unable to refresh session", 401, ErrorCode.UNAUTHORIZED)
    );
  }

  return jsonAuthOk(session.payload, session.cookies);
}
