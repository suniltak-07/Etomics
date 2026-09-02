export type ServiceAreaRing = [number, number][];

export function hasDefinedServiceArea(
  ring: ServiceAreaRing | null | undefined,
): boolean {
  return Boolean(ring && ring.length >= 3);
}
