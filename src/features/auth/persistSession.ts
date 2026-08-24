import {
  AUTH_TOKEN_COOKIE,
  clearClientSession,
  setClientSession,
  type SessionUser,
} from "@/lib/auth/session";

const DEFAULT_ACCESS_MAX_AGE = 60 * 10;

export function persistAuthSession(
  user: SessionUser,
  token: string,
  expiresIn?: number,
): void {
  setClientSession(token, user, {
    maxAge: expiresIn && expiresIn > 0 ? expiresIn : DEFAULT_ACCESS_MAX_AGE,
  });
  try {
    window.localStorage.setItem(AUTH_TOKEN_COOKIE, token);
  } catch {
    // ignore storage failures
  }
}

export function clearPersistedAuth(): void {
  clearClientSession();
  try {
    window.localStorage.removeItem(AUTH_TOKEN_COOKIE);
  } catch {
    // ignore storage failures
  }
}
