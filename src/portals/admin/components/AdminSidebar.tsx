"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { hasPermission } from "@/lib/permissions/permissions";
import { useAppSelector } from "@/store/hooks";
import {
  adminNavItems,
  type AdminNavChild,
  type AdminNavItem,
} from "@/portals/admin/navigation/adminNav";

function childIsActive(
  child: AdminNavChild,
  pathname: string,
  searchParams: URLSearchParams,
): boolean {
  const [path, query = ""] = child.href.split("?");
  if (pathname !== path && !pathname.startsWith(`${path}/`)) {
    if (pathname !== path) return false;
  }
  if (pathname !== path) return false;

  if (child.matchQuery) {
    return Object.entries(child.matchQuery).every(
      ([key, value]) => searchParams.get(key) === value,
    );
  }

  if (!query) {
    return (
      !searchParams.get("status") &&
      !searchParams.get("filter") &&
      pathname === path
    );
  }

  const expected = new URLSearchParams(query);
  for (const [key, value] of expected.entries()) {
    if (searchParams.get(key) !== value) return false;
  }
  return true;
}

function itemIsActive(item: AdminNavItem, pathname: string): boolean {
  if (item.href === "/admin/dashboard") {
    return pathname === item.href || pathname === "/admin";
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function AdminSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const user = useAppSelector((state) => state.auth.user);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const items = useMemo(() => {
    if (!user) return [];
    return adminNavItems.filter((item) => {
      if (!item.permission) return true;
      return hasPermission(user.role, item.permission);
    });
  }, [user]);

  const nav = (
    <nav className="flex flex-1 flex-col gap-0.5 px-2 py-3" aria-label="Admin">
      {items.map((item) => {
        const Icon = item.icon;
        const active = itemIsActive(item, pathname);
        const isExpanded =
          expanded[item.id] ??
          (active || Boolean(item.children?.length && active));
        const hasChildren = Boolean(item.children?.length);

        return (
          <div key={item.id}>
            <div className="flex items-center gap-0.5">
              <Link
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex flex-1 items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-brand-navy text-white"
                    : "text-brand-ink/80 hover:bg-brand-green-muted/70 hover:text-brand-navy",
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden />
                <span>{item.label}</span>
              </Link>
              {hasChildren ? (
                <button
                  type="button"
                  aria-label={`Toggle ${item.label}`}
                  className={cn(
                    "text-brand-muted hover:bg-brand-sand hover:text-brand-ink rounded-md p-1.5",
                    active &&
                      "hover:bg-brand-navy-soft text-white/80 hover:text-white",
                  )}
                  onClick={() =>
                    setExpanded((prev) => ({
                      ...prev,
                      [item.id]: !isExpanded,
                    }))
                  }
                >
                  <ChevronDown
                    className={cn(
                      "size-4 transition-transform",
                      isExpanded && "rotate-180",
                    )}
                  />
                </button>
              ) : null}
            </div>
            {hasChildren && isExpanded ? (
              <div className="border-brand-border mt-0.5 mb-1 ml-4 space-y-0.5 border-l pl-2">
                {item.children!.map((child) => {
                  const childActive = childIsActive(
                    child,
                    pathname,
                    searchParams,
                  );
                  return (
                    <Link
                      key={child.id}
                      href={child.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "block rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                        childActive
                          ? "bg-brand-green-muted text-brand-green"
                          : "text-brand-muted hover:bg-brand-sand hover:text-brand-ink",
                      )}
                    >
                      {child.label}
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </div>
        );
      })}
    </nav>
  );

  return (
    <>
      <button
        type="button"
        className="border-brand-border bg-brand-surface text-brand-ink fixed top-3 left-3 z-40 rounded-md border p-2 shadow-sm lg:hidden"
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation"
      >
        <Menu className="size-5" />
      </button>

      {mobileOpen ? (
        <button
          type="button"
          className="bg-brand-navy/40 fixed inset-0 z-40 lg:hidden"
          aria-label="Close navigation overlay"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          "border-brand-border bg-brand-surface fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r transition-transform lg:static lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="border-brand-border flex h-14 items-center justify-between border-b px-4">
          <Link
            href="/admin/dashboard"
            className="font-display text-brand-navy text-base font-semibold tracking-tight"
            onClick={() => setMobileOpen(false)}
          >
            EatOmics <span className="text-brand-green">Admin</span>
          </Link>
          <button
            type="button"
            className="text-brand-muted hover:bg-brand-sand rounded-md p-1 lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
          >
            <X className="size-5" />
          </button>
        </div>
        {nav}
        <div className="border-brand-border text-brand-muted border-t px-4 py-3 text-[11px]">
          Dense ops console · v0.1
        </div>
      </aside>
    </>
  );
}
