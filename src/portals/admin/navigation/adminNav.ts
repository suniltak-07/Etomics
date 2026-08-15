import type { LucideIcon } from "lucide-react";
import {
  Bike,
  ChefHat,
  ClipboardList,
  CreditCard,
  FileBarChart2,
  LayoutDashboard,
  MapPinned,
  Percent,
  Settings,
  ShoppingBag,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { Permission } from "@/lib/permissions/permissions";

export interface AdminNavChild {
  id: string;
  label: string;
  href: string;
  /** Extra query match — when set, item is active only if search includes this */
  matchQuery?: Record<string, string>;
}

export interface AdminNavItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  permission?: Permission;
  children?: AdminNavChild[];
}

export const adminNavItems: AdminNavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
    permission: Permission.REPORTS_READ,
  },
  {
    id: "customers",
    label: "Customers",
    href: "/admin/customers",
    icon: Users,
    permission: Permission.CUSTOMERS_READ,
  },
  {
    id: "subscriptions",
    label: "Subscriptions",
    href: "/admin/subscriptions",
    icon: ShoppingBag,
    permission: Permission.SUBSCRIPTIONS_READ,
    children: [
      { id: "subs-all", label: "All", href: "/admin/subscriptions" },
      {
        id: "subs-active",
        label: "Active",
        href: "/admin/subscriptions?status=ACTIVE",
        matchQuery: { status: "ACTIVE" },
      },
      {
        id: "subs-expiring",
        label: "Expiring",
        href: "/admin/subscriptions?filter=expiring",
        matchQuery: { filter: "expiring" },
      },
    ],
  },
  {
    id: "plans",
    label: "Plans",
    href: "/admin/plans",
    icon: UtensilsCrossed,
    permission: Permission.PLANS_READ,
    children: [
      { id: "plans-all", label: "All", href: "/admin/plans" },
      {
        id: "plans-add",
        label: "Add",
        href: "/admin/plans/new",
      },
    ],
  },
  {
    id: "menu",
    label: "Daily menu",
    href: "/admin/menu",
    icon: ChefHat,
    permission: Permission.MENUS_UPDATE,
  },
  {
    id: "kitchen",
    label: "Kitchen",
    href: "/admin/kitchen",
    icon: ClipboardList,
    permission: Permission.KITCHEN_READ,
  },
  {
    id: "vouchers",
    label: "Vouchers",
    href: "/admin/vouchers",
    icon: Percent,
    permission: Permission.VOUCHERS_READ,
    children: [
      { id: "vouchers-all", label: "All", href: "/admin/vouchers" },
      {
        id: "vouchers-add",
        label: "Add",
        href: "/admin/vouchers/new",
      },
    ],
  },
  {
    id: "coverage",
    label: "Coverage",
    href: "/admin/cities",
    icon: MapPinned,
    permission: Permission.CITIES_READ,
    children: [
      { id: "cities", label: "Cities", href: "/admin/cities" },
      { id: "pincodes", label: "Pincodes", href: "/admin/pincodes" },
    ],
  },
  {
    id: "delivery-persons",
    label: "Delivery team",
    href: "/admin/delivery-persons",
    icon: Bike,
    permission: Permission.DELIVERY_PERSONS_READ,
  },
  {
    id: "payments",
    label: "Payments",
    href: "/admin/payments",
    icon: CreditCard,
    permission: Permission.PAYMENTS_READ,
  },
  {
    id: "reports",
    label: "Reports",
    href: "/admin/reports",
    icon: FileBarChart2,
    permission: Permission.REPORTS_READ,
  },
  {
    id: "settings",
    label: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
];
