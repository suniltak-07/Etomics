export type ServiceAreaRing = [number, number][];

export function hasDefinedServiceArea(
  ring: ServiceAreaRing | null | undefined,
): boolean {
  return Boolean(ring && ring.length >= 3);
}

export async function locatePincodeArea(
  pincode: string,
  areaName?: string,
): Promise<{ lat: number; lng: number } | null> {
  const trimmed = pincode.trim();
  if (!/^\d{6}$/.test(trimmed)) return null;

  const query = [trimmed, areaName?.trim(), "India"].filter(Boolean).join(" ");
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "in");
  url.searchParams.set("q", query);

  try {
    const response = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return null;
    const results = (await response.json()) as Array<{
      lat?: string;
      lon?: string;
    }>;
    const first = results[0];
    const lat = Number(first?.lat);
    const lng = Number(first?.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
  } catch {
    return null;
  }
}
