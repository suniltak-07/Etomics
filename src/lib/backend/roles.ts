import { UserRole } from "@/types/enums";

export const BackendRole = {
  CUSTOMER: "ROLE_CUSTOMER",
  ADMIN: "ROLE_ADMIN",
} as const;

const ADMIN_ALIASES = new Set([
  BackendRole.ADMIN,
  "ADMIN",
  UserRole.ADMIN,
  UserRole.SUPER_ADMIN,
  "ROLE_SUPER_ADMIN",
]);

const CUSTOMER_ALIASES = new Set([
  BackendRole.CUSTOMER,
  "CUSTOMER",
  UserRole.CUSTOMER,
]);

export function normalizeBackendRole(role: string): string {
  return role.trim().toUpperCase();
}

export function isAdminBackendRole(role: string): boolean {
  return ADMIN_ALIASES.has(normalizeBackendRole(role));
}

export function isCustomerBackendRole(role: string): boolean {
  return CUSTOMER_ALIASES.has(normalizeBackendRole(role));
}

export function collectBackendRoles(
  roles?: readonly string[] | null,
  role?: string | null,
): string[] {
  const collected: string[] = [];
  if (Array.isArray(roles)) {
    for (const item of roles) {
      if (typeof item === "string" && item.trim()) collected.push(item);
    }
  }
  if (typeof role === "string" && role.trim()) collected.push(role);
  return collected;
}

/** Prefer admin when both roles are present. */
export function mapBackendRolesToUserRole(
  roles: readonly string[] | null | undefined,
): UserRole | null {
  const normalized = (roles ?? []).map(normalizeBackendRole);
  if (normalized.some(isAdminBackendRole)) return UserRole.ADMIN;
  if (normalized.some(isCustomerBackendRole)) return UserRole.CUSTOMER;
  return null;
}

export function portalHomeForRole(role: UserRole): string {
  if (role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN) {
    return "/admin/dashboard";
  }
  return "/customer/dashboard";
}

export function resolvePostLoginPath(
  role: UserRole,
  requested?: string | null,
): string {
  const home = portalHomeForRole(role);
  if (!requested || !requested.startsWith("/") || requested.startsWith("//")) {
    return home;
  }

  const isAdminPath = requested.startsWith("/admin");
  const isCustomerPath = requested.startsWith("/customer");
  const admin = role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN;

  if (admin && isCustomerPath) return home;
  if (!admin && isAdminPath) return home;
  return requested;
}
