import type { SessionUser } from "@/lib/auth/session";
import {
  collectBackendRoles,
  mapBackendRolesToUserRole,
} from "@/lib/backend/roles";
import type { OfoodUserDto } from "@/lib/backend/types";

function splitName(fullName: string | null | undefined): {
  firstName: string;
  lastName: string;
} {
  const parts = (fullName ?? "").trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
  };
}

function nullableText(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function unwrapOfoodUser(payload: unknown): OfoodUserDto | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as Record<string, unknown>;
  if (typeof record.id === "string" && typeof record.email === "string") {
    return record as unknown as OfoodUserDto;
  }
  if (record.user && typeof record.user === "object") {
    return unwrapOfoodUser(record.user);
  }
  if (record.data && typeof record.data === "object") {
    return unwrapOfoodUser(record.data);
  }
  return null;
}

export function mapOfoodUserToSession(dto: OfoodUserDto): SessionUser | null {
  const role = mapBackendRolesToUserRole(
    collectBackendRoles(dto.roles, dto.role),
  );
  if (!role || typeof dto.id !== "string" || typeof dto.email !== "string") {
    return null;
  }

  const fromFull = splitName(dto.fullName);
  const now = new Date().toISOString();

  return {
    id: dto.id,
    email: dto.email,
    role,
    firstName: nullableText(dto.firstName) || fromFull.firstName,
    lastName: nullableText(dto.lastName) || fromFull.lastName,
    mobile: nullableText(dto.mobile),
    avatarUrl: nullableText(dto.avatarUrl),
    isActive: dto.isActive ?? true,
    createdAt: dto.createdAt ?? now,
    updatedAt: dto.updatedAt ?? now,
  };
}
