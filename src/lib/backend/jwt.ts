import { collectBackendRoles } from "@/lib/backend/roles";

function decodeBase64Url(value: string): string {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  if (typeof atob === "function") {
    return atob(padded);
  }
  return Buffer.from(padded, "base64").toString("utf8");
}

export function rolesFromJwt(accessToken: string): string[] {
  try {
    const payloadPart = accessToken.split(".")[1];
    if (!payloadPart) return [];
    const json = JSON.parse(decodeBase64Url(payloadPart)) as {
      roles?: string[];
      role?: string;
    };
    return collectBackendRoles(json.roles, json.role);
  } catch {
    return [];
  }
}
