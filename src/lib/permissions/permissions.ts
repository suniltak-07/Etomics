import type { UserRole } from "@/types/enums";
import { UserRole as Roles } from "@/types/enums";

export const Permission = {
  PLANS_READ: "plans.read",
  PLANS_CREATE: "plans.create",
  PLANS_UPDATE: "plans.update",
  PLANS_DELETE: "plans.delete",

  CUSTOMERS_READ: "customers.read",
  CUSTOMERS_UPDATE: "customers.update",
  CUSTOMERS_DELETE: "customers.delete",

  SUBSCRIPTIONS_READ: "subscriptions.read",
  SUBSCRIPTIONS_UPDATE: "subscriptions.update",
  SUBSCRIPTIONS_CANCEL: "subscriptions.cancel",

  VOUCHERS_READ: "vouchers.read",
  VOUCHERS_CREATE: "vouchers.create",
  VOUCHERS_UPDATE: "vouchers.update",
  VOUCHERS_DELETE: "vouchers.delete",

  PAYMENTS_READ: "payments.read",
  REPORTS_READ: "reports.read",

  ADDRESSES_READ: "addresses.read",
  ADDRESSES_CREATE: "addresses.create",
  ADDRESSES_UPDATE: "addresses.update",
  ADDRESSES_DELETE: "addresses.delete",

  CITIES_READ: "cities.read",
  CITIES_CREATE: "cities.create",
  CITIES_UPDATE: "cities.update",
  CITIES_DELETE: "cities.delete",

  PINCODES_READ: "pincodes.read",
  PINCODES_CREATE: "pincodes.create",
  PINCODES_UPDATE: "pincodes.update",
  PINCODES_DELETE: "pincodes.delete",

  DELIVERY_PERSONS_READ: "delivery_persons.read",
  DELIVERY_PERSONS_CREATE: "delivery_persons.create",
  DELIVERY_PERSONS_UPDATE: "delivery_persons.update",
  DELIVERY_PERSONS_DELETE: "delivery_persons.delete",

  ORDERS_READ: "orders.read",
  MENUS_READ: "menus.read",
  MENUS_UPDATE: "menus.update",
  KITCHEN_READ: "kitchen.read",
  PROFILE_UPDATE: "profile.update",
  NOTIFICATIONS_READ: "notifications.read",
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];

const ALL_ADMIN_PERMISSIONS: Permission[] = [
  Permission.PLANS_READ,
  Permission.PLANS_CREATE,
  Permission.PLANS_UPDATE,
  Permission.PLANS_DELETE,
  Permission.CUSTOMERS_READ,
  Permission.CUSTOMERS_UPDATE,
  Permission.CUSTOMERS_DELETE,
  Permission.SUBSCRIPTIONS_READ,
  Permission.SUBSCRIPTIONS_UPDATE,
  Permission.SUBSCRIPTIONS_CANCEL,
  Permission.VOUCHERS_READ,
  Permission.VOUCHERS_CREATE,
  Permission.VOUCHERS_UPDATE,
  Permission.VOUCHERS_DELETE,
  Permission.PAYMENTS_READ,
  Permission.REPORTS_READ,
  Permission.ADDRESSES_READ,
  Permission.CITIES_READ,
  Permission.CITIES_CREATE,
  Permission.CITIES_UPDATE,
  Permission.CITIES_DELETE,
  Permission.PINCODES_READ,
  Permission.PINCODES_CREATE,
  Permission.PINCODES_UPDATE,
  Permission.PINCODES_DELETE,
  Permission.DELIVERY_PERSONS_READ,
  Permission.DELIVERY_PERSONS_CREATE,
  Permission.DELIVERY_PERSONS_UPDATE,
  Permission.DELIVERY_PERSONS_DELETE,
  Permission.ORDERS_READ,
  Permission.MENUS_READ,
  Permission.MENUS_UPDATE,
  Permission.KITCHEN_READ,
  Permission.NOTIFICATIONS_READ,
];

export const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  [Roles.SUPER_ADMIN]: ALL_ADMIN_PERMISSIONS,
  [Roles.ADMIN]: [
    Permission.PLANS_READ,
    Permission.PLANS_CREATE,
    Permission.PLANS_UPDATE,
    Permission.CUSTOMERS_READ,
    Permission.CUSTOMERS_UPDATE,
    Permission.SUBSCRIPTIONS_READ,
    Permission.SUBSCRIPTIONS_UPDATE,
    Permission.SUBSCRIPTIONS_CANCEL,
    Permission.VOUCHERS_READ,
    Permission.VOUCHERS_CREATE,
    Permission.VOUCHERS_UPDATE,
    Permission.PAYMENTS_READ,
    Permission.REPORTS_READ,
    Permission.ADDRESSES_READ,
    Permission.CITIES_READ,
    Permission.CITIES_CREATE,
    Permission.CITIES_UPDATE,
    Permission.PINCODES_READ,
    Permission.PINCODES_CREATE,
    Permission.PINCODES_UPDATE,
    Permission.DELIVERY_PERSONS_READ,
    Permission.DELIVERY_PERSONS_CREATE,
    Permission.DELIVERY_PERSONS_UPDATE,
    Permission.ORDERS_READ,
    Permission.MENUS_READ,
    Permission.MENUS_UPDATE,
    Permission.KITCHEN_READ,
    Permission.NOTIFICATIONS_READ,
  ],
  [Roles.CUSTOMER]: [
    Permission.PLANS_READ,
    Permission.SUBSCRIPTIONS_READ,
    Permission.SUBSCRIPTIONS_UPDATE,
    Permission.SUBSCRIPTIONS_CANCEL,
    Permission.PAYMENTS_READ,
    Permission.ADDRESSES_READ,
    Permission.ADDRESSES_CREATE,
    Permission.ADDRESSES_UPDATE,
    Permission.ADDRESSES_DELETE,
    Permission.CITIES_READ,
    Permission.PINCODES_READ,
    Permission.ORDERS_READ,
    Permission.MENUS_READ,
    Permission.PROFILE_UPDATE,
    Permission.NOTIFICATIONS_READ,
  ],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function hasAnyPermission(
  role: UserRole,
  permissions: readonly Permission[],
): boolean {
  return permissions.some((permission) => hasPermission(role, permission));
}

export function hasAllPermissions(
  role: UserRole,
  permissions: readonly Permission[],
): boolean {
  return permissions.every((permission) => hasPermission(role, permission));
}

export function getPermissionsForRole(role: UserRole): readonly Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}
