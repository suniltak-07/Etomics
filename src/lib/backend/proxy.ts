import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api/route-helpers";
import { ErrorCode } from "@/lib/api/errors";
import { getOfoodBaseUrl, OFOOD_REFRESH_COOKIE } from "@/lib/backend/config";
import type { OfoodApiError } from "@/lib/backend/types";

export interface OfoodRequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  accessToken?: string | null;
  cookieHeader?: string | null;
  signal?: AbortSignal;
}

export interface OfoodResult<T> {
  ok: boolean;
  status: number;
  data: T | null;
  error: OfoodApiError | null;
  setCookies: string[];
}

function rewriteSetCookieForApp(setCookie: string): string {
  const [nameValue, ...attrs] = setCookie.split(";").map((part) => part.trim());
  if (!nameValue) return setCookie;

  const keep = attrs.filter((attr) => {
    const key = attr.split("=")[0]?.toLowerCase();
    if (key === "domain") return false;
    if (key === "secure" && process.env.NODE_ENV !== "production") return false;
    return true;
  });

  return [nameValue, ...keep].join("; ");
}

export function applyUpstreamCookies(
  response: NextResponse,
  setCookies: string[],
): NextResponse {
  for (const cookie of setCookies) {
    response.headers.append("Set-Cookie", rewriteSetCookieForApp(cookie));
  }
  return response;
}

export function pickRefreshCookieHeader(request: Request): string | undefined {
  const cookie = request.headers.get("cookie");
  if (!cookie) return undefined;

  const match = cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${OFOOD_REFRESH_COOKIE}=`));

  return match;
}

function parseError(payload: unknown): OfoodApiError | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as Record<string, unknown>;
  return {
    code: typeof record.code === "string" ? record.code : undefined,
    message: typeof record.message === "string" ? record.message : undefined,
    traceId: typeof record.traceId === "string" ? record.traceId : undefined,
  };
}

export function ofoodErrorResponse(
  status: number,
  error: OfoodApiError | null,
  fallback = "Request failed",
): NextResponse {
  const message = error?.message || fallback;
  const code = error?.code || ErrorCode.UNKNOWN;
  return jsonError(
    message,
    status,
    code,
    error?.traceId ? { traceId: error.traceId } : undefined,
  );
}

export async function ofoodFetch<T = unknown>(
  path: string,
  options: OfoodRequestOptions = {},
): Promise<OfoodResult<T>> {
  const url = `${getOfoodBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  const headers = new Headers({ Accept: "application/json" });

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }
  if (options.accessToken) {
    headers.set("Authorization", `Bearer ${options.accessToken}`);
  }
  if (options.cookieHeader) {
    headers.set("Cookie", options.cookieHeader);
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: options.method ?? "GET",
      headers,
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
      cache: "no-store",
    });
  } catch {
    return {
      ok: false,
      status: 503,
      data: null,
      error: {
        code: ErrorCode.SERVICE_UNAVAILABLE,
        message: "Unable to reach the authentication service.",
      },
      setCookies: [],
    };
  }

  const setCookies =
    typeof response.headers.getSetCookie === "function"
      ? response.headers.getSetCookie()
      : [];

  let payload: unknown = null;
  if (response.status !== 204) {
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }
    }
  }

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      data: null,
      error: parseError(payload),
      setCookies,
    };
  }

  return {
    ok: true,
    status: response.status,
    data: (payload as T) ?? null,
    error: null,
    setCookies,
  };
}
