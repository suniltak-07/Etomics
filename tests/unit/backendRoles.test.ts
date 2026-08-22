import { describe, expect, it } from "vitest";
import {
  collectBackendRoles,
  mapBackendRolesToUserRole,
  portalHomeForRole,
  resolvePostLoginPath,
} from "@/lib/backend/roles";
import { mapOfoodUserToSession } from "@/lib/backend/user";
import { UserRole } from "@/types/enums";

describe("backend role mapping", () => {
  it("maps ROLE_CUSTOMER to the customer portal", () => {
    expect(mapBackendRolesToUserRole(["ROLE_CUSTOMER"])).toBe(
      UserRole.CUSTOMER,
    );
    expect(portalHomeForRole(UserRole.CUSTOMER)).toBe("/customer/dashboard");
  });

  it("maps ROLE_ADMIN to the admin portal", () => {
    expect(mapBackendRolesToUserRole(["ROLE_ADMIN"])).toBe(UserRole.ADMIN);
    expect(portalHomeForRole(UserRole.ADMIN)).toBe("/admin/dashboard");
  });

  it("maps CUSTOMER and ADMIN without the ROLE_ prefix", () => {
    expect(mapBackendRolesToUserRole(["CUSTOMER"])).toBe(UserRole.CUSTOMER);
    expect(mapBackendRolesToUserRole(["ADMIN"])).toBe(UserRole.ADMIN);
  });

  it("reads a singular role field from /me", () => {
    expect(
      mapBackendRolesToUserRole(collectBackendRoles(undefined, "CUSTOMER")),
    ).toBe(UserRole.CUSTOMER);
    expect(
      mapBackendRolesToUserRole(collectBackendRoles(["ROLE_ADMIN"], "ADMIN")),
    ).toBe(UserRole.ADMIN);
  });

  it("maps a /me user with role CUSTOMER and null avatar", () => {
    const user = mapOfoodUserToSession({
      id: "8a7881c8-0aa0-40cc-ae8c-09b387f86a0f",
      email: "testkumar122+1@gmail.com",
      role: "CUSTOMER",
      firstName: "Sunil",
      lastName: "Kumar",
      mobile: "7760652485",
      avatarUrl: null,
      isActive: true,
      createdAt: "2026-08-22T09:13:23.603382Z",
      updatedAt: "2026-08-22T09:13:29.105774Z",
    });
    expect(user?.role).toBe(UserRole.CUSTOMER);
    expect(user?.avatarUrl).toBeUndefined();
  });

  it("maps CUSTOMER and ADMIN without the ROLE_ prefix", () => {
    expect(mapBackendRolesToUserRole(["CUSTOMER"])).toBe(UserRole.CUSTOMER);
    expect(mapBackendRolesToUserRole(["ADMIN"])).toBe(UserRole.ADMIN);
  });

  it("reads a singular role field from /me", () => {
    expect(
      mapBackendRolesToUserRole(collectBackendRoles(undefined, "CUSTOMER")),
    ).toBe(UserRole.CUSTOMER);
    expect(
      mapBackendRolesToUserRole(collectBackendRoles(["ROLE_ADMIN"], "ADMIN")),
    ).toBe(UserRole.ADMIN);
  });

  it("prefers admin when both roles are present", () => {
    expect(mapBackendRolesToUserRole(["ROLE_CUSTOMER", "ROLE_ADMIN"])).toBe(
      UserRole.ADMIN,
    );
  });

  it("ignores a requested path that belongs to the other portal", () => {
    expect(resolvePostLoginPath(UserRole.CUSTOMER, "/admin/dashboard")).toBe(
      "/customer/dashboard",
    );
    expect(resolvePostLoginPath(UserRole.ADMIN, "/customer/dashboard")).toBe(
      "/admin/dashboard",
    );
  });

  it("keeps same-portal return URLs", () => {
    expect(resolvePostLoginPath(UserRole.CUSTOMER, "/customer/orders")).toBe(
      "/customer/orders",
    );
  });
});
