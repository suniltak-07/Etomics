import { NextResponse } from "next/server";
import type { User } from "@/types/entities";
import type {
  ApiErrorBody,
  ApiResponse,
  PaginatedResponse,
  PaginationMeta,
} from "@/types/api";
import { UserRole } from "@/types/enums";
import {
  decodeAuthTokenUserId,
  findSessionUserId,
  findUserByEmail,
  findUserById,
  getDb,
  seedMeta,
} from "@/mocks/seed";
import { hasPermission, type Permission } from "@/lib/permissions/permissions";
import { ErrorCode, type HttpStatusCode } from "@/lib/api/errors";
import {
  collectBackendRoles,
  mapBackendRolesToUserRole,
} from "@/lib/backend/roles";

export type PublicUser = Omit<User, "password">;

export function stripPassword<T extends { password?: string }>(
  user: T,
): Omit<T, "password"> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- omit password
  const { password, ...rest } = user;
  return rest;
}

export function jsonOk<T>(
  data: T,
  init?: { status?: number; message?: string },
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(init?.message ? { message: init.message } : {}),
    },
    { status: init?.status ?? 200 },
  );
}

export function jsonPaginated<T>(
  data: T[],
  meta: PaginationMeta,
  message?: string,
): NextResponse<PaginatedResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
    meta,
    ...(message ? { message } : {}),
  });
}

export function jsonError(
  message: string,
  status: HttpStatusCode = 400,
  code?: string,
  details?: ApiErrorBody["details"],
): NextResponse<ApiErrorBody & { error: { message: string; code?: string } }> {
  const resolvedCode = code ?? mapStatusToCode(status);
  return NextResponse.json(
    {
      success: false as const,
      message,
      code: resolvedCode,
      statusCode: status,
      ...(details !== undefined ? { details } : {}),
      error: { message, code: resolvedCode },
    },
    { status },
  );
}

function mapStatusToCode(status: number): string {
  switch (status) {
    case 400:
      return ErrorCode.BAD_REQUEST;
    case 401:
      return ErrorCode.UNAUTHORIZED;
    case 403:
      return ErrorCode.FORBIDDEN;
    case 404:
      return ErrorCode.NOT_FOUND;
    case 409:
      return ErrorCode.CONFLICT;
    case 422:
      return ErrorCode.VALIDATION_ERROR;
    default:
      return status >= 500 ? ErrorCode.INTERNAL_ERROR : ErrorCode.BAD_REQUEST;
  }
}

function extractBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match?.[1]?.trim() || null;
}

/**
 * Decode mock tokens of the form base64("email:role") or base64("email:role:userId").
 * Used as a fallback when the token is not present in the sessions map.
 */
