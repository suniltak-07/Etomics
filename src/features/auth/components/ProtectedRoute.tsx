"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LoadingState } from "@/components/states";
import { fetchCurrentUser } from "@/features/auth/loadCurrentUser";
import { clearPersistedAuth } from "@/features/auth/persistSession";
import { isLogoutRedirect } from "@/lib/auth/logout-redirect";
import { portalHomeForRole } from "@/lib/backend/roles";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logout, setCredentials } from "@/store/slices/authSlice";
import type { UserRole } from "@/types/enums";

export interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles: readonly UserRole[];
  fallback?: ReactNode;
}

export function ProtectedRoute({
  children,
  allowedRoles,
  fallback = (
    <LoadingState
      title="Checking your session"
      description="Restoring your account…"
    />
  ),
}: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const { user, sessionVerified } = useAppSelector((state) => state.auth);
  const [ready, setReady] = useState(false);
  const allowedKey = allowedRoles.join(",");

  useEffect(() => {
    let cancelled = false;

    async function restore() {
      if (isLogoutRedirect()) {
        router.replace("/login");
        return;
      }

      if (sessionVerified && user) {
        if (!allowedRoles.includes(user.role)) {
          router.replace(portalHomeForRole(user.role));
          return;
        }
        setReady(true);
        return;
      }

      try {
        const session = await fetchCurrentUser();
        if (cancelled) return;
        dispatch(setCredentials({ user: session.user, token: session.token }));
        if (!allowedRoles.includes(session.user.role)) {
          router.replace(portalHomeForRole(session.user.role));
          return;
        }
        setReady(true);
      } catch {
        if (cancelled) return;
        clearPersistedAuth();
        dispatch(logout());
        const search = searchParams.toString();
        const next = search ? `${pathname}?${search}` : pathname;
        router.replace(`/login?returnUrl=${encodeURIComponent(next)}`);
      }
    }

    void restore();
    return () => {
      cancelled = true;
    };
  }, [
    allowedKey,
    allowedRoles,
    dispatch,
    pathname,
    router,
    searchParams,
    sessionVerified,
    user,
  ]);

  if (
    !ready ||
    !user ||
    !sessionVerified ||
    !allowedRoles.includes(user.role)
  ) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
