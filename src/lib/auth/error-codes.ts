export const AuthErrorCode = {
  AUTHENTICATION_REQUIRED: "AUTHENTICATION_REQUIRED",
  ACCESS_TOKEN_EXPIRED: "ACCESS_TOKEN_EXPIRED",
  ACCESS_TOKEN_INVALID: "ACCESS_TOKEN_INVALID",
} as const;

export type AuthErrorCode = (typeof AuthErrorCode)[keyof typeof AuthErrorCode];

export function extractErrorCode(payload: unknown): string | undefined {
  if (!payload || typeof payload !== "object") return undefined;
  const record = payload as Record<string, unknown>;
  if (typeof record.code === "string" && record.code) return record.code;

  const nested = record.error;
  if (typeof nested === "string" && nested) return nested;
  if (nested && typeof nested === "object") {
    const nestedRecord = nested as Record<string, unknown>;
    if (typeof nestedRecord.code === "string" && nestedRecord.code) {
      return nestedRecord.code;
    }
  }
  return undefined;
}

export function isAccessTokenExpired(code: string | undefined): boolean {
  return code === AuthErrorCode.ACCESS_TOKEN_EXPIRED;
}

export function isAccessTokenInvalid(code: string | undefined): boolean {
  return code === AuthErrorCode.ACCESS_TOKEN_INVALID;
}

export function isAuthenticationRequired(code: string | undefined): boolean {
  return code === AuthErrorCode.AUTHENTICATION_REQUIRED;
}
