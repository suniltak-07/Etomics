"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LoadingState } from "@/components/states";
import { UserRole } from "@/types/enums";
import { useAppSelector } from "@/store/hooks";
import { isLogoutRedirect } from "@/lib/auth/logout-redirect";
import { getClientToken } from "@/lib/auth/session";
import { splashHref } from "@/lib/auth/splash";

export function CustomerGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, sessionVerified } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (sessionVerified && user) {
      if (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) {
        router.replace("/admin/dashboard");
      }
      return;
    }

    if (isLogoutRedirect()) {
      router.replace("/login");
      return;
    }

    if (getClientToken()) {
      const search = searchParams.toString();
      const fullPath = search ? `${pathname}?${search}` : pathname;
      router.replace(splashHref(fullPath));
      return;
    }

    router.replace("/login");
  }, [sessionVerified, user, router, pathname, searchParams]);

  if (!sessionVerified || !user || user.role !== UserRole.CUSTOMER) {
    return (
      <LoadingState
        title="Redirecting"
        description="Taking you to the right place…"
      />
    );
  }

  return children;
}
