import { jsonError } from "@/lib/api/route-helpers";
import { ErrorCode } from "@/lib/api/errors";
import { applyUpstreamCookies, ofoodErrorResponse } from "@/lib/backend/proxy";
import type { OfoodApiError } from "@/lib/backend/types";
import type { MediaUpload } from "@/features/media/types";
import type { NextResponse } from "next/server";

export type { MediaUpload };

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function unwrapPayload(payload: unknown): unknown {
  if (!isRecord(payload)) return payload;
  if (typeof payload.url === "string") return payload;
  if ("data" in payload) return unwrapPayload(payload.data);
  return payload;
}

export function mapOfoodMediaUpload(payload: unknown): MediaUpload | null {
  const raw = unwrapPayload(payload);
  if (!isRecord(raw)) return null;
  const url = typeof raw.url === "string" ? raw.url.trim() : "";
  const key = typeof raw.key === "string" ? raw.key.trim() : "";
  if (!url) return null;
  return { url, key };
}

export function mediaFailedUpstream(
  status: number,
  error: OfoodApiError | null,
  cookies: string[],
  fallback: string,
): NextResponse {
  return applyUpstreamCookies(
    ofoodErrorResponse(status, error, fallback),
    cookies,
  );
}

export function mediaUnreadable(
  cookies: string[],
  fallback: string,
): NextResponse {
  return mediaFailedUpstream(
    502,
    { code: ErrorCode.BAD_GATEWAY, message: fallback },
    cookies,
    fallback,
  );
}

export function missingAccessToken() {
  return jsonError("Unauthorized", 401, ErrorCode.UNAUTHORIZED);
}
