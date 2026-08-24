/**
 * Browser/SSR base URL for this app’s `/api/*` BFF routes.
 * Leave unset for same-origin (recommended). Set when the UI talks to a
 * different host (e.g. local UI → deployed Next app).
 *
 * Examples:
 *   NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
 *   NEXT_PUBLIC_API_BASE_URL=https://etomics-dev.example.com
 */
export function getAppApiBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const host = vercel.replace(/\/$/, "");
    return host.startsWith("http") ? host : `https://${host}`;
  }

  return "http://localhost:3000";
}
