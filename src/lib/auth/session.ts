import type { User } from "@/types/entities";
import type { UserRole } from "@/types/enums";

/** Auth user persisted in cookies — never includes password. */
export type SessionUser = Omit<User, "password">;

export const AUTH_TOKEN_COOKIE = "etomics_token";
export const AUTH_USER_COOKIE = "etomics_user";

const DEFAULT_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export interface CookieWriteOptions {
  maxAge?: number;
  path?: string;
  secure?: boolean;
  sameSite?: "lax" | "strict" | "none";
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function encodeCookieValue(value: string): string {
  return encodeURIComponent(value);
}

function decodeCookieValue(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function readDocumentCookie(name: string): string | null {
  if (!isBrowser()) return null;

  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));

  if (!match) return null;
  return decodeCookieValue(match.slice(name.length + 1));
}

function writeDocumentCookie(
  name: string,
  value: string,
  options: CookieWriteOptions = {},
): void {
  if (!isBrowser()) return;

  const maxAge = options.maxAge ?? DEFAULT_MAX_AGE_SECONDS;
  const path = options.path ?? "/";
  const sameSite = options.sameSite ?? "lax";
  const secure =
    options.secure ??
    (typeof window !== "undefined" && window.location.protocol === "https:");

  let cookie = `${name}=${encodeCookieValue(value)}; Path=${path}; Max-Age=${maxAge}; SameSite=${sameSite}`;
  if (secure) cookie += "; Secure";
  document.cookie = cookie;
}

function deleteDocumentCookie(name: string, path = "/"): void {
  if (!isBrowser()) return;
  document.cookie = `${name}=; Path=${path}; Max-Age=0; SameSite=Lax`;
}

function parseSessionUser(raw: string | null | undefined): SessionUser | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SessionUser;
    if (
      !parsed ||
      typeof parsed !== "object" ||
      typeof parsed.id !== "string" ||
      typeof parsed.email !== "string" ||
      typeof parsed.role !== "string"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/* Client helpers                                                             */
/* -------------------------------------------------------------------------- */

export function getClientToken(): string | null {
  return readDocumentCookie(AUTH_TOKEN_COOKIE);
}

export function getClientUser(): SessionUser | null {
  return parseSessionUser(readDocumentCookie(AUTH_USER_COOKIE));
}

export function setClientSession(
  token: string,
  user: SessionUser,
  options?: CookieWriteOptions,
): void {
  writeDocumentCookie(AUTH_TOKEN_COOKIE, token, options);
  writeDocumentCookie(AUTH_USER_COOKIE, JSON.stringify(user), options);
}

export function setClientToken(
  token: string,
  options?: CookieWriteOptions,
): void {
  writeDocumentCookie(AUTH_TOKEN_COOKIE, token, options);
}

export function setClientUser(
  user: SessionUser,
  options?: CookieWriteOptions,
): void {
  writeDocumentCookie(AUTH_USER_COOKIE, JSON.stringify(user), options);
}

export function clearClientSession(): void {
  deleteDocumentCookie(AUTH_TOKEN_COOKIE);
  deleteDocumentCookie(AUTH_USER_COOKIE);
}

export function getClientSession(): {
  token: string | null;
  user: SessionUser | null;
} {
  return {
    token: getClientToken(),
    user: getClientUser(),
  };
}

/* -------------------------------------------------------------------------- */
/* Server helpers (Next.js 16 — await cookies())                              */
/* -------------------------------------------------------------------------- */

export async function getServerToken(): Promise<string | null> {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_TOKEN_COOKIE)?.value ?? null;
}

export async function getServerUser(): Promise<SessionUser | null> {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  return parseSessionUser(cookieStore.get(AUTH_USER_COOKIE)?.value);
}

export async function getServerSession(): Promise<{
  token: string | null;
  user: SessionUser | null;
}> {
  const [token, user] = await Promise.all([getServerToken(), getServerUser()]);
  return { token, user };
}

export async function setServerSession(
  token: string,
  user: SessionUser,
  options: CookieWriteOptions = {},
): Promise<void> {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const maxAge = options.maxAge ?? DEFAULT_MAX_AGE_SECONDS;
  const path = options.path ?? "/";
  const sameSite = options.sameSite ?? "lax";
  const secure = options.secure ?? process.env.NODE_ENV === "production";

  cookieStore.set(AUTH_TOKEN_COOKIE, token, {
    path,
    maxAge,
    sameSite,
    secure,
    httpOnly: false,
  });
  cookieStore.set(AUTH_USER_COOKIE, JSON.stringify(user), {
    path,
    maxAge,
    sameSite,
    secure,
    httpOnly: false,
  });
}

export async function clearServerSession(): Promise<void> {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_TOKEN_COOKIE);
  cookieStore.delete(AUTH_USER_COOKIE);
}

export function hasRole(
  user: SessionUser | null | undefined,
  roles: readonly UserRole[],
): boolean {
  if (!user) return false;
  return roles.includes(user.role);
}
