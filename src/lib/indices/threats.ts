import type { PowerSeries } from "@/lib/power/types";
import { rankHigherIsWorse, rankLowerIsWorse, type Ranking } from "./rank";
import { DEFAULT_SEASON, seasonIndicesByYear, type SeasonIndices, type SeasonWindow } from "./season";

export type ThreatId = "dry" | "frost" | "soil";

export interface ThreatResult {
  id: ThreatId;
  ranking: Ranking;
  /** 1 = the worst season on record (highest value); ties share a rank. */
  rank: number;
  /** Number of seasons in the ranking, including the chosen one. */
  rankOf: number;
  /** Other seasons with exactly the same value. */
  tiedWith: number;
  /** The index value for every complete season, oldest first, for the history chart. */
  history: { year: number; value: number }[];
}

export interface SeasonSummary {
  /** The season being shown. */
  year: number;
  /** All complete seasons in the data, oldest first. */
  years: number[];
  /** The other seasons it is compared with. */
  firstOtherYear: number;
  lastOtherYear: number;
  window: SeasonWindow;
  threats: ThreatResult[];
}

const VALUE: Record<ThreatId, (s: SeasonIndices) => number> = {
  dry: (s) => s.cdd,
  frost: (s) => s.fd,
  soil: (s) => s.soil ?? Number.NaN,
};

/** For soil wetness a lower value is worse (drier); for the other indices a higher value is worse. */
const LOWER_IS_WORSE: Record<ThreatId, boolean> = { dry: false, frost: false, soil: true };

/**
 * One season compared with every other complete season at the same point.
 * Defaults to the latest complete season, which is then compared with all earlier ones.
 */
export function summarizeSeason(series: PowerSeries, year?: number, win: SeasonWindow = DEFAULT_SEASON): SeasonSummary | null {
  const all = seasonIndicesByYear(series, win);
  if (all.length < 2) return null;
  const chosen = year === undefined ? all[all.length - 1] : all.find((s) => s.year === year);
  if (!chosen) return null;
  const others = all.filter((s) => s.year !== chosen.year);
  // The soil card is shown only when every season has soil data (older snapshots have none).
  const ids = (Object.keys(VALUE) as ThreatId[]).filter((id) => id !== "soil" || all.every((s) => s.soil !== null));
  const threats = ids.map((id) => {
    const v = VALUE[id];
    const value = v(chosen);
    const otherValues = others.map(v);
    const lower = LOWER_IS_WORSE[id];
    return {
      id,
      ranking: lower ? rankLowerIsWorse(value, otherValues) : rankHigherIsWorse(value, otherValues),
      rank: 1 + otherValues.filter((o) => (lower ? o < value : o > value)).length,
      rankOf: all.length,
      tiedWith: otherValues.filter((o) => o === value).length,
      history: all.map((s) => ({ year: s.year, value: v(s) })),
    };
  });
  return {
    year: chosen.year,
    years: all.map((s) => s.year),
    firstOtherYear: others[0]!.year,
    lastOtherYear: others[others.length - 1]!.year,
    window: win,
    threats,
  };
}

/** Kept for the existing tests: the latest season against all earlier ones. */
export const summarizeLatestSeason = (series: PowerSeries, win: SeasonWindow = DEFAULT_SEASON) => summarizeSeason(series, undefined, win);
