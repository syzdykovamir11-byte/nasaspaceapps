import type { PowerSeries } from "@/lib/power/types";

const DAY_MS = 86_400_000;

export interface FrostFreeYear {
  year: number;
  /** Day of year (1-based) of the last day with Tmin < 0 °C before 15 July, or null if there was none. */
  lastSpringFrost: number | null;
  /** Day of year of the first day with Tmin < 0 °C from 15 July on, or null if none in the data. */
  firstAutumnFrost: number | null;
  /**
   * Days strictly between the two frosts. With no spring frost the season is counted from 1 January,
   * with no autumn frost to 31 December.
   */
  frostFreeDays: number;
}

const doy = (t: number, year: number) => Math.round((t - Date.UTC(year, 0, 1)) / DAY_MS) + 1;

/**
 * Frost-free season per year from daily minimum temperature (T2M_MIN < 0 °C counts as frost).
 * Mid-year split at 15 July is a team choice to separate spring and autumn frosts.
 * Years are used only if the whole year is in the data and has no fill values.
 */
export function frostFreeByYear(series: PowerSeries): FrostFreeYear[] {
  const t0 = Date.parse(`${series.start}T00:00:00Z`);
  const tEnd = Date.parse(`${series.end}T00:00:00Z`);
  const first = Number(series.start.slice(0, 4));
  const last = Number(series.end.slice(0, 4));
  const out: FrostFreeYear[] = [];
  for (let y = first; y <= last; y++) {
    const a = Date.UTC(y, 0, 1);
    const b = Date.UTC(y, 11, 31);
    if (a < t0 || b > tEnd) continue;
    const split = Date.UTC(y, 6, 15);
    let lastSpring: number | null = null;
    let firstAutumn: number | null = null;
    let complete = true;
    for (let t = a; t <= b; t += DAY_MS) {
      const v = series.tmin[Math.round((t - t0) / DAY_MS)];
      if (v === null || v === undefined) {
        complete = false;
        break;
      }
      if (v < 0) {
        if (t < split) lastSpring = doy(t, y);
        else if (firstAutumn === null) firstAutumn = doy(t, y);
      }
    }
    if (!complete) continue;
    out.push({
      year: y,
      lastSpringFrost: lastSpring,
      firstAutumnFrost: firstAutumn,
      frostFreeDays: (firstAutumn ?? doy(b, y) + 1) - (lastSpring ?? 0) - 1,
    });
  }
  return out;
}
