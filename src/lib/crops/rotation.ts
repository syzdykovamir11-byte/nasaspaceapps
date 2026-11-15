import { CROP_BY_ID, mid, type Crop } from "./crops";
import type { FrostFreeYear } from "./frost";

export type Priority = "soil" | "water";
export type OptionKind = "current" | "legume" | "water" | "season" | "family";

/** Days from sowing to harvest entered by the farmer, by crop id. They override the FAO guide value. */
export type FarmerDays = Readonly<Record<string, number>>;

export interface CropFit {
  crop: Crop;
  /** Days from sowing to harvest used for the check. null if neither the farmer nor FAO gives one. */
  days: number | null;
  daysSource: "farmer" | "FAO" | null;
  /** Years with at least `days` frost-free days. null if `days` is null or there are no years. */
  fitsYears: number | null;
  totalYears: number;
}

export interface RotationEval {
  crops: Crop[];
  fits: CropFit[];
  legumes: Crop[];
  /** Mean of FAO water-need midpoints over crops that have a value. null if none has one. */
  waterMeanMm: number | null;
  /** Crops (not fallow) with no FAO water value. */
  waterMissing: Crop[];
  /** True when the rotation has both shallower and deeper rooting crops (ranges do not overlap). */
  mixesRoots: boolean;
}

export interface RotationOption {
  kind: OptionKind;
  cropIds: string[];
  change: { index: number; from: CropFit; to: CropFit } | null;
  evaluation: RotationEval;
  /**
   * FAO water need of the crop put in, compared with the crop taken out (midpoints of the FAO ranges).
   * "unknown" if either crop has no FAO value.
   */
  water: "less" | "about the same" | "more" | "unknown";
  /** True when this option's rule skipped legumes because a separate legume option exists. */
  legumesExcluded: boolean;
}

/** Difference of FAO range midpoints (mm) below which two crops count as "about the same". Team choice. */
export const WATER_SAME_MM = 25;

/** Farmer's value if given, else the shortest FAO total growing period (C1), else null. */
export function daysFor(crop: Crop, days: FarmerDays): { days: number | null; source: CropFit["daysSource"] } {
  if (crop.group === "fallow") return { days: null, source: null };
  const own = days[crop.id];
  if (own !== undefined) return { days: own, source: "farmer" };
  if (crop.growingDays) return { days: crop.growingDays[0], source: "FAO" };
  return { days: null, source: null };
}

export function evaluate(cropIds: string[], ffy: FrostFreeYear[], days: FarmerDays = {}): RotationEval {
  const crops = cropIds.map((id) => {
    const c = CROP_BY_ID[id];
    if (!c) throw new Error(`Unknown crop "${id}"`);
    return c;
  });
  const lengths = ffy.map((y) => y.frostFreeDays);
  const fits = crops.map((crop): CropFit => {
    const d = daysFor(crop, days);
    return {
      crop,
      days: d.days,
      daysSource: d.source,
      fitsYears: d.days !== null && lengths.length ? lengths.filter((l) => l >= d.days!).length : null,
      totalYears: lengths.length,
    };
  });
  const withWater = crops.filter((c) => c.waterMm);
  const roots = crops.map((c) => c.rootM).filter((r): r is NonNullable<Crop["rootM"]> => r !== null);
  const mixesRoots = roots.some((a) => roots.some((b) => a[1] < b[0]));
  return {
    crops,
    fits,
    legumes: crops.filter((c) => c.group === "legume"),
    waterMeanMm: withWater.length ? withWater.reduce((s, c) => s + mid(c.waterMm!), 0) / withWater.length : null,
    waterMissing: crops.filter((c) => !c.waterMm && c.group !== "fallow"),
    mixesRoots,
  };
}

const isCereal = (id: string) => CROP_BY_ID[id]?.group === "cereal";

type Swap = { index: number; to: string } | null;

