/** [lat, lon] in degrees. */
export type LatLon = [number, number];

/** Mean Earth radius in metres (IUGG mean radius). Leaflet.draw and Turf use 6378137 m, so their areas read about 0.2% larger. */
const R = 6371008.8;
const rad = (d: number) => (d * Math.PI) / 180;

/**
 * Area of a simple polygon on a sphere, in m², by the spherical-excess line-integral formula
 * (the same method as Leaflet.draw's geodesicArea and Turf's area). Ring can be open or closed.
 */
export function polygonAreaM2(ring: LatLon[]): number {
  const pts = ring.length > 1 && ring[0]![0] === ring[ring.length - 1]![0] && ring[0]![1] === ring[ring.length - 1]![1] ? ring.slice(0, -1) : ring;
  if (pts.length < 3) return 0;
  let sum = 0;
  for (let i = 0; i < pts.length; i++) {
    const [lat1, lon1] = pts[i]!;
    const [lat2, lon2] = pts[(i + 1) % pts.length]!;
    sum += rad(lon2 - lon1) * (2 + Math.sin(rad(lat1)) + Math.sin(rad(lat2)));
  }
  return Math.abs((sum * R * R) / 2);
}

export const m2ToHa = (m2: number) => m2 / 10_000;

/** Average of the corners; good enough for a field-sized polygon to pick a weather grid cell. */
export function centroid(ring: LatLon[]): LatLon {
  const n = ring.length;
  return [ring.reduce((s, p) => s + p[0], 0) / n, ring.reduce((s, p) => s + p[1], 0) / n];
}

/**
 * True if any two non-adjacent edges of the closed ring cross. Planar test on lat/lon, which is fine
 * at field scale (a few kilometres).
 */
export function selfIntersects(ring: LatLon[]): boolean {
  const n = ring.length;
  if (n < 4) return false;
  const orient = (a: LatLon, b: LatLon, c: LatLon) => Math.sign((b[1] - a[1]) * (c[0] - a[0]) - (b[0] - a[0]) * (c[1] - a[1]));
  const cross = (p1: LatLon, p2: LatLon, q1: LatLon, q2: LatLon) =>
    orient(p1, p2, q1) * orient(p1, p2, q2) < 0 && orient(q1, q2, p1) * orient(q1, q2, p2) < 0;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      // Skip edges that share a corner (neighbours, and the first with the last).
      if (j === i + 1 || (i === 0 && j === n - 1)) continue;
      if (cross(ring[i]!, ring[(i + 1) % n]!, ring[j]!, ring[(j + 1) % n]!)) return true;
    }
  }
  return false;
}

/** Smallest outline accepted as a field, in m² (our choice: a 10 m × 10 m patch). */
export const MIN_FIELD_M2 = 100;

/** Map zoom from which field corners can be placed (one tap is then about 100 m or less). Our choice. */
export const MIN_DRAW_ZOOM = 10;
