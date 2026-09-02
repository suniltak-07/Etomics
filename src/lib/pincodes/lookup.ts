export interface PincodeLookupResult {
  pincode: string;
  areaName: string;
  lat: number | null;
  lng: number | null;
  /** Southwest, northeast corners for Leaflet fitBounds. */
  bounds: [[number, number], [number, number]] | null;
  /** Suggested service-area ring as [lat, lng] points. */
  ring: [number, number][] | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asNumber(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

const CACHE_TTL_MS = 1000 * 60 * 60 * 6;
const CACHE_VERSION = "polygon-v1";
const MAX_RING_POINTS = 32;
const cache = new Map<
  string,
  { expires: number; value: PincodeLookupResult }
>();

const NOMINATIM_HEADERS = {
  Accept: "application/json",
  "Accept-Language": "en",
  "User-Agent": "EatOmics/1.0 (pincode lookup; https://etomics)",
};

async function fetchJson(url: string, headers?: HeadersInit): Promise<unknown> {
  const response = await fetch(url, {
    headers: { Accept: "application/json", ...headers },
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) return null;
  return response.json();
}

interface PostalOffice {
  name: string;
  delivery: boolean;
  branchType: string;
}

function parsePostalOffices(payload: unknown): PostalOffice[] {
  if (!Array.isArray(payload)) return [];
  const first = payload[0];
  if (!isRecord(first) || asString(first.Status).toLowerCase() !== "success") {
    return [];
  }
  if (!Array.isArray(first.PostOffice)) return [];
  return first.PostOffice.flatMap((item) => {
    if (!isRecord(item)) return [];
    const name = asString(item.Name);
    if (!name) return [];
    return [
      {
        name,
        delivery: asString(item.DeliveryStatus).toLowerCase() === "delivery",
        branchType: asString(item.BranchType).toLowerCase(),
      },
    ];
  });
}

function officeScore(office: PostalOffice): number {
  if (office.branchType.includes("head post")) return 3;
  if (/\bgpo\b/i.test(office.name)) return 3;
  if (office.delivery && office.branchType.includes("sub post")) return 2;
  if (office.delivery) return 1;
  return 0;
}

function cleanOfficeName(name: string): string {
  const stripped = name.replace(/\s*\([^)]*\)\s*$/, "").trim();
  return stripped || name;
}

function pickAreaName(offices: PostalOffice[], fallback: string): string {
  const chosen = [...offices].sort(
    (a, b) => officeScore(b) - officeScore(a),
  )[0];
  return cleanOfficeName(chosen?.name || fallback);
}

function simplifyRing(ring: [number, number][]): [number, number][] {
  if (ring.length <= MAX_RING_POINTS) return ring;
  const sampled: [number, number][] = [];
  for (let i = 0; i < MAX_RING_POINTS; i += 1) {
    const index = Math.round((i * (ring.length - 1)) / MAX_RING_POINTS);
    const point = ring[Math.min(index, ring.length - 1)];
    const prev = sampled[sampled.length - 1];
    if (!prev || prev[0] !== point[0] || prev[1] !== point[1]) {
      sampled.push(point);
    }
  }
  return sampled.length >= 3 ? sampled : ring.slice(0, MAX_RING_POINTS);
}

function lngLatRing(coords: unknown): [number, number][] {
  if (!Array.isArray(coords)) return [];
  const ring: [number, number][] = [];
  for (const pair of coords) {
    if (!Array.isArray(pair) || pair.length < 2) continue;
    const lng = asNumber(pair[0]);
    const lat = asNumber(pair[1]);
    if (lat == null || lng == null) continue;
    ring.push([lat, lng]);
  }
  if (ring.length >= 2) {
    const first = ring[0];
    const last = ring[ring.length - 1];
    if (first[0] === last[0] && first[1] === last[1]) ring.pop();
  }
  return ring;
}

function ringArea(ring: [number, number][]): number {
  let area = 0;
  for (let i = 0; i < ring.length; i += 1) {
    const [y1, x1] = ring[i];
    const [y2, x2] = ring[(i + 1) % ring.length];
    area += x1 * y2 - x2 * y1;
  }
  return Math.abs(area);
}

function ringFromGeoJson(geojson: unknown): [number, number][] | null {
  if (!isRecord(geojson)) return null;
  const type = asString(geojson.type);
  const coordinates = geojson.coordinates;

  if (type === "Polygon" && Array.isArray(coordinates)) {
    const ring = lngLatRing(coordinates[0]);
    return ring.length >= 3 ? simplifyRing(ring) : null;
  }

  if (type === "MultiPolygon" && Array.isArray(coordinates)) {
    let best: [number, number][] = [];
    let bestArea = 0;
    for (const polygon of coordinates) {
      if (!Array.isArray(polygon)) continue;
      const ring = lngLatRing(polygon[0]);
      if (ring.length < 3) continue;
      const area = ringArea(ring);
      if (area >= bestArea) {
        best = ring;
        bestArea = area;
      }
    }
    return best.length >= 3 ? simplifyRing(best) : null;
  }

  return null;
}

function ringFromBounds(
  bounds: [[number, number], [number, number]],
): [number, number][] {
  const [[south, west], [north, east]] = bounds;
  return [
    [south, west],
    [south, east],
    [north, east],
    [north, west],
  ];
}

interface NominatimHit {
  lat: number;
  lng: number;
  areaName: string;
  bounds: [[number, number], [number, number]] | null;
  ring: [number, number][] | null;
}

function parseNominatim(payload: unknown): NominatimHit | null {
  if (!Array.isArray(payload) || payload.length === 0) return null;
  const first = payload[0];
  if (!isRecord(first)) return null;
  const lat = asNumber(first.lat);
  const lng = asNumber(first.lon);
  if (lat == null || lng == null) return null;

  const address = isRecord(first.address) ? first.address : {};
  const areaName =
    asString(address.suburb) ||
    asString(address.neighbourhood) ||
    asString(address.village) ||
    asString(address.town) ||
    asString(address.city) ||
    asString(address.hamlet) ||
    asString(address.county);

  const box = Array.isArray(first.boundingbox) ? first.boundingbox : [];
  const south = asNumber(box[0]);
  const north = asNumber(box[1]);
  const west = asNumber(box[2]);
  const east = asNumber(box[3]);
  const bounds =
    south != null && north != null && west != null && east != null
      ? ([
          [south, west],
          [north, east],
        ] as [[number, number], [number, number]])
      : null;

  const ring =
    ringFromGeoJson(first.geojson) ?? (bounds ? ringFromBounds(bounds) : null);

  return { lat, lng, areaName, bounds, ring };
}

async function geocodeNominatim(
  pincode: string,
  query?: string,
): Promise<NominatimHit | null> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "in");
  url.searchParams.set("polygon_geojson", "1");
  if (query) {
    url.searchParams.set("q", query);
  } else {
    url.searchParams.set("postalcode", pincode);
    url.searchParams.set("country", "India");
  }
  return parseNominatim(await fetchJson(url.toString(), NOMINATIM_HEADERS));
}