/** Team rule: put a legume in place of a cereal, preferably a cereal that follows another cereal. */
function legumeSwap(current: string[], fitsOf: (id: string) => number | null): Swap {
  if (current.some((id) => CROP_BY_ID[id]?.group === "legume")) return null;
  const n = current.length;
  // The rotation repeats, so year 1 follows the last year. Check years 2..n first, then year 1.
  const order = [...Array(n).keys()].slice(1).concat(0);
  const afterCereal = order.find((i) => isCereal(current[i]!) && isCereal(current[(i - 1 + n) % n]!));
  const index = afterCereal ?? current.findIndex(isCereal);
  if (index < 0) return null;
  // Legumes with a known period: the one with enough frost-free days in the most years, then the lower water need.
  const candidates = ["pea", "lentil"]
    .filter((id) => fitsOf(id) !== null)
    .sort((a, b) => {
      const f = fitsOf(b)! - fitsOf(a)!;
      if (f !== 0) return f;
      const wa = CROP_BY_ID[a]?.waterMm;
      const wb = CROP_BY_ID[b]?.waterMm;
      return (wa ? mid(wa) : Infinity) - (wb ? mid(wb) : Infinity);
    });
  return candidates[0] ? { index, to: candidates[0] } : null;
}

/** Team rule: replace the crop with the highest FAO water need by the listed crop with the lowest one. */
function waterSwap(current: string[], avoid: string[] | null, noLegumes: boolean): Swap {
  const water = (id: string) => {
    const w = CROP_BY_ID[id]?.waterMm;
    return w ? mid(w) : null;
  };
  const known = current.map((id, i) => ({ i, w: water(id) })).filter((x): x is { i: number; w: number } => x.w !== null);
  if (!known.length) return null;
  const max = Math.max(...known.map((k) => k.w));
  const lowest = Object.values(CROP_BY_ID)
    .filter((c) => c.waterMm && mid(c.waterMm) < max && !(noLegumes && c.group === "legume"))
    .sort((a, b) => mid(a.waterMm!) - mid(b.waterMm!))[0];
  if (!lowest) return null;
  // Try slots from last to first so the result differs from the legume option when possible.
  const slots = known.filter((k) => k.w === max).map((k) => k.i).reverse();
  for (const index of slots) {
    const next = current.map((id, i) => (i === index ? lowest.id : id));
    if (!avoid || next.join() !== avoid.join()) return { index, to: lowest.id };
  }
  return null;
}

/**
 * Team rule: replace the crop that has enough frost-free days in the fewest years by the crop that has
 * enough in the most years, but only if the whole rotation then works out more often.
 */
function seasonSwap(
  current: string[],
  fitsOf: (id: string) => number | null,
  daysOf: (id: string) => number | null,
  noLegumes: boolean,
): Swap {
  const known = current.map((id, i) => ({ i, f: fitsOf(id) })).filter((x): x is { i: number; f: number } => x.f !== null);
  if (!known.length) return null;
  const worst = known.reduce((a, b) => (b.f < a.f ? b : a));
  // Never put the same crop as the year before or after (the rotation repeats), to avoid back-to-back repeats.
  const n = current.length;
  const neighbours = new Set([current[(worst.i - 1 + n) % n], current[(worst.i + 1) % n]]);
  // Most years that fit between the frosts; on a tie, the shorter time from sowing to harvest.
  const best = Object.values(CROP_BY_ID)
    .filter((c) => c.group !== "fallow" && !(noLegumes && c.group === "legume") && !neighbours.has(c.id))
    .map((c) => ({ id: c.id, f: fitsOf(c.id), d: daysOf(c.id) ?? Infinity }))
    .filter((c): c is { id: string; f: number; d: number } => c.f !== null)
    .sort((a, b) => b.f - a.f || a.d - b.d)[0];
  if (!best || best.f <= worst.f) return null;
  const minFits = (ids: string[]) => Math.min(...ids.map((id) => fitsOf(id) ?? Infinity));
  const next = current.map((id, i) => (i === worst.i ? best.id : id));
  if (minFits(next) <= minFits(current)) return null;
  return { index: worst.i, to: best.id };
}

