import type { PowerSeries } from "@/lib/power/types";
import { median } from "./rank";

const DAY_MS = 86_400_000;

export interface MonthStat {
  month: number; // 1-12
  /** Share of years (0-1) with at least one day of T2M_MIN < 0 °C in this month. */
  frostShare: number;
  /** Median over years of the month's total PRECTOTCORR, mm. */
  medianPrecipMm: number;
}

export interface MonthStrip {
  firstYear: number;
  lastYear: number;
  years: number;
  months: MonthStat[];
}

/**
 * Typical year at a point from complete calendar years only (no fill values in any month).
 * Returns null if there is no complete year.
 */
export function monthStrip(series: PowerSeries): MonthStrip | null {
  const t0 = Date.parse(`${series.start}T00:00:00Z`);
  const tEnd = Date.parse(`${series.end}T00:00:00Z`);
  const first = Number(series.start.slice(0, 4));
  const last = Number(series.end.slice(0, 4));
  const perYear: { frost: boolean[]; precip: number[] }[] = [];
  let firstYear = 0;
  let lastYear = 0;
  for (let y = first; y <= last; y++) {
    if (Date.UTC(y, 0, 1) < t0 || Date.UTC(y, 11, 31) > tEnd) continue;
    const frost = Array<boolean>(12).fill(false);
    const precip = Array<number>(12).fill(0);
    let ok = true;
    for (let t = Date.UTC(y, 0, 1); t <= Date.UTC(y, 11, 31); t += DAY_MS) {
      const i = Math.round((t - t0) / DAY_MS);
      const m = new Date(t).getUTCMonth();
      const tmin = series.tmin[i];
      const p = series.prcp[i];
      if (tmin === null || tmin === undefined || p === null || p === undefined) {
        ok = false;
        break;
      }
      if (tmin < 0) frost[m] = true;
      precip[m]! += p;
    }
    if (!ok) continue;
    if (!perYear.length) firstYear = y;
    lastYear = y;
    perYear.push({ frost, precip });
  }
  if (!perYear.length) return null;
  return {
    firstYear,
    lastYear,
    years: perYear.length,
    months: [...Array(12).keys()].map((m) => ({
      month: m + 1,
      frostShare: perYear.filter((y) => y.frost[m]).length / perYear.length,
      medianPrecipMm: median(perYear.map((y) => y.precip[m]!)),
    })),
  };
}
