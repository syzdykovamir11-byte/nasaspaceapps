/**
 * Plain-language summary of the rotation comparison, written by Gemini.
 *
 * Grounding rule: Gemini only rewrites facts the app has already computed and shows on the cards.
 * The facts go in as JSON; the answer is rejected if it contains any number that is not in that JSON,
 * a web link, or a source that is not in the facts' source list. The cards stay the source of truth.
 */
import { SOURCES, type SourceTag } from "@/lib/crops/crops";
import type { Priority, RotationOption } from "@/lib/crops/rotation";

export interface OptionFacts {
  title: string;
  cropsByYear: string[];
  change: string | null;
  yearsEveryCropFitsBetweenFrosts: string;
  faoWaterNeedVsCurrent: string | null;
  faoWaterNeedRanges: string[];
  includesNitrogenFixingLegume: boolean;
  unknowns: string[];
}

export interface SummaryFacts {
  place: string;
  weatherPeriod: string;
  farmerPriority: string;
  options: OptionFacts[];
  sources: { tag: string; title: string }[];
  limits: string[];
}

const TITLE: Record<RotationOption["kind"], string> = {
  current: "Current rotation",
  legume: "Add a legume",
  water: "Lower water need",
  season: "A crop that fits between the frosts more often",
  family: "Break the run of one crop family",
};

const PRIORITY: Record<Priority, string> = { soil: "Improve soil", water: "Save water" };

/** Builds the facts from the same option objects the cards render. */
export function buildFacts(options: RotationOption[], period: string, place: string, priority: Priority): SummaryFacts {
  return {
    place,
    weatherPeriod: period,
    farmerPriority: PRIORITY[priority],
    options: options.map((o) => {
      const ev = o.evaluation;
      const known = ev.fits.filter((f) => f.fitsYears !== null);
      const worst = known.length ? known.reduce((a, b) => (b.fitsYears! < a.fitsYears! ? b : a)) : null;
      const unknownFit = [...new Set(ev.fits.filter((f) => f.fitsYears === null && f.crop.group !== "fallow").map((f) => f.crop.name))];
      const crops = [...new Map(ev.crops.filter((c) => c.waterMm).map((c) => [c.id, c])).values()];
      return {
        title: TITLE[o.kind],
        cropsByYear: ev.crops.map((c) => c.name),
        change: o.change ? `Year ${o.change.index + 1}: ${o.change.from.crop.name} replaced by ${o.change.to.crop.name}` : null,
        yearsEveryCropFitsBetweenFrosts: worst
          ? `${unknownFit.length ? "at most " : ""}${worst.fitsYears} of ${worst.totalYears} years, limited by ${worst.crop.name}`
          : "unknown",
        faoWaterNeedVsCurrent: o.kind === "current" ? null : o.water,
        faoWaterNeedRanges: crops.map((c) => `${c.name}: ${c.waterMm![0]}-${c.waterMm![1]} mm per season (irrigated crop guide value)`),
        includesNitrogenFixingLegume: ev.legumes.length > 0,
        unknowns: [
          ...unknownFit.map((n) => `No FAO growing period for ${n}`),
          ...[...new Set(ev.waterMissing.map((c) => c.name))].map((n) => `No FAO water value for ${n}`),
        ],
      };
    }),
    ...buildFixedParts(),
  };
}

/** The only sources the summary may cite, and the stated limits. The server always uses these, not the client's. */
export function buildFixedParts(): Pick<SummaryFacts, "sources" | "limits"> {
  return {
    sources: [
      { tag: "NASA POWER", title: "NASA POWER daily minimum air temperature at 2 m (frost years)" },
      ...(["C1", "C3"] as SourceTag[]).map((t) => ({ tag: t, title: SOURCES[t].title })),
    ],
    limits: [
      "Weather is an area average, not one field.",
      "FAO values are rough global guide values, not local measurements.",
      "No data on soil type, pests, prices or yields.",
    ],
  };
}

export const SYSTEM_PROMPT = `You explain a crop rotation comparison to a farmer in northern Kazakhstan who has no technical background.

Rules:
- Use only the facts in the JSON you are given. Do not add facts, numbers, crops, dates, yields, prices, income, or advice that is not in the JSON.
- Every number you write must appear in the JSON exactly as written there. Do not calculate, round, or convert numbers.
- Cite only sources from the JSON "sources" list, by their tag in square brackets, for example [C1] or [NASA POWER]. Square brackets are only for these tags. Never name any other source, website, study, or organisation. Never write a web link.
- Do not say which option is best and do not tell the farmer what to plant. Say what each option changes and what the facts show, and remind them to check with their agronomist.
- Mention the farmer's priority once, only to point to the fact that relates to it.
- Plain English, short sentences, no jargon. Explain "between the frosts" as "the frost-free part of the year".
- Format: one line per option, starting with "- " and the option title, then one short closing line that starts with "Check with your agronomist:" and names one limit from the JSON "limits" list.
- At most 130 words in total. No headings, no bold, no markdown other than the "- " lines.`;

export function userPrompt(facts: SummaryFacts): string {
  return `Facts (JSON):\n${JSON.stringify(facts, null, 2)}`;
}

const NUMBER = /\d+(?:[.,]\d+)?/g;

/** Returns a list of problems; empty means the summary passed. */
export function checkSummary(text: string, facts: SummaryFacts): string[] {
  const problems: string[] = [];
  const allowed = new Set((JSON.stringify(facts).match(NUMBER) ?? []).map((n) => n.replace(",", ".")));
  const extra = [...new Set((text.match(NUMBER) ?? []).map((n) => n.replace(",", ".")).filter((n) => !allowed.has(n)))];
  if (extra.length) problems.push(`numbers not in the facts: ${extra.join(", ")}`);
  if (/https?:\/\/|www\./i.test(text)) problems.push("contains a web link");
  const tags = new Set(facts.sources.map((s) => s.tag));
  // "[C1, C3]" and "[C1; NASA POWER]" cite several sources at once.
  const cited = [...text.matchAll(/\[([^\]]+)\]/g)].flatMap((m) => m[1]!.split(/[,;]/).map((t) => t.trim()));
  const unknown = cited.filter((t) => !tags.has(t));
  if (unknown.length) problems.push(`cites unknown sources: ${unknown.join(", ")}`);
  if (!text.trim()) problems.push("empty");
  return problems;
}

/** Light shape check for the request body on the server. */
export function isSummaryFacts(x: unknown): x is SummaryFacts {
  const f = x as Partial<SummaryFacts> | null;
  return (
    !!f && typeof f.place === "string" && typeof f.weatherPeriod === "string" && typeof f.farmerPriority === "string" &&
    Array.isArray(f.options) && f.options.length >= 1 && f.options.length <= 5 &&
    Array.isArray(f.sources) && Array.isArray(f.limits)
  );
}
