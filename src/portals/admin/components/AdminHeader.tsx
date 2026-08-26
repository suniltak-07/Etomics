"use client";

import { useRouter } from "next/navigation";
import { LogOut, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signOutAndGoToLogin } from "@/features/auth/signOut";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

export function AdminHeader() {
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  const router = useRouter();

  const handleLogout = async () => {
    await signOutAndGoToLogin(dispatch, (href) => router.replace(href));
  };

  const displayName = user
    ? `${user.firstName} ${user.lastName}`.trim() || user.email
    : "Admin";

  return (
    <header className="border-brand-border bg-brand-surface/95 sticky top-0 z-30 flex h-14 items-center gap-3 border-b px-4 backdrop-blur lg:px-6">
      <div className="hidden min-w-0 flex-1 items-center gap-2 md:flex">
        {false && (
          <div className="relative w-full max-w-sm">
            <Search
              className="text-brand-muted pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
              aria-hidden
            />
            <Input
              placeholder="Search customers, plans, vouchers…"
              className="h-9 pl-9"
              aria-label="Global search"
              disabled
            />
          </div>
        )}
      </div>
      <div className="ml-auto flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-brand-ink text-sm font-medium">{displayName}</p>
          <p className="text-brand-muted text-[11px]">{user?.role}</p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => void handleLogout()}
        >
          <LogOut className="size-3.5" />
          Logout
        </Button>
      </div>
    </header>
  );
}
