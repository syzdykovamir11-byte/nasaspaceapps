import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parsePowerResponse } from "./parse";
import type { PowerSeries } from "./types";

const meta = { id: "x", label: "x", region: "x", downloaded: "2026-11-14", requestUrl: "u" };

describe("parsePowerResponse", () => {
  it("gives the same series as the build-time script for the cached Astana response", () => {
    const raw = JSON.parse(readFileSync(new URL("../../../data/power_astana.json", import.meta.url), "utf8"));
    const built = JSON.parse(readFileSync(new URL("../../../public/data/astana.json", import.meta.url), "utf8")) as PowerSeries;
    const s = parsePowerResponse(raw, meta);
    expect([s.start, s.end, s.lat, s.lon]).toEqual([built.start, built.end, built.lat, built.lon]);
    // Independent of the build script: the requested Astana point in data/README.md.
    expect([s.lat, s.lon]).toEqual([51.17, 71.43]);
    expect(s.tmin).toEqual(built.tmin);
    expect(s.tmax).toEqual(built.tmax);
    expect(s.prcp).toEqual(built.prcp);
  });
  it("turns the fill value into null and rejects wrong units and gaps", () => {
    const raw: {
      geometry: { coordinates: number[] };
      header: { fill_value: number; sources: string[] };
      parameters: Record<string, { units: string }>;
      properties: { parameter: Record<string, Record<string, number>> };
    } = {
      geometry: { coordinates: [70, 52, 300] },
      header: { fill_value: -999, sources: ["POWER"] },
      parameters: { T2M_MAX: { units: "C" }, T2M_MIN: { units: "C" }, PRECTOTCORR: { units: "mm/day" } },
      properties: {
        parameter: {
          T2M_MAX: { "20200101": 1, "20200102": -999 },
          T2M_MIN: { "20200101": -1, "20200102": -2 },
          PRECTOTCORR: { "20200101": 0, "20200102": 0.5 },
        },
      },
    };
    const parsed = parsePowerResponse(raw, meta);
    expect(parsed.tmax).toEqual([1, null]);
    // GeoJSON order is [lon, lat, elevation].
    expect([parsed.lat, parsed.lon, parsed.elevationM]).toEqual([52, 70, 300]);
    const badUnit = structuredClone(raw);
    badUnit.parameters.T2M_MIN = { units: "K" };
    expect(() => parsePowerResponse(badUnit, meta)).toThrow(/expected "C"/);
    const gap = structuredClone(raw);
    gap.properties.parameter.T2M_MAX = { "20200101": 1, "20200103": 2 };
    expect(() => parsePowerResponse(gap, meta)).toThrow(/gap/);
  });
});
