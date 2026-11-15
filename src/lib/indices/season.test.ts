import { describe, expect, it } from "vitest";
import type { PowerSeries } from "@/lib/power/types";
import { rankHigherIsWorse, rankLowerIsWorse, median } from "./rank";
import { consecutiveDryDays, frostDays, seasonIndicesByYear, seasonRange, sliceComplete } from "./season";

describe("consecutiveDryDays (CDD, < 1 mm)", () => {
  it("finds the longest run", () => {
    expect(consecutiveDryDays([0, 0.5, 2, 0, 0, 0, 1, 0])).toBe(3);
  });
  it("treats exactly 1 mm as a wet day", () => {
    expect(consecutiveDryDays([0.99, 1, 0.99])).toBe(1);
  });
  it("is 0 for all wet days and n for all dry days", () => {
    expect(consecutiveDryDays([5, 5])).toBe(0);
    expect(consecutiveDryDays([0, 0, 0])).toBe(3);
  });
});

describe("frostDays (FD, Tmin < 0 °C)", () => {
  it("counts strictly below zero", () => {
    expect(frostDays([-0.1, 0, 0.1, -5])).toBe(2);
  });
});

describe("seasonRange", () => {
  const s = { start: "2020-01-01", end: "2021-12-31" };
  it("maps 1 Apr–30 Sep to indices (2020 is a leap year)", () => {
    // 2020-04-01 is day 31+29+31 = 91 from 2020-01-01; season has 183 days.
    expect(seasonRange(s, 2020)).toEqual({ from: 91, to: 91 + 182 });
  });
  it("returns null when the season is not fully covered", () => {
    expect(seasonRange({ start: "2020-05-01", end: "2021-12-31" }, 2020)).toBeNull();
    expect(seasonRange({ start: "2020-01-01", end: "2021-09-29" }, 2021)).toBeNull();
  });
});

describe("sliceComplete", () => {
  it("rejects a range with a fill value", () => {
    expect(sliceComplete([1, null, 3], { from: 0, to: 2 })).toBeNull();
    expect(sliceComplete([1, null, 3], { from: 2, to: 2 })).toEqual([3]);
  });
});

describe("seasonIndicesByYear", () => {
  it("skips seasons with fill values", () => {
    const days = 366 + 365; // 2020 + 2021
    const series = {
      start: "2020-01-01",
      end: "2021-12-31",
      tmax: Array(days).fill(10),
      tmin: Array(days).fill(-1),
      prcp: Array(days).fill(0),
    } as unknown as PowerSeries;
    // 2021 season covers indices 456..638 (2021-04-01 = 366 + 90).
    series.prcp[400] = null; // outside any season: must not matter
    series.prcp[500] = null; // inside the 2021 season: 2021 is skipped
    const r = seasonIndicesByYear(series);
    expect(r.map((x) => x.year)).toEqual([2020]);
    expect(r[0]).toEqual({ year: 2020, cdd: 183, fd: 183, soil: null });
  });
  it("averages root-zone soil wetness over the season when present", () => {
    const days = 366;
    const series = {
      start: "2020-01-01",
      end: "2020-12-31",
      tmax: Array(days).fill(10),
      tmin: Array(days).fill(5),
      prcp: Array(days).fill(2),
      soil: Array(days).fill(0.5),
    } as unknown as PowerSeries;
    series.soil![91] = 0.683; // first season day
    expect(seasonIndicesByYear(series)[0]!.soil).toBe(0.5); // (0.683 + 182 × 0.5) / 183 = 0.501 → 0.50
  });
});

describe("rankLowerIsWorse (soil wetness)", () => {
  const past = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];
  it("labels the driest season unusual and keeps real values", () => {
    const r = rankLowerIsWorse(0.05, past);
    expect(r.level).toBe("unusual");
    expect([r.value, r.pastMin, r.pastMax, r.pastMedian]).toEqual([0.05, 0.1, 1.0, 0.55]);
    expect(rankLowerIsWorse(0.2, past).level).toBe("watch"); // 0.1 and 0.2 are as dry or drier: 20%
    expect(rankLowerIsWorse(0.3, past).level).toBe("normal");
  });
});

describe("rankHigherIsWorse", () => {
  const past = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  it("labels a new record as unusual", () => {
    const r = rankHigherIsWorse(11, past);
    expect(r.asBadOrWorse).toBe(0);
    expect(r.level).toBe("unusual");
  });
  it("counts ties as as-bad (cautious)", () => {
    expect(rankHigherIsWorse(10, past).asBadOrWorse).toBe(1); // 10% -> unusual
    expect(rankHigherIsWorse(10, past).level).toBe("unusual");
    expect(rankHigherIsWorse(9, past).level).toBe("watch"); // 20%
    expect(rankHigherIsWorse(8, past).level).toBe("normal"); // 30%
  });
  it("reports median and range", () => {
    const r = rankHigherIsWorse(5, past);
    expect([r.pastMedian, r.pastMin, r.pastMax]).toEqual([5.5, 1, 10]);
    expect(median([3, 1, 2])).toBe(2);
  });
});