/** Only one crop changes, so compare that crop pair; never average over different sets of crops. */
/**
 * Team rule: where a crop family follows itself (for example cereal after cereal), put a crop from another
 * family in that slot. Candidates need a FAO growing period so the frost check still works; the one that
 * fits between the frosts in the most years wins, then the lower water need. Legumes have their own option.
 */
function familySwap(current: string[], fitsOf: (id: string) => number | null, noLegumes: boolean): Swap {
  const n = current.length;
  const group = (id: string) => CROP_BY_ID[id]?.group;
  const order = [...Array(n).keys()].slice(1).concat(0);
  const index = order.find((i) => {
    const g = group(current[i]!);
    return g && g !== "fallow" && g === group(current[(i - 1 + n) % n]!);
  });
  if (index === undefined) return null;
  const prev = group(current[(index - 1 + n) % n]!);
  const next = group(current[(index + 1) % n]!);
  const best = Object.values(CROP_BY_ID)
    .filter((c) => c.growingDays && c.group !== "fallow" && c.group !== prev && c.group !== next && !(noLegumes && c.group === "legume"))
    .map((c) => ({ id: c.id, f: fitsOf(c.id) ?? -1, w: c.waterMm ? mid(c.waterMm) : Infinity }))
    .sort((a, b) => b.f - a.f || a.w - b.w)[0];
  return best ? { index, to: best.id } : null;
}

function compareWater(from: Crop, to: Crop): RotationOption["water"] {
  if (!from.waterMm || !to.waterMm) return "unknown";
  const d = mid(to.waterMm) - mid(from.waterMm);
  return Math.abs(d) < WATER_SAME_MM ? "about the same" : d < 0 ? "less" : "more";
}

/** The current rotation plus up to two alternatives, ordered by the farmer's priority. */
export function buildOptions(current: string[], priority: Priority, ffy: FrostFreeYear[], days: FarmerDays = {}): RotationOption[] {
  const curEval = evaluate(current, ffy, days);
  const fitsOf = (id: string) => evaluate([id], ffy, days).fits[0]?.fitsYears ?? null;
  const daysOf = (id: string) => evaluate([id], ffy, days).fits[0]?.days ?? null;
  const make = (kind: OptionKind, swap: Swap, legumesExcluded = false): RotationOption | null => {
    if (!swap) return null;
    const ids = current.map((id, i) => (i === swap.index ? swap.to : id));
    const ev = evaluate(ids, ffy, days);
    return {
      kind,
      cropIds: ids,
      change: { index: swap.index, from: curEval.fits[swap.index]!, to: ev.fits[swap.index]! },
      evaluation: ev,
      water: compareWater(curEval.crops[swap.index]!, ev.crops[swap.index]!),
      legumesExcluded,
    };
  };
  const legume = make("legume", legumeSwap(current, fitsOf));
  // Keep legumes out of the other rules when the legume option exists, so the options really differ.
  const noLegumes = legume !== null;
  const water = make("water", waterSwap(current, legume?.cropIds ?? null, noLegumes), noLegumes);
  const season = make("season", seasonSwap(current, fitsOf, daysOf, noLegumes), noLegumes);
  const family = make("family", familySwap(current, fitsOf, noLegumes), noLegumes);
  // The family rule comes last: it is the fallback that keeps the comparison at 3 options.
  const order = priority === "water" ? [water, season, legume, family] : [legume, season, water, family];
  const seen = new Set([current.join()]);
  const alts: RotationOption[] = [];
  for (const o of order) {
    if (!o || seen.has(o.cropIds.join())) continue;
    seen.add(o.cropIds.join());
    alts.push(o);
    if (alts.length === 2) break;
  }
  return [
    { kind: "current", cropIds: current, change: null, evaluation: curEval, water: "about the same", legumesExcluded: false },
    ...alts,
  ];
}