function userFromLegacyToken(token: string): User | null {
  try {
    const decoded = atob(token);
    const [email, role] = decoded.split(":");
    if (!email) return null;
    const user = findUserByEmail(email);
    if (!user) return null;
    if (role && user.role !== role) return null;
    return user;
  } catch {
    return null;
  }
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const padded = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = Buffer.from(padded, "base64").toString("utf8");
    const parsed = JSON.parse(json) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Map an OFOOD access JWT onto the in-memory mock user for dummy APIs.
 * Admin tokens use the seeded admin; customer tokens use the seeded customer
 * unless the JWT email already exists in the mock store.
 */
function userFromOfoodAccessToken(token: string): PublicUser | null {
  const payload = decodeJwtPayload(token);
  if (!payload) return null;

  const exp = payload.exp;
  if (typeof exp === "number" && exp * 1000 < Date.now()) return null;

  const rawRoles = Array.isArray(payload.roles)
    ? payload.roles.filter((item): item is string => typeof item === "string")
    : undefined;
  const role = mapBackendRolesToUserRole(
    collectBackendRoles(
      rawRoles,
      typeof payload.role === "string" ? payload.role : undefined,
    ),
  );
  if (!role) return null;

  const email = typeof payload.email === "string" ? payload.email : undefined;
  if (email) {
    const byEmail = findUserByEmail(email);
    if (byEmail?.isActive) return stripPassword(byEmail);
  }

  const seedEmail =
    role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN
      ? seedMeta.adminEmail
      : seedMeta.customerEmail;
  const seeded = findUserByEmail(seedEmail);
  if (!seeded?.isActive) return null;
  return stripPassword(seeded);
}

export function getAuthUser(request: Request): PublicUser | null {
  const token = extractBearerToken(request);
  if (!token) return null;

  const sessionUserId = findSessionUserId(token);
  if (sessionUserId) {
    const user = findUserById(sessionUserId);
    if (!user || !user.isActive) return null;
    return stripPassword(user);
  }

  // Recover after in-memory session loss (dev HMR / server restart)
  const embeddedUserId = decodeAuthTokenUserId(token);
  if (embeddedUserId) {
    const user = findUserById(embeddedUserId);
    if (!user || !user.isActive) return null;
    return stripPassword(user);
  }

  const legacy = userFromLegacyToken(token);
  if (legacy?.isActive) return stripPassword(legacy);

  return userFromOfoodAccessToken(token);
}

export function requireAuth(
  request: Request,
):
  | PublicUser
  | NextResponse<ApiErrorBody & { error: { message: string; code?: string } }> {
  const token = extractBearerToken(request);
  if (!token) {
    return jsonError(
      "Authentication required",
      401,
      ErrorCode.AUTHENTICATION_REQUIRED,
    );
  }

  const payload = decodeJwtPayload(token);
  if (payload) {
    const exp = payload.exp;
    if (typeof exp === "number" && exp * 1000 < Date.now()) {
      return jsonError(
        "Access token expired",
        401,
        ErrorCode.ACCESS_TOKEN_EXPIRED,
      );
    }
  }

  const user = getAuthUser(request);
  if (!user) {
    return jsonError(
      "Access token invalid",
      401,
      ErrorCode.ACCESS_TOKEN_INVALID,
    );
  }
  return user;
}

export function requirePermission(
  user: PublicUser | null | undefined,
  permission: Permission,
): NextResponse<
  ApiErrorBody & { error: { message: string; code?: string } }
> | null {
  if (!user) {
    return jsonError(
      "Authentication required",
      401,
      ErrorCode.AUTHENTICATION_REQUIRED,
    );
  }
  if (!hasPermission(user.role, permission)) {
    return jsonError("Forbidden", 403, ErrorCode.FORBIDDEN);
  }
  return null;
}

export function isAdminRole(role: UserRole): boolean {
  return role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN;
}

export function parsePagination(searchParams: URLSearchParams): {
  page: number;
  pageSize: number;
} {
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, Number(searchParams.get("pageSize") ?? "20") || 20),
  );
  return { page, pageSize };
}

export function buildPaginationMeta(
  total: number,
  page: number,
  pageSize: number,
): PaginationMeta {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return {
    page,
    pageSize,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

export function paginate<T>(
  items: T[],
  page: number,
  pageSize: number,
): { items: T[]; meta: PaginationMeta } {
  const total = items.length;
  const start = (page - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    meta: buildPaginationMeta(total, page, pageSize),
  };
}

export async function parseJsonBody<T = unknown>(
  request: Request,
): Promise<T | NextResponse> {
  try {
    return (await request.json()) as T;
  } catch {
    return jsonError("Invalid JSON body", 400, ErrorCode.BAD_REQUEST);
  }
}

export function isErrorResponse(value: unknown): value is NextResponse {
  return value instanceof NextResponse;
}

export function createId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function getBearerToken(request: Request): string | null {
  return extractBearerToken(request);
}

/** Count how many times a customer has used a voucher (via subscriptions). */
export function countCustomerVoucherUsage(
  customerId: string,
  voucherId: string,
): number {
  const db = getDb();
  return db.subscriptions.filter(
    (sub) => sub.customerId === customerId && sub.voucherId === voucherId,
  ).length;
}
