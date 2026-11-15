import type { PowerSeries } from "@/lib/power/types";

const DAY_MS = 86_400_000;

/** Growing-season window. Team decision for northern Kazakhstan: 1 April to 30 September. Not verified by an agronomist. */
export interface SeasonWindow {
  startMonth: number; // 1-12
  startDay: number;
  endMonth: number;
  endDay: number;
}

export const DEFAULT_SEASON: SeasonWindow = { startMonth: 4, startDay: 1, endMonth: 9, endDay: 30 };

const utc = (y: number, m: number, d: number) => Date.UTC(y, m - 1, d);
const parseIso = (iso: string) => Date.parse(`${iso}T00:00:00Z`);

/** Inclusive array index range of the season in a given year, or null if the series does not fully cover it. */
export function seasonRange(series: Pick<PowerSeries, "start" | "end">, year: number, win: SeasonWindow = DEFAULT_SEASON) {
  const t0 = parseIso(series.start);
  const tEnd = parseIso(series.end);
  const a = utc(year, win.startMonth, win.startDay);
  const b = utc(year, win.endMonth, win.endDay);
  if (a < t0 || b > tEnd) return null;
  return { from: Math.round((a - t0) / DAY_MS), to: Math.round((b - t0) / DAY_MS) };
}

/** Values in the range, or null if any day is a POWER fill value (the season is then not used). */
export function sliceComplete(arr: (number | null)[], r: { from: number; to: number }): number[] | null {
  const out: number[] = [];
  for (let i = r.from; i <= r.to; i++) {
    const v = arr[i];
    if (v === null || v === undefined) return null;
    out.push(v);
  }
  return out;
}

/**
 * CDD (ETCCDI): largest number of consecutive days with precipitation < 1 mm.
 * Computed here within the season only, so runs are cut at the season edges.
 */
export function consecutiveDryDays(prcp: number[], thresholdMm = 1): number {
  let best = 0;
  let run = 0;
  for (const v of prcp) {
    run = v < thresholdMm ? run + 1 : 0;
    if (run > best) best = run;
  }
  return best;
}

/** FD (ETCCDI): count of days with daily minimum temperature < 0 °C. Counted here within the season only. */
export function frostDays(tmin: number[]): number {
  return tmin.reduce((n, v) => (v < 0 ? n + 1 : n), 0);
}

export interface SeasonIndices {
  year: number;
  cdd: number;
  fd: number;
  /** Mean root-zone soil wetness (GWETROOT, 0-1) over the season, 2 decimals. null if there is no soil data. */
  soil: number | null;
}

/** Mean of the season's daily values, rounded to 2 decimals like the POWER values themselves. */
export function seasonMean(xs: number[]): number {
  return Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 100) / 100;
}

/** Index values for every season fully covered by the series with no fill values. */
export function seasonIndicesByYear(series: PowerSeries, win: SeasonWindow = DEFAULT_SEASON): SeasonIndices[] {
  const first = Number(series.start.slice(0, 4));
  const last = Number(series.end.slice(0, 4));
  const out: SeasonIndices[] = [];
  for (let y = first; y <= last; y++) {
    const r = seasonRange(series, y, win);
    if (!r) continue;
    const prcp = sliceComplete(series.prcp, r);
    const tmin = sliceComplete(series.tmin, r);
    if (!prcp || !tmin) continue;
    const soil = series.soil ? sliceComplete(series.soil, r) : null;
    out.push({ year: y, cdd: consecutiveDryDays(prcp), fd: frostDays(tmin), soil: soil ? seasonMean(soil) : null });
  }
  return out;
}
