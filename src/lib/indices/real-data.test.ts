import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { PowerSeries } from "@/lib/power/types";
import { summarizeLatestSeason, summarizeSeason } from "./threats";
import { monthStrip } from "./months";
import { median } from "./rank";
import { frostFreeByYear } from "@/lib/crops/frost";
import { formatDoy, frostDates } from "@/lib/crops/frostDates";
import { evaluate } from "@/lib/crops/rotation";

/**
 * Expected values were computed independently in Python, directly from the raw POWER JSON in data/
 * (season 1 Apr–30 Sep, CDD = longest run of PRECTOTCORR < 1 mm, FD = days with T2M_MIN < 0 °C), on 2026-11-14.
 * Requires public/data/ (run `npm run data`).
 */
const EXPECTED = {
  astana: { cdd: 19, cddAsBad: 29, fd: 9, fdAsBad: 45 },
  kokshetau: { cdd: 10, cddAsBad: 44, fd: 10, fdAsBad: 45 },
  kostanay: { cdd: 16, cddAsBad: 34, fd: 5, fdAsBad: 45 },
  petropavl: { cdd: 14, cddAsBad: 28, fd: 13, fdAsBad: 45 },
} as const;

describe("latest season on the cached NASA POWER data matches the Python cross-check", () => {
  for (const [id, e] of Object.entries(EXPECTED)) {
    it(id, () => {
      const s = JSON.parse(readFileSync(new URL(`../../../public/data/${id}.json`, import.meta.url), "utf8")) as PowerSeries;
      const r = summarizeLatestSeason(s);
      expect(r).not.toBeNull();
      expect([r!.year, r!.firstOtherYear, r!.lastOtherYear]).toEqual([2026, 1981, 2025]);
      const [dry, frost] = r!.threats;
      expect([dry!.ranking.value, dry!.ranking.asBadOrWorse, dry!.ranking.pastCount]).toEqual([e.cdd, e.cddAsBad, 45]);
      expect([frost!.ranking.value, frost!.ranking.asBadOrWorse, frost!.ranking.pastCount]).toEqual([e.fd, e.fdAsBad, 45]);
    });
  }
});

/** Frost-free season 1981–2025 (last T2M_MIN < 0 before 15 Jul to first on/after 15 Jul), Python cross-check 2026-11-14. */
const FROST_FREE = {
  astana: { median: 140, min: 101, max: 181, wheat: 37, pea: 45, lentil: 14, sunflower: 32 },
  kokshetau: { median: 140, min: 101, max: 161, wheat: 38, pea: 45, lentil: 10, sunflower: 33 },
  kostanay: { median: 141, min: 102, max: 189, wheat: 41, pea: 45, lentil: 11, sunflower: 38 },
  petropavl: { median: 135, min: 103, max: 164, wheat: 38, pea: 45, lentil: 6, sunflower: 32 },
} as const;

describe("frost-free season and crop fit on cached data match the Python cross-check", () => {
  for (const [id, e] of Object.entries(FROST_FREE)) {
    it(id, () => {
      const s = JSON.parse(readFileSync(new URL(`../../../public/data/${id}.json`, import.meta.url), "utf8")) as PowerSeries;
      const ffy = frostFreeByYear(s);
      const lens = ffy.map((y) => y.frostFreeDays);
      expect([lens.length, median(lens), Math.min(...lens), Math.max(...lens)]).toEqual([45, e.median, e.min, e.max]);
      const fits = evaluate(["wheat", "pea", "lentil", "sunflower"], ffy).fits.map((f) => f.fitsYears);
      expect(fits).toEqual([e.wheat, e.pea, e.lentil, e.sunflower]);
    });
  }
});

/** Month strip 1981–2025 and season ranks, Python cross-check 2026-11-14. */
describe("month strip and past-season ranks on cached data match the Python cross-check", () => {
  const load = (id: string) =>
    JSON.parse(readFileSync(new URL(`../../../public/data/${id}.json`, import.meta.url), "utf8")) as PowerSeries;
  it("astana and kostanay month strip", () => {
    const a = monthStrip(load("astana"))!;
    expect([a.firstYear, a.lastYear, a.years]).toEqual([1981, 2025, 45]);
    expect(a.months.map((m) => Math.round(m.frostShare * 100))).toEqual([100, 100, 100, 100, 82, 4, 0, 0, 71, 100, 100, 100]);
    expect(a.months.map((m) => Math.round(m.medianPrecipMm * 10) / 10)).toEqual([21.3, 20.7, 21.1, 22.7, 31.4, 30.9, 44.1, 22.4, 21.8, 28.3, 34.3, 24.9]);
    const k = monthStrip(load("kostanay"))!;
    expect(k.months.map((m) => Math.round(m.frostShare * 100))).toEqual([100, 100, 100, 100, 76, 4, 0, 0, 60, 100, 100, 100]);
  });
  it("worst past seasons rank 1 against the other 45", () => {
    const k = summarizeSeason(load("kostanay"), 1991)!;
    expect([k.firstOtherYear, k.lastOtherYear]).toEqual([1981, 2026]);
    const dry = k.threats.find((t) => t.id === "dry")!;
    expect([dry.ranking.value, dry.rank, dry.rankOf, dry.ranking.asBadOrWorse, dry.ranking.pastCount, dry.ranking.level]).toEqual([60, 1, 46, 0, 45, "unusual"]);
    const f = summarizeSeason(load("astana"), 1989)!.threats.find((t) => t.id === "frost")!;
    expect([f.ranking.value, f.rank, f.ranking.asBadOrWorse]).toEqual([34, 2, 4]);
  });
});

/** Frost dates 1981–2025 (day of year), nearest-rank percentiles, Python cross-check 2026-11-14. */
describe("frost dates on cached data match the Python cross-check", () => {
  const E = {
    astana: [130, 148, 270, 259],
    kokshetau: [132, 150, 270, 262],
    kostanay: [127, 150, 271, 261],
    petropavl: [134, 149, 269, 260],
  } as const;
  for (const [id, e] of Object.entries(E)) {
    it(id, () => {
      const s = JSON.parse(readFileSync(new URL(`../../../public/data/${id}.json`, import.meta.url), "utf8")) as PowerSeries;
      const d = frostDates(frostFreeByYear(s))!;
      expect([d.springMedian, d.spring9of10, d.autumnMedian, d.autumn9of10]).toEqual([...e]);
    });
  }
  it("formats days of year", () => {
    expect([formatDoy(130), formatDoy(148), formatDoy(259), formatDoy(0), formatDoy(366)]).toEqual(["10 May", "28 May", "16 Sept", "before 1 Jan", "after 31 Dec"]);
  });
});
