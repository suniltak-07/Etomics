"use client";

import type { ReactNode } from "react";
import { ProtectedRoute } from "@/features/auth/components/ProtectedRoute";
import { LoadingState } from "@/components/states";
import { UserRole } from "@/types/enums";

const CUSTOMER_ROLES: UserRole[] = [UserRole.CUSTOMER];

export function CustomerGuard({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute
      allowedRoles={CUSTOMER_ROLES}
      fallback={
        <LoadingState
          title="Checking your session"
          description="Restoring your account…"
        />
      }
    >
      {children}
    </ProtectedRoute>
  );
}
