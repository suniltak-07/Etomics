export const OFOOD_REFRESH_COOKIE = "OFOOD_REFRESH_TOKEN";

const DEFAULT_BASE_URL = "https://ofood-backend.onrender.com";

export function getOfoodBaseUrl(): string {
  const configured = process.env.OFOOD_API_BASE_URL?.trim();
  return (configured || DEFAULT_BASE_URL).replace(/\/$/, "");
}
