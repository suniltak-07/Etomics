import { AUTH_TOKEN_KEY } from "@/lib/api/client";
import { setClientSession, type SessionUser } from "@/lib/auth/session";

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
    window.localStorage.setItem(AUTH_TOKEN_KEY, token);
  } catch {
    // ignore storage failures
  }
}
