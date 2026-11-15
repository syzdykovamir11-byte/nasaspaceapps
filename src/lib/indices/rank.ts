export type Level = "unusual" | "watch" | "normal";

/**
 * Traffic-light cut-offs. Team decision, not an agronomic threshold:
 * a season is "unusual" if it is among the worst 10% of this place's other seasons,
 * "watch" if among the worst 25%.
 */
export const CUTOFFS = { unusual: 0.1, watch: 0.25 } as const;

export interface Ranking {
  value: number;
  /** Number of past seasons compared against. */
  pastCount: number;
  /** Past seasons with a value as bad or worse than the latest (>= when higher is worse). */
  asBadOrWorse: number;
  /** Median of past seasons. */
  pastMedian: number;
  pastMin: number;
  pastMax: number;
  level: Level;
}

export function median(xs: number[]): number {
  if (xs.length === 0) throw new Error("median of empty list");
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2;
}

/** Same as rankHigherIsWorse, but a lower value is worse (e.g. drier soil). asBadOrWorse counts past values <= value. */
export function rankLowerIsWorse(value: number, past: number[]): Ranking {
  const r = rankHigherIsWorse(-value, past.map((p) => -p));
  return { ...r, value, pastMedian: median(past), pastMin: Math.min(...past), pastMax: Math.max(...past) };
}

/** Ranks a value against past values where a higher value is worse. Ties count as "as bad", which makes the label more cautious. */
export function rankHigherIsWorse(value: number, past: number[]): Ranking {
  if (past.length === 0) throw new Error("No past seasons to compare with.");
  const asBadOrWorse = past.filter((p) => p >= value).length;
  const share = asBadOrWorse / past.length;
  const level: Level = share <= CUTOFFS.unusual ? "unusual" : share <= CUTOFFS.watch ? "watch" : "normal";
  return {
    value,
    pastCount: past.length,
    asBadOrWorse,
    pastMedian: median(past),
    pastMin: Math.min(...past),
    pastMax: Math.max(...past),
    level,
  };
}
