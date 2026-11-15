import { describe, expect, it } from "vitest";
import type { PowerSeries } from "@/lib/power/types";
import { frostFreeByYear, type FrostFreeYear } from "./frost";
import { buildOptions, evaluate } from "./rotation";

const ffy = (lengths: number[]): FrostFreeYear[] =>
  lengths.map((d, i) => ({ year: 2000 + i, lastSpringFrost: 120, firstAutumnFrost: 121 + d, frostFreeDays: d }));

describe("frostFreeByYear", () => {
  it("finds last spring and first autumn frost", () => {
    const days = 365; // 2021
    const tmin: (number | null)[] = Array(days).fill(5);
    tmin[99] = -1; // 10 Apr (doy 100)
    tmin[129] = -2; // 10 May (doy 130): last spring frost
    tmin[269] = -1; // 27 Sep (doy 270): first autumn frost
    tmin[300] = -5;
    const s = { start: "2021-01-01", end: "2021-12-31", tmin, tmax: [], prcp: [] } as unknown as PowerSeries;
    expect(frostFreeByYear(s)).toEqual([{ year: 2021, lastSpringFrost: 130, firstAutumnFrost: 270, frostFreeDays: 139 }]);
  });
  it("counts a year with no spring frost from 1 January and no autumn frost to 31 December", () => {
    const tmin: (number | null)[] = Array(365).fill(5);
    tmin[269] = -1; // only an autumn frost, doy 270
    const s = { start: "2021-01-01", end: "2021-12-31", tmin, tmax: [], prcp: [] } as unknown as PowerSeries;
    expect(frostFreeByYear(s)[0]).toEqual({ year: 2021, lastSpringFrost: null, firstAutumnFrost: 270, frostFreeDays: 269 });
    const warm = { ...s, tmin: Array(365).fill(5) } as unknown as PowerSeries;
    expect(frostFreeByYear(warm)[0]!.frostFreeDays).toBe(365);
  });
  it("skips incomplete years", () => {
    const s = { start: "2021-01-01", end: "2021-12-30", tmin: Array(364).fill(5), tmax: [], prcp: [] } as unknown as PowerSeries;
    expect(frostFreeByYear(s)).toEqual([]);
  });
});

describe("evaluate", () => {
  it("counts years where the shortest FAO growing period fits", () => {
    const e = evaluate(["wheat", "pea", "rapeseed"], ffy([100, 119, 120, 130]));
    expect(e.fits.map((f) => f.fitsYears)).toEqual([2, 4, null]); // wheat >=120, pea >=90, rapeseed: no FAO period
    expect(e.legumes.map((c) => c.id)).toEqual(["pea"]);
    expect(e.waterMissing.map((c) => c.id)).toEqual(["rapeseed"]);
    expect(e.waterMeanMm).toBe((550 + 425) / 2);
    expect(e.mixesRoots).toBe(false); // pea 0.6-1.0 overlaps wheat 1.0-1.5 at 1.0
  });
  it("uses the farmer's days from sowing to harvest instead of the FAO guide", () => {
    const years = ffy([100, 119, 120, 130]);
    expect(evaluate(["wheat"], years).fits[0]).toMatchObject({ days: 120, daysSource: "FAO", fitsYears: 2 });
    expect(evaluate(["wheat"], years, { wheat: 100 }).fits[0]).toMatchObject({ days: 100, daysSource: "farmer", fitsYears: 4 });
    // A crop with no FAO period becomes checkable once the farmer gives a value.
    expect(evaluate(["rapeseed"], years).fits[0]!.fitsYears).toBeNull();
    expect(evaluate(["rapeseed"], years, { rapeseed: 110 }).fits[0]!.fitsYears).toBe(3);
    expect(evaluate(["fallow"], years, { fallow: 10 }).fits[0]!.days).toBeNull();
  });
  it("detects a shallow and deep root mix", () => {
    expect(evaluate(["lentil", "wheat"], ffy([130])).mixesRoots).toBe(true); // 0.6-0.8 vs 1.0-1.5
  });
});

