"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { useCustomerDashboard } from "@/features/dashboard/hooks/useCustomerDashboard";
import {
  customerNavItems,
  customerPrimaryNav,
  type CustomerNavItem,
} from "@/portals/customer/navigation/navItems";

export interface CustomerNavProps {
  orientation?: "horizontal" | "vertical";
  variant?: "primary" | "all";
  onNavigate?: () => void;
  className?: string;
}

function isActive(pathname: string, href: string) {
  return (
    pathname === href ||
    (href !== "/customer/dashboard" && pathname.startsWith(href))
  );
}

function NavLink({
  item,
  active,
  orientation,
  onNavigate,
}: {
  item: CustomerNavItem;
  active: boolean;
  orientation: "horizontal" | "vertical";
  onNavigate?: () => void;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "group inline-flex items-center gap-2 rounded-full text-sm font-medium transition-all duration-200",
        orientation === "horizontal"
          ? "px-3.5 py-2"
          : "w-full rounded-2xl px-4 py-3",
        active
          ? "bg-brand-navy text-white shadow-[0_10px_24px_-16px_rgba(11,31,58,0.85)]"
          : "text-brand-muted hover:bg-brand-green-muted/60 hover:text-brand-navy",
      )}
    >
      <Icon
        className={cn(
          "size-4 shrink-0 transition-transform duration-200",
          !active && "group-hover:scale-105",
        )}
        aria-hidden
      />
      <span>{item.label}</span>
    </Link>
  );
}

export function CustomerNav({
  orientation = "horizontal",
  variant = "primary",
  onNavigate,
  className,
}: CustomerNavProps) {
  const pathname = usePathname();
  const dashboard = useCustomerDashboard();
  const hasSubscription = Boolean(dashboard.data?.data.activeSubscription);
  const source = variant === "primary" ? customerPrimaryNav : customerNavItems;
  const items = source.filter(
    (item) => !item.requiresSubscription || hasSubscription,
  );

  return (
    <nav
      aria-label="Customer"
      className={cn(
        orientation === "horizontal"
          ? "bg-brand-navy/[0.04] hidden items-center gap-0.5 rounded-full p-1 lg:flex"
          : "flex flex-col gap-1",
        className,
      )}
    >
      {items.map((item) => (
        <NavLink
          key={item.href}
          item={item}
          active={isActive(pathname, item.href)}
          orientation={orientation}
          onNavigate={onNavigate}
        />
      ))}
    </nav>
  );
}
