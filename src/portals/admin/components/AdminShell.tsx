"use client";

import { type ReactNode, Suspense } from "react";
import { AdminSidebar } from "@/portals/admin/components/AdminSidebar";
import { AdminHeader } from "@/portals/admin/components/AdminHeader";
import { LoadingState } from "@/components/states/LoadingState";
import { ProtectedRoute } from "@/features/auth/components/ProtectedRoute";
import { UserRole } from "@/types/enums";

const ADMIN_ROLES: UserRole[] = [UserRole.ADMIN, UserRole.SUPER_ADMIN];

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<LoadingState title="Loading" />}>
      <ProtectedRoute
        allowedRoles={ADMIN_ROLES}
        fallback={
          <LoadingState
            title="Checking your session"
            description="Restoring your admin workspace…"
          />
        }
      >
        <div className="bg-brand-sand text-brand-ink flex min-h-screen">
          <Suspense fallback={null}>
            <AdminSidebar />
          </Suspense>
          <div className="flex min-w-0 flex-1 flex-col">
            <AdminHeader />
            <main className="flex-1 px-4 py-5 lg:px-6">{children}</main>
          </div>
        </div>
      </ProtectedRoute>
    </Suspense>
  );
}
