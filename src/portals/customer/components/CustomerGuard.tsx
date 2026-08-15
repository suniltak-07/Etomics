"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LoadingState } from "@/components/states";
import { UserRole } from "@/types/enums";
import { useAppSelector } from "@/store/hooks";

export function CustomerGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, hydrated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!hydrated) return;

    if (!user) {
      const search = searchParams.toString();
      const fullPath = search ? `${pathname}?${search}` : pathname;
      const returnUrl = encodeURIComponent(fullPath || "/customer/dashboard");
      router.replace(`/login?returnUrl=${returnUrl}`);
      return;
    }

    if (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) {
      router.replace("/admin/dashboard");
    }
  }, [hydrated, user, router, pathname, searchParams]);

  if (!hydrated) {
    return <LoadingState title="Loading your account" />;
  }

  if (!user || user.role !== UserRole.CUSTOMER) {
    return (
      <LoadingState
        title="Redirecting"
        description="Taking you to the right place…"
      />
    );
  }

  return children;
}