export async function lookupIndianPincode(
  pincode: string,
): Promise<PincodeLookupResult | null> {
  const trimmed = pincode.trim();
  if (!/^\d{6}$/.test(trimmed)) return null;

  const cacheKey = `${CACHE_VERSION}:${trimmed}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expires > Date.now()) return cached.value;

  const postalUrl = `https://api.postalpincode.in/pincode/${trimmed}`;
  const [postalPayload, geo] = await Promise.all([
    fetchJson(postalUrl).catch(() => null),
    geocodeNominatim(trimmed).catch(() => null),
  ]);

  const offices = parsePostalOffices(postalPayload);
  let areaName = pickAreaName(offices, geo?.areaName ?? "");
  let hit = geo;

  if (!hit && areaName) {
    hit = await geocodeNominatim(trimmed, `${trimmed} ${areaName} India`).catch(
      () => null,
    );
  }

  if (!areaName && hit?.areaName) areaName = hit.areaName;

  if (!areaName && hit == null) return null;

  const result: PincodeLookupResult = {
    pincode: trimmed,
    areaName,
    lat: hit?.lat ?? null,
    lng: hit?.lng ?? null,
    bounds: hit?.bounds ?? null,
    ring: hit?.ring ?? null,
  };

  cache.set(cacheKey, { expires: Date.now() + CACHE_TTL_MS, value: result });
  return result;
}
