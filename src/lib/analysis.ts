// Turns NASA POWER daily values into season indicators.
// Indicator definitions follow ETCCDI (https://etccdi.pacificclimate.org/list_27_indices.shtml):
//   FD     days with daily minimum temperature below 0 °C
//   CDD    longest run of days with precipitation below 1 mm
//   TX90p  share of days with daily maximum above the 90th percentile for that calendar day
//          (5-day window, base period 1991-2020: team decision)
//   Rx1day largest 1-day precipitation
//   R20mm  days with precipitation of 20 mm or more
// Status colours rank the latest season against the same place's own past seasons
// (PROJECT_RISKS_AND_UI.md section 4.4). They mean "unusual for this place", not "crop damage".

import type { DailySeries } from "./power";

export type Status = "red" | "amber" | "green";

export type Day = {
  y: number;
  m: number; // 1-12
  d: number;
  key: number; // calendar-day index 0..364, Feb 29 folded into Feb 28
  tmax: number | null;
  tmin: number | null;
  p: number | null;
};

export type Season = {
  year: number; // year the season ends in
  start: Date;
  end: Date;
  days: Day[];
  fd: number;
  cdd: number;
  rain: number;
  rx1day: number;
  r20: number;
  tx90p: number; // percent
};

export type Ranked = {
  value: number;
  status: Status;
  worseCount: number; // past seasons strictly worse than the latest one
  pastCount: number;
};

export type MonthClimate = {
  month: number; // 1-12
  frostShare: number; // share of years with at least one frost day in this month
  rainMean: number; // mm
};

export type Analysis = {
  hemisphere: "north" | "south";
  latest: Season;
  past: Season[];
  firstYear: number;
  dry: { cdd: Ranked; rain: Ranked; status: Status };
  heat: { tx90p: Ranked; status: Status };
  frost: {
    fd: Ranked;
    status: Status;
    lastSpring: Date | null;
    firstAutumn: Date | null;
    medianLastSpring: Date | null; // shown as day and month only
    medianFirstAutumn: Date | null;
    medianFrostFreeDays: number;
  };
  rain: { rx1day: Ranked; r20: Ranked; status: Status };
  months: MonthClimate[];
  annualRainMean: number;
  baseYears: [number, number];
};

const CUM = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
const calKey = (m: number, d: number) => CUM[m - 1] + Math.min(d, m === 2 ? 28 : 31) - 1;

export function parseDays(s: DailySeries): Day[] {
  return s.dates.map((ds, i) => {
    const y = +ds.slice(0, 4);
    const m = +ds.slice(4, 6);
    const d = +ds.slice(6, 8);
    return { y, m, d, key: calKey(m, d), tmax: s.tmax[i], tmin: s.tmin[i], p: s.prec[i] };
  });
}

// Season window (team decision, PROJECT_RISKS_AND_UI.md 4.2): April-September in the north,
// October-March in the south. Must be confirmed with an agronomist for the region.
export function seasonBounds(year: number, hemisphere: "north" | "south") {
  return hemisphere === "north"
    ? { start: new Date(Date.UTC(year, 3, 1)), end: new Date(Date.UTC(year, 8, 30)) }
    : { start: new Date(Date.UTC(year - 1, 9, 1)), end: new Date(Date.UTC(year, 2, 31)) };
}

// Latest season that has ended at least 10 days ago (POWER has a short delay).
export function latestSeasonYear(today: Date, hemisphere: "north" | "south") {
  const y = today.getUTCFullYear();
  for (const year of [y, y - 1]) {
    const { end } = seasonBounds(year, hemisphere);
    if (today.getTime() - end.getTime() >= 10 * 86400000) return year;
  }
  return y - 2;
}

