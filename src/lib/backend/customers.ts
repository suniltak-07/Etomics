import type { NextResponse } from "next/server";
import { jsonError } from "@/lib/api/route-helpers";
import { ErrorCode } from "@/lib/api/errors";
import { applyUpstreamCookies, ofoodErrorResponse } from "@/lib/backend/proxy";
import type { OfoodApiError } from "@/lib/backend/types";
import type { Customer, CustomerPreferences } from "@/types/entities";
import { FoodPreference, HealthGoal, UserRole } from "@/types/enums";

export type PublicCustomer = Omit<Customer, "password">;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  if (typeof value === "string" && value.trim()) {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
  };
}

function unwrapPayload(payload: unknown): unknown {
  if (Array.isArray(payload) || !isRecord(payload)) return payload;
  if (Array.isArray(payload.customers)) return payload.customers;
  if (Array.isArray(payload.users)) return payload.users;
  if (Array.isArray(payload.content)) return payload.content;
  if ("data" in payload) return unwrapPayload(payload.data);
  if ("id" in payload && typeof payload.id === "string") return payload;
  return payload;
}

export function unwrapOfoodCustomers(payload: unknown): unknown[] {
  const unwrapped = unwrapPayload(payload);
  return Array.isArray(unwrapped) ? unwrapped : [];
}

export function unwrapOfoodCustomer(payload: unknown): unknown {
  const unwrapped = unwrapPayload(payload);
  return isRecord(unwrapped) ? unwrapped : null;
}

function mapEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
): T | undefined {
  const raw = asString(value)
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
  return allowed.includes(raw as T) ? (raw as T) : undefined;
}

function mapPreferences(value: unknown): CustomerPreferences | undefined {
  if (!isRecord(value)) return undefined;
  const foodPreference = mapEnum(
    value.foodPreference ?? value.dietType ?? value.diet,
    Object.values(FoodPreference),
  );
  const healthGoal = mapEnum(
    value.healthGoal ?? value.goal,
    Object.values(HealthGoal),
  );
  const allergies = asStringArray(
    value.allergies ?? value.allergy ?? value.foodsToAvoid,
  );
  const dietaryRestrictions = asStringArray(value.dietaryRestrictions);
  const allergyNotes = asString(value.allergyNotes).trim();
  const notes = asString(value.notes).trim();
  const preferredDeliveryTime = asString(value.preferredDeliveryTime).trim();
  const spiceRaw = asString(value.spiceLevel).trim().toLowerCase();
  const spiceLevel =
    spiceRaw === "mild" || spiceRaw === "medium" || spiceRaw === "hot"
      ? spiceRaw
      : undefined;

  const preferences: CustomerPreferences = {
    ...(foodPreference ? { foodPreference } : {}),
    ...(healthGoal ? { healthGoal } : {}),
    ...(allergies.length ? { allergies } : {}),
    ...(dietaryRestrictions.length ? { dietaryRestrictions } : {}),
    ...(allergyNotes ? { allergyNotes } : {}),
    ...(notes ? { notes } : {}),
    ...(preferredDeliveryTime ? { preferredDeliveryTime } : {}),
    ...(spiceLevel ? { spiceLevel } : {}),
  };

  return Object.keys(preferences).length ? preferences : undefined;
}

function mapIsActive(raw: Record<string, unknown>): boolean {
  if (typeof raw.isActive === "boolean") return raw.isActive;
  if (typeof raw.active === "boolean") return raw.active;
  if (typeof raw.enabled === "boolean") return raw.enabled;
  const status = asString(raw.status).trim().toUpperCase();
  if (status === "INACTIVE" || status === "DISABLED" || status === "BLOCKED") {
    return false;
  }
  return true;
}

export function mapOfoodCustomer(payload: unknown): PublicCustomer | null {
  const raw = unwrapOfoodCustomer(payload);
  if (!isRecord(raw) || typeof raw.id !== "string" || !raw.id.trim()) {
    return null;
  }

  const fromFull = splitName(asString(raw.fullName));
  const firstName = asString(raw.firstName).trim() || fromFull.firstName;
  const lastName = asString(raw.lastName).trim() || fromFull.lastName;
  const mobile = (
    asString(raw.mobile) ||
    asString(raw.phone) ||
    asString(raw.phoneNumber)
  ).trim();
  const avatarUrl = (asString(raw.avatarUrl) || asString(raw.avatar)).trim();
  const dateOfBirth = (asString(raw.dateOfBirth) || asString(raw.dob)).trim();
  const createdAt = asString(raw.createdAt) || asString(raw.createdDate);
  const updatedAt = asString(raw.updatedAt) || asString(raw.updatedDate);
  const now = new Date().toISOString();

  const nestedPreferences = isRecord(raw.preferences) ? raw.preferences : raw;

  return {
    id: raw.id,
    email: asString(raw.email).trim(),
    role: UserRole.CUSTOMER,
    firstName,
    lastName,
    mobile: mobile || undefined,
    avatarUrl: avatarUrl || undefined,
    isActive: mapIsActive(raw),
    createdAt: createdAt || now,
    updatedAt: updatedAt || createdAt || now,
    dateOfBirth: dateOfBirth || undefined,
    preferences: mapPreferences(nestedPreferences),
  };
}

export function customerFailedUpstream(
  status: number,
  error: OfoodApiError | null,
  cookies: string[],
  fallback: string,
): NextResponse {
  return applyUpstreamCookies(
    ofoodErrorResponse(status, error, fallback),
    cookies,
  );
}

export function missingAccessToken() {
  return jsonError("Unauthorized", 401, ErrorCode.UNAUTHORIZED);
}
