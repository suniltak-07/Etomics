"use client";

import { useEffect, type ReactNode, Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AdminSidebar } from "@/portals/admin/components/AdminSidebar";
import { AdminHeader } from "@/portals/admin/components/AdminHeader";
import { LoadingState } from "@/components/states/LoadingState";
import { UserRole } from "@/types/enums";
import { useAppSelector } from "@/store/hooks";
import { isLogoutRedirect } from "@/lib/auth/logout-redirect";
import { getClientToken } from "@/lib/auth/session";
import { splashHref } from "@/lib/auth/splash";

const ADMIN_ROLES: string[] = [UserRole.ADMIN, UserRole.SUPER_ADMIN];

function AuthGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, sessionVerified } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (sessionVerified && user) {
      if (ADMIN_ROLES.includes(user.role)) return;
      router.replace("/customer/dashboard");
      return;
    }

    if (isLogoutRedirect()) {
      router.replace("/login");
      return;
    }

    if (getClientToken()) {
      const search = searchParams.toString();
      const fullPath = search ? `${pathname}?${search}` : pathname;
      router.replace(splashHref(fullPath || "/admin/dashboard"));
      return;
    }

    router.replace("/login");
  }, [sessionVerified, user, router, pathname, searchParams]);

  if (!sessionVerified || !user || !ADMIN_ROLES.includes(user.role)) {
    return <LoadingState title="Redirecting to your workspace" />;
  }

  return <>{children}</>;
}

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<LoadingState title="Loading" />}>
      <AuthGate>
        <div className="bg-brand-sand text-brand-ink flex min-h-screen">
          <Suspense fallback={null}>
            <AdminSidebar />
          </Suspense>
          <div className="flex min-w-0 flex-1 flex-col">
            <AdminHeader />
            <main className="flex-1 px-4 py-5 lg:px-6">{children}</main>
          </div>
        </div>
      </AuthGate>
    </Suspense>
  );
}
