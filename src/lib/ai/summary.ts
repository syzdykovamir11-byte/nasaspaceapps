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
  /** For an alternative: the new crop's and the replaced crop's own frost-free fit. */
  changedCropFit: string | null;
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
      // Water ranges only for the swapped pair, so the summary does not repeat crops that stay the same.
      const crops = o.change ? [o.change.to.crop, o.change.from.crop].filter((c) => c.waterMm) : [];
      return {
        title: TITLE[o.kind],
        cropsByYear: ev.crops.map((c) => c.name),
        change: o.change ? `Year ${o.change.index + 1}: ${o.change.to.crop.name} instead of ${o.change.from.crop.name}` : null,
        yearsEveryCropFitsBetweenFrosts: worst
          ? `${unknownFit.length ? "at most " : ""}${worst.fitsYears} of ${worst.totalYears} years, limited by ${worst.crop.name}`
          : "unknown",
        changedCropFit: o.change
          ? [o.change.to, o.change.from]
              .map((f) => `${f.crop.name} ${f.fitsYears === null ? "unknown" : `${f.fitsYears} of ${f.totalYears} years`}`)
              .join(", ")
          : null,
        faoWaterNeedVsCurrent: o.kind === "current" ? null : o.water,
        faoWaterNeedRanges: crops.map((c) => `${c.name} ${c.waterMm![0]}-${c.waterMm![1]} mm`),
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
      "The weather data covers a wide area, not your one field.",
      "Water needs are rough world guide values for watered fields, not local numbers.",
      "No data on soil type, pests, prices or yields.",
    ],
  };
}

export const SYSTEM_PROMPT = `You explain a crop rotation comparison to a farmer in northern Kazakhstan. The farmer has no technical background and may read English as a second language.

Content rules:
- Use only the facts in the JSON you are given. Do not add facts, numbers, crops, dates, yields, prices, income, or advice that is not in the JSON.
- Give the key numbers for each option. Current rotation: how many years the frost-free season was long enough. Alternative: the new crop's and the old crop's years from "changedCropFit", and the water need in mm from "faoWaterNeedRanges". Write each number only once.
- Do not repeat the crop list or the change text word for word; say it briefly in your own words.
- Every number you write must appear in the JSON exactly as written there. Do not calculate, round, add up, or convert numbers. Do not write percentages.
- Do not say which option is best and do not tell the farmer what to plant. Say what each option changes and what the numbers show.
- If the farmer's priority is "Improve soil", say which options add nitrogen to the soil. If it is "Save water", say which options need less water.

Language rules:
- Very plain English, as for a 12-year-old. Sentences under 15 words. Everyday words.
- Say "frost-free season" instead of "between the frosts". Say "adds nitrogen to the soil" instead of "nitrogen-fixing legume". Say "water need" instead of "FAO water need".
- Write numbers as digits, like "41 of 45 years" and "350-500 mm".

Sources:
- Put one bracket at the end of each option line with the tags you used, from the JSON "sources" list only, for example [NASA POWER, C1]. Square brackets are only for these tags. Never name any other source, website, study, or organisation. Never write a web link.

Format:
- One line per option. Start it with "- ", the option title and a colon. At most 3 short sentences per line.
- Then one last line that starts with "Before you decide:" and says to talk to an agronomist and names one limit from the JSON "limits" list.
- At most 150 words in total. No headings, no bold, no other markdown.`;

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
