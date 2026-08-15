"use client";

import { useEffect } from "react";
import { AUTH_TOKEN_KEY } from "@/lib/api/client";
import { getClientSession } from "@/lib/auth/session";
import { useAppDispatch } from "@/store/hooks";
import { hydrate } from "@/store/slices/authSlice";

/**
 * Hydrates Redux auth state from cookies (and mirrors token into localStorage
 * for the API client). Call once near the app or portal root.
 */
export function useAuthHydration() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const session = getClientSession();
    dispatch(hydrate(session));

    if (session.token) {
      try {
        window.localStorage.setItem(AUTH_TOKEN_KEY, session.token);
      } catch {
        // ignore storage failures
      }
    } else {
      try {
        window.localStorage.removeItem(AUTH_TOKEN_KEY);
      } catch {
        // ignore
      }
    }
  }, [dispatch]);
}
