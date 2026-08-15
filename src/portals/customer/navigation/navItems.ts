import {
  Bell,
  CreditCard,
  Home,
  MapPin,
  Package,
  Settings,
  ShoppingBag,
  UserRound,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

export interface CustomerNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  requiresSubscription?: boolean;
}

/** Primary items shown in the top bar */
export const customerPrimaryNav: CustomerNavItem[] = [
  { href: "/customer/dashboard", label: "Home", icon: Home },
  { href: "/customer/plans", label: "Plans", icon: UtensilsCrossed },
  {
    href: "/customer/menu",
    label: "Today’s menu",
    icon: UtensilsCrossed,
    requiresSubscription: true,
  },
  {
    href: "/customer/subscriptions",
    label: "Subscriptions",
    icon: ShoppingBag,
  },
  { href: "/customer/orders", label: "Orders", icon: Package },
];

/** Secondary items in the account menu / mobile sheet */
export const customerSecondaryNav: CustomerNavItem[] = [
  { href: "/customer/addresses", label: "Addresses", icon: MapPin },
  { href: "/customer/payments", label: "Payments", icon: CreditCard },
  { href: "/customer/notifications", label: "Notifications", icon: Bell },
  { href: "/customer/profile", label: "Profile", icon: UserRound },
  { href: "/customer/settings", label: "Settings", icon: Settings },
];

export const customerNavItems: CustomerNavItem[] = [
  ...customerPrimaryNav,
  ...customerSecondaryNav,
];
