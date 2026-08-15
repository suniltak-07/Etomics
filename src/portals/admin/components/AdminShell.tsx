"use client";

import { useEffect, type ReactNode, Suspense } from "react";
import { useRouter } from "next/navigation";
import { AdminSidebar } from "@/portals/admin/components/AdminSidebar";
import { AdminHeader } from "@/portals/admin/components/AdminHeader";
import { LoadingState } from "@/components/states/LoadingState";
import { useAuthHydration } from "@/features/auth/hooks/useAuthHydration";
import { UserRole } from "@/types/enums";
import { useAppSelector } from "@/store/hooks";

const ADMIN_ROLES: string[] = [UserRole.ADMIN, UserRole.SUPER_ADMIN];

function AuthGate({ children }: { children: ReactNode }) {
  useAuthHydration();
  const router = useRouter();
  const { user, hydrated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!hydrated) return;

    if (!user || !ADMIN_ROLES.includes(user.role)) {
      router.replace("/login?redirect=/admin/dashboard");
    }
  }, [hydrated, user, router]);

  if (!hydrated) {
    return <LoadingState title="Checking session" />;
  }

  if (!user || !ADMIN_ROLES.includes(user.role)) {
    return <LoadingState title="Redirecting to login" />;
  }

  return <>{children}</>;
}

export function AdminShell({ children }: { children: ReactNode }) {
  return (
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
  );
}
