export const OFOOD_REFRESH_COOKIE = "OFOOD_REFRESH_TOKEN";

const DEFAULT_BASE_URL =
  "http://ofood-alb-604405684.ap-south-1.elb.amazonaws.com";

export function getOfoodBaseUrl(): string {
  const configured = process.env.OFOOD_API_BASE_URL?.trim();
  return (configured || DEFAULT_BASE_URL).replace(/\/$/, "");
}
