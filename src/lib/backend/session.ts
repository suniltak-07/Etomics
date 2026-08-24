import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { jsonError, jsonOk } from "@/lib/api/route-helpers";
import { ErrorCode } from "@/lib/api/errors";
import type { SessionUser } from "@/lib/auth/session";
import {
  applyUpstreamCookies,
  ofoodErrorResponse,
  ofoodFetch,
  pickRefreshCookieHeader,
} from "@/lib/backend/proxy";
import type {
  OfoodApiError,
  OfoodAuthTokenResponse,
} from "@/lib/backend/types";
import { collectBackendRoles } from "@/lib/backend/roles";
import { rolesFromJwt } from "@/lib/backend/jwt";
import { mapOfoodUserToSession, unwrapOfoodUser } from "@/lib/backend/user";

export interface AuthPayload {
  user: SessionUser;
  token: string;
  expiresIn?: number;
}

async function loadSessionUser(accessToken: string): Promise<{
  user: SessionUser | null;
  status: number;
  error: OfoodApiError | null;
}> {
  const me = await ofoodFetch<unknown>("/api/v1/auth/me", {
    accessToken,
  });
  if (!me.ok || me.data == null) {
    return { user: null, status: me.status, error: me.error };
  }

  const dto = unwrapOfoodUser(me.data);
  if (!dto) {
    return { user: null, status: me.status, error: me.error };
  }

  const jwtRoles = rolesFromJwt(accessToken);
  const user = mapOfoodUserToSession({
    ...dto,
    roles: collectBackendRoles(dto.roles, dto.role).concat(jwtRoles),
  });

  return {
    user,
    status: me.status,
    error: me.error,
  };
}

export async function refreshAccessToken(request: Request): Promise<{
  token: string | null;
  expiresIn?: number;
  setCookies: string[];
  status: number;
  error: OfoodApiError | null;
}> {
  const cookieHeader = pickRefreshCookieHeader(request);
  if (!cookieHeader) {
    return {
      token: null,
      setCookies: [],
      status: 401,
      error: {
        code: ErrorCode.AUTHENTICATION_REQUIRED,
        message: "No refresh session",
      },
    };
  }

  const result = await ofoodFetch<OfoodAuthTokenResponse>(
    "/api/v1/auth/refresh",
    { method: "POST", cookieHeader },
  );

  if (!result.ok || !result.data?.accessToken) {
    return {
      token: null,
      setCookies: result.setCookies,
      status: result.status,
      error: result.error,
    };
  }

  return {
    token: result.data.accessToken,
    expiresIn: result.data.expiresIn,
    setCookies: result.setCookies,
    status: result.status,
    error: null,
  };
}

export async function buildSessionFromTokens(
  tokens: OfoodAuthTokenResponse,
  extraCookies: string[] = [],
): Promise<{
  payload: AuthPayload | null;
  cookies: string[];
  error?: NextResponse;
}> {
  const profile = await loadSessionUser(tokens.accessToken);
  if (!profile.user) {
    if (profile.error || profile.status >= 400) {
      return {
        payload: null,
        cookies: extraCookies,
        error: ofoodErrorResponse(
          profile.status || 401,
          profile.error,
          "Unable to load user profile",
        ),
      };
    }
    return {
      payload: null,
      cookies: extraCookies,
      error: jsonError(
        "This account does not have a supported role (ROLE_CUSTOMER or ROLE_ADMIN).",
        403,
        ErrorCode.FORBIDDEN,
      ),
    };
  }

  return {
    payload: {
      user: profile.user,
      token: tokens.accessToken,
      expiresIn: tokens.expiresIn,
    },
    cookies: extraCookies,
  };
}

export async function loginWithOfood(
  email: string,
  password: string,
): Promise<{
  payload: AuthPayload | null;
  cookies: string[];
  error?: NextResponse;
}> {
  const login = await ofoodFetch<OfoodAuthTokenResponse>("/api/v1/auth/login", {
    method: "POST",
    body: { email, password },
  });

  if (!login.ok || !login.data?.accessToken) {
    return {
      payload: null,
      cookies: login.setCookies,
      error: ofoodErrorResponse(
        login.status || 401,
        login.error,
        "Invalid email or password",
      ),
    };
  }

  return buildSessionFromTokens(login.data, login.setCookies);
}

export function jsonAuthOk(
  payload: AuthPayload,
  cookies: string[],
  init?: { status?: number; message?: string },
): NextResponse {
  const response = jsonOk(payload, init);
  return applyUpstreamCookies(response, cookies);
}

export function getRequestAccessToken(request: NextRequest): string | null {
  const header = request.headers.get("authorization");
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match?.[1]?.trim() || null;
}

export { loadSessionUser };