export const fmt = (d: Date) =>
  `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;

const dayTime = (x: Day) => Date.UTC(x.y, x.m - 1, x.d);

function percentile(sorted: number[], q: number) {
  if (!sorted.length) return NaN;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

function tx90Thresholds(days: Day[], base: [number, number]) {
  const buckets: number[][] = Array.from({ length: 365 }, () => []);
  for (const x of days) {
    if (x.y < base[0] || x.y > base[1] || x.tmax == null) continue;
    for (let o = -2; o <= 2; o++) buckets[(x.key + o + 365) % 365].push(x.tmax);
  }
  return buckets.map((b) => percentile(b.sort((a, c) => a - c), 0.9));
}

function seasonIndices(days: Day[], thr: number[]) {
  let fd = 0, cdd = 0, run = 0, rain = 0, rx1day = 0, r20 = 0, hot = 0, tdays = 0;
  for (const x of days) {
    if (x.tmin != null && x.tmin < 0) fd++;
    if (x.p == null) {
      run = 0;
    } else {
      rain += x.p;
      rx1day = Math.max(rx1day, x.p);
      if (x.p >= 20) r20++;
      run = x.p < 1 ? run + 1 : 0;
      cdd = Math.max(cdd, run);
    }
    if (x.tmax != null && !Number.isNaN(thr[x.key])) {
      tdays++;
      if (x.tmax > thr[x.key]) hot++;
    }
  }
  return { fd, cdd, rain, rx1day, r20, tx90p: tdays ? (100 * hot) / tdays : 0 };
}

// Mid-rank: ties count as half worse, so a value shared by every season reads as "normal".
export function rank(latest: number, past: number[], higherIsWorse: boolean): Ranked {
  const worse = past.filter((v) => (higherIsWorse ? v > latest : v < latest)).length;
  const equal = past.filter((v) => v === latest).length;
  const share = past.length ? (worse + equal / 2) / past.length : 1;
  const status: Status = share <= 0.1 ? "red" : share <= 0.25 ? "amber" : "green";
  return { value: latest, status, worseCount: worse, pastCount: past.length };
}

const ORDER: Status[] = ["green", "amber", "red"];
const worst = (...s: Status[]) => s.reduce((a, b) => (ORDER.indexOf(b) > ORDER.indexOf(a) ? b : a));

function median(xs: number[]) {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? percentile(s, 0.5) : NaN;
}

// Frost dates per "frost year". North: Jan-Jul is spring, Aug-Dec is autumn.
// South: Jul-Jan is spring, Feb-Jun is autumn.
function frostDates(days: Day[], hemisphere: "north" | "south") {
  const anchor = hemisphere === "north" ? 1 : 7; // month the frost year starts
  const years = new Map<number, Day[]>();
  for (const x of days) {
    const fy = x.m >= anchor ? x.y : x.y - 1;
    if (!years.has(fy)) years.set(fy, []);
    years.get(fy)!.push(x);
  }
  const out: { fy: number; last: Day | null; first: Day | null; free: number; start: number }[] = [];
  for (const [fy, list] of years) {
    if (list.length < 360) continue; // incomplete frost year
    const startT = Date.UTC(fy, anchor - 1, 1);
    const splitT = Date.UTC(fy, anchor - 1 + 7, 1);
    const endT = Date.UTC(fy + 1, anchor - 1, 1);
    let last: Day | null = null;
    let first: Day | null = null;
    for (const x of list) {
      if (x.tmin == null || x.tmin >= 0) continue;
      const t = dayTime(x);
      if (t < splitT) last = x;
      else if (!first) first = x;
    }
    const a = last ? dayTime(last) : startT - 86400000;
    const b = first ? dayTime(first) : endT;
    out.push({ fy, last, first, free: Math.round((b - a) / 86400000) - 1, start: startT });
  }
  return out;
}

const offsetDays = (x: Day, startT: number) => (dayTime(x) - startT) / 86400000;

function dateFromOffset(offset: number, refYear: number, anchor: number) {
  return new Date(Date.UTC(refYear, anchor - 1, 1) + Math.round(offset) * 86400000);
}

export function analyse(series: DailySeries, today = new Date()): Analysis {
  const hemisphere = series.lat >= 0 ? "north" : "south";
  const days = parseDays(series);
  const base: [number, number] = [1991, 2020];
  const thr = tx90Thresholds(days, base);
  const latestYear = latestSeasonYear(today, hemisphere);

  const seasons: Season[] = [];
  for (let year = days[0].y + (hemisphere === "south" ? 1 : 0); year <= latestYear; year++) {
    const { start, end } = seasonBounds(year, hemisphere);
    const s = start.getTime();
    const e = end.getTime();
    const list = days.filter((x) => {
      const t = dayTime(x);
      return t >= s && t <= e;
    });
    const expected = Math.round((e - s) / 86400000) + 1;
    const valid = list.filter((x) => x.p != null && x.tmin != null && x.tmax != null).length;
    if (valid < expected * 0.9) continue;
    seasons.push({ year, start, end, days: list, ...seasonIndices(list, thr) });
  }
  if (seasons.length < 11) throw new Error("Not enough NASA POWER history for this place");

  const latest = seasons[seasons.length - 1];
  const past = seasons.slice(0, -1);
  const col = (k: keyof Season) => past.map((s) => s[k] as number);

  const cdd = rank(latest.cdd, col("cdd"), true);
  const rainR = rank(latest.rain, col("rain"), false);
  const tx = rank(latest.tx90p, col("tx90p"), true);
  const fd = rank(latest.fd, col("fd"), true);
  const rx = rank(latest.rx1day, col("rx1day"), true);
  const r20 = rank(latest.r20, col("r20"), true);

  // Frost dates
  const anchor = hemisphere === "north" ? 1 : 7;
  const fdates = frostDates(days, hemisphere);
  const latestFrostYear = hemisphere === "north" ? latest.year : latest.year - 1;
  const lf = fdates.find((f) => f.fy === latestFrostYear);
  const lastOffsets = fdates.filter((f) => f.last).map((f) => offsetDays(f.last!, f.start));
  const firstOffsets = fdates.filter((f) => f.first).map((f) => offsetDays(f.first!, f.start));
  const refYear = 2001; // any non-leap year, only day and month are shown
  const toDate = (d: Day | null | undefined) => (d ? new Date(dayTime(d)) : null);

  // Month climate from complete calendar years
  const byYearMonth = new Map<string, { frost: boolean; rain: number; n: number }>();
  for (const x of days) {
    const k = `${x.y}-${x.m}`;
    const v = byYearMonth.get(k) ?? { frost: false, rain: 0, n: 0 };
    if (x.tmin != null && x.tmin < 0) v.frost = true;
    if (x.p != null) v.rain += x.p;
    v.n++;
    byYearMonth.set(k, v);
  }
  const fullYears = [...new Set(days.map((x) => x.y))].filter(
    (y) => days.filter((x) => x.y === y).length >= 365,
  );
  const months: MonthClimate[] = Array.from({ length: 12 }, (_, i) => {
    const vals = fullYears.map((y) => byYearMonth.get(`${y}-${i + 1}`)).filter(Boolean) as {
      frost: boolean;
      rain: number;
    }[];
    return {
      month: i + 1,
      frostShare: vals.length ? vals.filter((v) => v.frost).length / vals.length : 0,
      rainMean: vals.length ? vals.reduce((a, v) => a + v.rain, 0) / vals.length : 0,
    };
  });

  return {
    hemisphere,
    latest,
    past,
    firstYear: seasons[0].year,
    dry: { cdd, rain: rainR, status: worst(cdd.status, rainR.status) },
    heat: { tx90p: tx, status: tx.status },
    frost: {
      fd,
      status: fd.status,
      lastSpring: toDate(lf?.last),
      firstAutumn: toDate(lf?.first),
      medianLastSpring: lastOffsets.length ? dateFromOffset(median(lastOffsets), refYear, anchor) : null,
      medianFirstAutumn: firstOffsets.length ? dateFromOffset(median(firstOffsets), refYear, anchor) : null,
      medianFrostFreeDays: Math.round(median(fdates.map((f) => f.free))),
    },
    rain: { rx1day: rx, r20, status: worst(rx.status, r20.status) },
    months,
    annualRainMean: months.reduce((a, m) => a + m.rainMean, 0),
    baseYears: base,
  };
}

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const dayMonth = (d: Date | null) =>
  d ? `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}` : "none";
