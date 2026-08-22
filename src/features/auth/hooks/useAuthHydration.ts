"use client";

import { useEffect } from "react";
import { AUTH_TOKEN_KEY } from "@/lib/api/client";
import { persistAuthSession } from "@/features/auth/persistSession";
import { authService } from "@/features/auth/services/authService";
import { ApiError } from "@/lib/api/errors";
import { clearClientSession, getClientSession } from "@/lib/auth/session";
import { useAppDispatch } from "@/store/hooks";
import { hydrate } from "@/store/slices/authSlice";

/**
 * Hydrates Redux auth from cookies, then validates (and refreshes) against
 * the backend /me endpoint so expired access tokens can rotate.
 */
export function useAuthHydration() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const cached = getClientSession();
      if (cached.user || cached.token) {
        dispatch(hydrate(cached));
      }

      try {
        const response = await authService.me();
        if (cancelled) return;
        const { user, token, expiresIn } = response.data;
        if (!token) throw new Error("Missing access token");
        persistAuthSession(user, token, expiresIn);
        dispatch(hydrate({ user, token }));
      } catch (error) {
        if (cancelled) return;
        const unauthorized =
          error instanceof ApiError &&
          (error.statusCode === 401 || error.statusCode === 403);
        if (!unauthorized && cached.user && cached.token) {
          dispatch(hydrate(cached));
          return;
        }
        clearClientSession();
        try {
          window.localStorage.removeItem(AUTH_TOKEN_KEY);
        } catch {
          // ignore
        }
        dispatch(hydrate({ user: null, token: null }));
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [dispatch]);
}
