import type { FrostFreeYear } from "./frost";

export interface FrostDates {
  years: number;
  /** Median day of year of the last spring frost (years without one count as day 0). */
  springMedian: number;
  /** In 9 of 10 years the last spring frost was on or before this day of year. */
  spring9of10: number;
  /** Median day of year of the first autumn frost (years without one count as 366/367). */
  autumnMedian: number;
  /** In 9 of 10 years the first autumn frost came on or after this day of year. */
  autumn9of10: number;
}

/** Nearest-rank percentile (p in 0..1) of a sorted list. */
function rankPct(sorted: number[], p: number): number {
  const i = Math.min(sorted.length - 1, Math.max(0, Math.ceil(p * sorted.length) - 1));
  return sorted[i]!;
}

export function frostDates(ffy: FrostFreeYear[]): FrostDates | null {
  if (!ffy.length) return null;
  const spring = ffy.map((y) => y.lastSpringFrost ?? 0).sort((a, b) => a - b);
  const autumn = ffy
    .map((y) => y.firstAutumnFrost ?? (y.year % 4 === 0 && (y.year % 100 !== 0 || y.year % 400 === 0) ? 367 : 366))
    .sort((a, b) => a - b);
  const med = (s: number[]) => rankPct(s, 0.5);
  return {
    years: ffy.length,
    springMedian: med(spring),
    spring9of10: rankPct(spring, 0.9),
    autumnMedian: med(autumn),
    // 9 of 10 years had their first autumn frost on or after the 10th percentile.
    autumn9of10: rankPct(autumn, 0.1),
  };
}

/** "18 May" for a day of year, in a non-leap reference year. */
export function formatDoy(doy: number): string {
  if (doy <= 0) return "before 1 Jan";
  if (doy > 365) return "after 31 Dec";
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(
    new Date(Date.UTC(2001, 0, doy)),
  );
}
