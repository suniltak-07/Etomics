export const SPLASH_PATH = "/splash";

const BLOCKED_PREFIXES = ["/splash", "/login", "/signup", "/forgot-password"];

export function sanitizeNextPath(next?: string | null): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return null;
  if (
    BLOCKED_PREFIXES.some(
      (prefix) => next === prefix || next.startsWith(`${prefix}?`),
    )
  ) {
    return null;
  }
  if (BLOCKED_PREFIXES.some((prefix) => next.startsWith(`${prefix}/`))) {
    return null;
  }
  return next;
}

export function splashHref(next?: string | null): string {
  const safe = sanitizeNextPath(next);
  if (!safe) return SPLASH_PATH;
  return `${SPLASH_PATH}?next=${encodeURIComponent(safe)}`;
}
