export interface GeoPoint {
  id: string;
  latitude: number;
  longitude: number;
}

function distance(
  a: GeoPoint,
  b: { latitude: number; longitude: number },
): number {
  const dLat = a.latitude - b.latitude;
  const dLng = a.longitude - b.longitude;
  return dLat * dLat + dLng * dLng;
}

/** Greedy nearest-neighbor order from a start coordinate. */
export function orderStopsNearestNeighbor<T extends GeoPoint>(
  stops: T[],
  origin: { latitude: number; longitude: number },
): T[] {
  const remaining = [...stops];
  const ordered: T[] = [];
  let current = origin;

  while (remaining.length > 0) {
    let bestIndex = 0;
    let bestDistance = Number.POSITIVE_INFINITY;
    remaining.forEach((stop, index) => {
      const d = distance(stop, current);
      if (d < bestDistance) {
        bestDistance = d;
        bestIndex = index;
      }
    });
    const [next] = remaining.splice(bestIndex, 1);
    ordered.push(next);
    current = next;
  }

  return ordered;
}