describe("buildOptions", () => {
  const years = ffy([130, 140, 150]);
  it("puts a legume after a cereal and does not repeat pea in other options", () => {
    // All crops fit every year and no non-legume needs less water: the legume option first, then the family fallback.
    const o = buildOptions(["wheat", "wheat", "barley"], "soil", years);
    expect(o.map((x) => x.kind)).toEqual(["current", "legume", "family"]);
    expect(o[1]!.cropIds).toEqual(["wheat", "pea", "barley"]); // wheat after wheat replaced
    expect(o[1]!.water).toBe("less");
  });
  it("offers a shorter-season crop only if the whole rotation then fits more often", () => {
    const short = ffy([110, 125, 140]); // wheat (>=120) fits 2 of 3, millet (>=105) fits 3, sunflower (>=125) 2
    // Wheat repeated: swapping one wheat does not help the rotation, so no season option.
    expect(buildOptions(["wheat", "wheat", "barley"], "soil", short).map((x) => x.kind)).not.toContain("season");
    const o = buildOptions(["pea", "flax", "pea"], "soil", short); // flax (>=150) fits 0
    const season = o.find((x) => x.kind === "season")!;
    expect(season.change!.from.crop.id).toBe("flax");
    const min = (x: typeof season) => Math.min(...x.evaluation.fits.map((f) => f.fitsYears ?? Infinity));
    expect(min(season)).toBeGreaterThan(min(o[0]!));
  });
  it("season rule never repeats a neighbouring crop", () => {
    // Rapeseed with a long farmer value fits rarely; wheat would fit more often but sits next to it.
    const short = ffy([110, 125, 140]);
    const o = buildOptions(["wheat", "wheat", "rapeseed"], "soil", short, { wheat: 100, rapeseed: 150 });
    const season = o.find((x) => x.kind === "season");
    // Either no season option, or one that does not put wheat next to wheat.
    if (season) expect(season.change!.to.crop.id).not.toBe("wheat");
  });
  it("orders by priority", () => {
    expect(buildOptions(["wheat", "sunflower", "barley"], "water", years).map((x) => x.kind)).toEqual(["current", "water", "legume"]);
  });
  it("replaces the thirstiest crop for the water option", () => {
    const o = buildOptions(["wheat", "sunflower", "barley"], "water", years);
    expect(o[1]!.change).toMatchObject({ index: 1 });
    expect(o[1]!.change!.from.crop.id).toBe("sunflower");
  });
  it("skips the legume option when a legume is already there", () => {
    // Lentil (>=150 days) fits 1 of 3 years, so the season rule swaps it for pea.
    const o = buildOptions(["wheat", "lentil", "barley"], "soil", years);
    expect(o.map((x) => x.kind)).toEqual(["current", "season", "water"]);
    expect(o[1]!.cropIds).toEqual(["wheat", "pea", "barley"]);
  });
  it("flags legumesExcluded only when a separate legume option exists", () => {
    const withLegumeOption = buildOptions(["wheat", "sunflower", "barley"], "water", years);
    expect(withLegumeOption.find((x) => x.kind === "water")!.legumesExcluded).toBe(true);
    const alreadyLegume = buildOptions(["wheat", "lentil", "barley"], "soil", years);
    expect(alreadyLegume.filter((x) => x.kind !== "current").every((x) => !x.legumesExcluded)).toBe(true);
  });
  it("says unknown water when the swapped crop has no FAO water value", () => {
    // Lentil has no FAO water value, so swapping it for pea cannot be called "less water".
    const o = buildOptions(["wheat", "lentil", "barley"], "soil", years);
    const season = o.find((x) => x.kind === "season")!;
    expect(season.change!.from.crop.id).toBe("lentil");
    expect(season.water).toBe("unknown");
  });
  it("gives the current rotation plus 2 alternatives for the common wheat-wheat-barley and wheat-only cases", () => {
    for (const rot of [["wheat", "wheat", "barley"], ["wheat", "wheat", "wheat"], ["barley", "oats", "wheat"]]) {
      const o = buildOptions(rot, "soil", years);
      expect(o).toHaveLength(3);
      expect(new Set(o.map((x) => x.cropIds.join()))).toHaveProperty("size", 3);
    }
    const o = buildOptions(["wheat", "wheat", "wheat"], "soil", years);
    const fam = o.find((x) => x.kind === "family")!;
    expect(fam.change!.to.crop.group).not.toBe("cereal");
    expect(fam.change!.to.crop.group).not.toBe("legume"); // legumes have their own option
  });
  it("has no water option when no crop has a FAO water value", () => {
    const o = buildOptions(["flax", "rapeseed", "fallow"], "soil", years);
    expect(o.map((x) => x.kind)).not.toContain("water");
  });
});
