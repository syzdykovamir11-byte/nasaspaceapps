import { describe, expect, it } from "vitest";
import { centroid, m2ToHa, polygonAreaM2, selfIntersects } from "./geo";
import { gibsTileUrl, GIBS_LAYERS, imageryDate } from "./gibs";

describe("polygonAreaM2", () => {
  it("matches the closed-form area of a 1°×1° cell at the equator", () => {
    // Exact spherical area of a lat-lon cell: R² · Δλ · (sin φ2 − sin φ1).
    const R = 6371008.8;
    const exact = R * R * (Math.PI / 180) * Math.sin(Math.PI / 180);
    const a = polygonAreaM2([[0, 0], [0, 1], [1, 1], [1, 0]]);
    expect(Math.abs(a - exact) / exact).toBeLessThan(1e-9);
  });
  it("is about 1 ha for a 100 m square near 53° N", () => {
    const lat = 53;
    const dLat = 100 / 111_195; // metres per degree of latitude on this sphere
    const dLon = dLat / Math.cos((lat * Math.PI) / 180);
    const ha = m2ToHa(polygonAreaM2([[lat, 63], [lat, 63 + dLon], [lat + dLat, 63 + dLon], [lat + dLat, 63]]));
    expect(ha).toBeGreaterThan(0.99);
    expect(ha).toBeLessThan(1.01);
  });
  it("ignores orientation and a repeated closing point, and is 0 below 3 points", () => {
    const ring: [number, number][] = [[0, 0], [0, 1], [1, 1], [1, 0]];
    expect(polygonAreaM2([...ring].reverse())).toBeCloseTo(polygonAreaM2(ring), 3);
    expect(polygonAreaM2([...ring, [0, 0]])).toBeCloseTo(polygonAreaM2(ring), 3);
    expect(polygonAreaM2([[0, 0], [1, 1]])).toBe(0);
  });
});

describe("centroid", () => {
  it("averages the corners", () => {
    expect(centroid([[0, 0], [0, 2], [2, 2], [2, 0]])).toEqual([1, 1]);
  });
});

describe("GIBS", () => {
  it("builds the documented WMTS REST URL", () => {
    expect(gibsTileUrl(GIBS_LAYERS.ndvi, "2026-07-15")).toBe(
      "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_NDVI_8Day/default/2026-07-15/GoogleMapsCompatible_Level9/{z}/{y}/{x}.png",
    );
  });
  it("uses the season's mid-July date when covered, otherwise the latest year", () => {
    expect(imageryDate(GIBS_LAYERS.satellite, 2010)).toEqual({ date: "2010-07-15", fellBack: false });
    expect(imageryDate(GIBS_LAYERS.satellite, 1991)).toEqual({ date: "2026-07-15", fellBack: true });
    expect(imageryDate(GIBS_LAYERS.ndvi, 2025)).toEqual({ date: "2025-07-15", fellBack: false });
    expect(imageryDate(GIBS_LAYERS.ndvi, 2010)).toEqual({ date: "2026-07-15", fellBack: true });
  });
});

describe("selfIntersects", () => {
  it("is false for a simple square and true for a bow-tie", () => {
    expect(selfIntersects([[0, 0], [0, 1], [1, 1], [1, 0]])).toBe(false);
    expect(selfIntersects([[0, 0], [1, 1], [0, 1], [1, 0]])).toBe(true);
  });
  it("is false for triangles", () => {
    expect(selfIntersects([[0, 0], [0, 1], [1, 0]])).toBe(false);
  });
});
