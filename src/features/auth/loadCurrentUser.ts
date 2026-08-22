import { persistAuthSession } from "@/features/auth/persistSession";
import {
  authService,
  type AuthSession,
} from "@/features/auth/services/authService";
import type { ApiResponse } from "@/types/api";

let inflight: Promise<AuthSession> | null = null;

/** Shares one in-flight /me request (avoids Strict Mode double-fetch). */
export function fetchCurrentUser(): Promise<AuthSession> {
  if (!inflight) {
    inflight = authService
      .me()
      .then((response: ApiResponse<AuthSession>) => {
        const session = response.data;
        if (!session?.user || !session.token) {
          throw new Error("Missing user session");
        }
        persistAuthSession(session.user, session.token, session.expiresIn);
        return session;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}
