"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, Leaf, LogOut, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOutAndGoToLogin } from "@/features/auth/signOut";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { CustomerNav } from "@/portals/customer/components/CustomerNav";
import { customerSecondaryNav } from "@/portals/customer/navigation/navItems";
import { cn } from "@/lib/utils/cn";

export function CustomerHeader() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!accountRef.current?.contains(event.target as Node)) {
        setAccountOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await signOutAndGoToLogin(dispatch, (href) => router.replace(href));
    } finally {
      setLoggingOut(false);
    }
  }

  const initials = user
    ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() ||
      "EO"
    : "EO";

  return (
    <header className="border-brand-border/40 bg-brand-sand/80 sticky top-0 z-40 border-b backdrop-blur-xl">
      <div className="mx-auto flex h-[4.25rem] max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-5">
          <Link
            href="/customer/dashboard"
            className="text-brand-navy flex items-center gap-2.5 transition-opacity hover:opacity-90"
          >
            <span className="bg-brand-navy text-brand-green-muted flex size-9 items-center justify-center rounded-xl">
              <Leaf className="size-4" aria-hidden />
            </span>
            <span className="font-display text-[1.25rem] font-semibold tracking-tight">
              Eat<span className="text-brand-green">Omics</span>
            </span>
          </Link>
          <CustomerNav variant="primary" />
        </div>

        <div className="flex items-center gap-2">
          <div className="relative hidden sm:block" ref={accountRef}>
            <button
              type="button"
              className={cn(
                "border-brand-border/70 bg-brand-surface hover:border-brand-green/30 inline-flex items-center gap-2 rounded-full border px-2 py-1.5 pr-3 shadow-sm transition-all hover:shadow-md",
                accountOpen &&
                  "border-brand-green/40 ring-brand-green-muted ring-2",
              )}
              aria-expanded={accountOpen}
              aria-haspopup="menu"
              onClick={() => setAccountOpen((open) => !open)}
            >
              <span className="from-brand-navy to-brand-navy-soft flex size-8 items-center justify-center rounded-full bg-gradient-to-br text-xs font-semibold text-white">
                {initials}
              </span>
              <span className="text-brand-ink max-w-[8rem] truncate text-sm font-medium">
                {user?.firstName}
              </span>
              <ChevronDown
                className={cn(
                  "text-brand-muted size-4 transition-transform",
                  accountOpen && "rotate-180",
                )}
              />
            </button>

            {accountOpen ? (
              <div
                role="menu"
                className="border-brand-border/70 bg-brand-surface animate-fade-in absolute right-0 mt-2 w-60 overflow-hidden rounded-2xl border p-1.5 shadow-[0_24px_60px_-28px_rgba(11,31,58,0.55)]"
              >
                <div className="border-brand-border/60 border-b px-3 py-2.5">
                  <p className="text-brand-ink text-sm font-semibold">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-brand-muted truncate text-xs">
                    {user?.email}
                  </p>
                </div>
                {customerSecondaryNav.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      role="menuitem"
                      className="text-brand-ink hover:bg-brand-sand flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-colors"
                      onClick={() => setAccountOpen(false)}
                    >
                      <Icon className="text-brand-green size-4" aria-hidden />
                      {item.label}
                    </Link>
                  );
                })}
                <button
                  type="button"
                  role="menuitem"
                  className="text-brand-danger mt-1 flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-red-50"
                  onClick={handleLogout}
                  disabled={loggingOut}
                >
                  <LogOut className="size-4" />
                  {loggingOut ? "Signing out…" : "Log out"}
                </button>
              </div>
            ) : null}
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="rounded-full px-2 lg:hidden"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? (
              <X className="size-5" />
            ) : (
              <Menu className="size-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile sheet */}
      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden",
          mobileOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
      >
        <button
          type="button"
          aria-label="Close menu overlay"
          className={cn(
            "bg-brand-navy/45 absolute inset-0 backdrop-blur-sm transition-opacity",
            mobileOpen ? "opacity-100" : "opacity-0",
          )}
          onClick={() => setMobileOpen(false)}
        />
        <div
          className={cn(
            "border-brand-border/60 bg-brand-sand absolute inset-x-3 top-3 max-h-[calc(100svh-1.5rem)] overflow-y-auto rounded-3xl border shadow-[0_30px_80px_-30px_rgba(11,31,58,0.55)] transition-all duration-300",
            mobileOpen
              ? "translate-y-0 opacity-100"
              : "-translate-y-3 opacity-0",
          )}
        >
          <div className="border-brand-border/50 flex items-center justify-between border-b px-4 py-3">
            <div>
              <p className="font-display text-brand-navy text-lg font-semibold">
                Eat<span className="text-brand-green">Omics</span>
              </p>
              <p className="text-brand-muted text-xs">
                {user?.firstName} · {user?.email}
              </p>
            </div>
            <button
              type="button"
              className="hover:bg-brand-green-muted/50 inline-flex size-9 items-center justify-center rounded-full"
              aria-label="Close menu"
              onClick={() => setMobileOpen(false)}
            >
              <X className="size-5" />
            </button>
          </div>
          <div className="p-3">
            <CustomerNav
              orientation="vertical"
              variant="all"
              onNavigate={() => setMobileOpen(false)}
            />
            <Button
              variant="outline"
              className="mt-3 w-full rounded-2xl"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              <LogOut className="size-4" />
              Log out
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
