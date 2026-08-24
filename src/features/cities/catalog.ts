export interface CityCatalogEntry {
  name: string;
  slug: string;
  state: string;
  centerLat: number;
  centerLng: number;
}

/** Operating-city picker. State and map center are derived from the selection. */
export const CITY_CATALOG: CityCatalogEntry[] = [
  {
    name: "Ahmedabad",
    slug: "ahmedabad",
    state: "Gujarat",
    centerLat: 23.0225,
    centerLng: 72.5714,
  },
  {
    name: "Bengaluru",
    slug: "bengaluru",
    state: "Karnataka",
    centerLat: 12.9716,
    centerLng: 77.5946,
  },
  {
    name: "Chennai",
    slug: "chennai",
    state: "Tamil Nadu",
    centerLat: 13.0827,
    centerLng: 80.2707,
  },
  {
    name: "Delhi",
    slug: "delhi",
    state: "Delhi",
    centerLat: 28.6139,
    centerLng: 77.209,
  },
  {
    name: "Hyderabad",
    slug: "hyderabad",
    state: "Telangana",
    centerLat: 17.385,
    centerLng: 78.4867,
  },
  {
    name: "Jaipur",
    slug: "jaipur",
    state: "Rajasthan",
    centerLat: 26.9124,
    centerLng: 75.7873,
  },
  {
    name: "Kolkata",
    slug: "kolkata",
    state: "West Bengal",
    centerLat: 22.5726,
    centerLng: 88.3639,
  },
  {
    name: "Lucknow",
    slug: "lucknow",
    state: "Uttar Pradesh",
    centerLat: 26.8467,
    centerLng: 80.9462,
  },
  {
    name: "Mumbai",
    slug: "mumbai",
    state: "Maharashtra",
    centerLat: 19.076,
    centerLng: 72.8777,
  },
  {
    name: "Pune",
    slug: "pune",
    state: "Maharashtra",
    centerLat: 18.5204,
    centerLng: 73.8567,
  },
].sort((a, b) => a.name.localeCompare(b.name));

export function findCityCatalogEntry(
  name: string,
): CityCatalogEntry | undefined {
  const normalized = name.trim().toLowerCase();
  return CITY_CATALOG.find((city) => city.name.toLowerCase() === normalized);
}

const INDIA_MAP_CENTER: [number, number] = [20.5937, 78.9629];

/** Map default for a city name. Used by pincode drawing — not stored on create. */
export function mapCenterForCityName(name: string): [number, number] {
  const entry = findCityCatalogEntry(name);
  if (!entry) return INDIA_MAP_CENTER;
  return [entry.centerLat, entry.centerLng];
}
