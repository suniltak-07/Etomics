import { describe, expect, it } from "vitest";
import {
  Permission,
  getPermissionsForRole,
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
} from "@/lib/permissions/permissions";
import { UserRole } from "@/types/enums";

describe("permissions", () => {
  it("grants SUPER_ADMIN full admin plan and customer delete rights", () => {
    expect(hasPermission(UserRole.SUPER_ADMIN, Permission.PLANS_DELETE)).toBe(
      true,
    );
    expect(
      hasPermission(UserRole.SUPER_ADMIN, Permission.CUSTOMERS_DELETE),
    ).toBe(true);
    expect(
      hasPermission(UserRole.SUPER_ADMIN, Permission.VOUCHERS_DELETE),
    ).toBe(true);
  });

  it("allows ADMIN to manage plans and vouchers but not delete them", () => {
    expect(hasPermission(UserRole.ADMIN, Permission.PLANS_CREATE)).toBe(true);
    expect(hasPermission(UserRole.ADMIN, Permission.PLANS_UPDATE)).toBe(true);
    expect(hasPermission(UserRole.ADMIN, Permission.VOUCHERS_CREATE)).toBe(
      true,
    );
    expect(hasPermission(UserRole.ADMIN, Permission.PLANS_DELETE)).toBe(false);
    expect(hasPermission(UserRole.ADMIN, Permission.VOUCHERS_DELETE)).toBe(
      false,
    );
    expect(hasPermission(UserRole.ADMIN, Permission.CUSTOMERS_DELETE)).toBe(
      false,
    );
  });

  it("scopes CUSTOMER to self-serve permissions only", () => {
    expect(hasPermission(UserRole.CUSTOMER, Permission.PLANS_READ)).toBe(true);
    expect(hasPermission(UserRole.CUSTOMER, Permission.ADDRESSES_CREATE)).toBe(
      true,
    );
    expect(hasPermission(UserRole.CUSTOMER, Permission.PROFILE_UPDATE)).toBe(
      true,
    );
    expect(
      hasPermission(UserRole.CUSTOMER, Permission.SUBSCRIPTIONS_CANCEL),
    ).toBe(true);

    expect(hasPermission(UserRole.CUSTOMER, Permission.PLANS_CREATE)).toBe(
      false,
    );
    expect(hasPermission(UserRole.CUSTOMER, Permission.CUSTOMERS_READ)).toBe(
      false,
    );
    expect(hasPermission(UserRole.CUSTOMER, Permission.VOUCHERS_CREATE)).toBe(
      false,
    );
    expect(hasPermission(UserRole.CUSTOMER, Permission.REPORTS_READ)).toBe(
      false,
    );
  });

  it("supports hasAnyPermission and hasAllPermissions helpers", () => {
    expect(
      hasAnyPermission(UserRole.CUSTOMER, [
        Permission.PLANS_CREATE,
        Permission.ADDRESSES_READ,
      ]),
    ).toBe(true);

    expect(
      hasAnyPermission(UserRole.CUSTOMER, [
        Permission.PLANS_CREATE,
        Permission.VOUCHERS_DELETE,
      ]),
    ).toBe(false);

    expect(
      hasAllPermissions(UserRole.ADMIN, [
        Permission.PLANS_READ,
        Permission.PAYMENTS_READ,
      ]),
    ).toBe(true);

    expect(
      hasAllPermissions(UserRole.ADMIN, [
        Permission.PLANS_READ,
        Permission.PLANS_DELETE,
      ]),
    ).toBe(false);
  });

  it("returns the role permission list via getPermissionsForRole", () => {
    const customerPerms = getPermissionsForRole(UserRole.CUSTOMER);
    expect(customerPerms).toContain(Permission.ADDRESSES_DELETE);
    expect(customerPerms).not.toContain(Permission.PLANS_UPDATE);

    const adminPerms = getPermissionsForRole(UserRole.ADMIN);
    expect(adminPerms.length).toBeGreaterThan(customerPerms.length);
  });
});
