import type { Analysis, Status } from "./analysis";
import { MONTHS } from "./analysis";
import { CROPS, type Advice, type Crop } from "./content";

export type Fit = { status: Status; label: string; text: string };

export function fitCheck(crop: Crop, frostFreeDays: number): Fit {
  const need = crop.minDays === crop.maxDays ? `${crop.minDays}` : `${crop.minDays}–${crop.maxDays}`;
  const base = `${crop.name} needs about ${need} days. Your frost-free season is usually ${frostFreeDays} days.`;
  if (crop.maxDays <= frostFreeDays) return { status: "green", label: "Fits your season", text: base };
  if (crop.minDays <= frostFreeDays) return { status: "amber", label: "Tight fit", text: `${base} Only faster varieties fit.` };
  return { status: "red", label: "Season too short", text: `${base} It may not finish before frost.` };
}

// Months the crop is likely in the ground: sown the day after the usual last spring frost,
// for the middle of its FAO growing period. A rough estimate for the calendar only.
export function cropMonths(a: Analysis, crop: Crop): Set<number> {
  const start = a.frost.medianLastSpring
    ? new Date(a.frost.medianLastSpring.getTime() + 86400000)
    : new Date(Date.UTC(2001, a.hemisphere === "north" ? 3 : 9, 1));
  const len = Math.round((crop.minDays + crop.maxDays) / 2);
  const set = new Set<number>();
  for (let i = 0; i < len; i += 1) {
    set.add(new Date(start.getTime() + i * 86400000).getUTCMonth() + 1);
  }
  return set;
}

export const bareMonthNames = (inGround: Set<number>) =>
  MONTHS.filter((_, i) => !inGround.has(i + 1));

export type RotationOption = {
  key: string;
  title: string;
  sequence: { label: string; emoji: string; sub?: string }[];
  fit: Fit;
  why: Advice[];
  data: Advice[];
  benefits: Advice[];
  unknown: string[];
  ask: Advice[];
};

const SOY = CROPS.find((c) => c.id === "soybean")!;
const WHEAT = CROPS.find((c) => c.id === "wheat")!;

export function buildOptions(a: Analysis, crop: Crop): RotationOption[] {
  const ff = a.frost.medianFrostFreeDays;
  const rain = Math.round(a.annualRainMean);
  const bare = bareMonthNames(cropMonths(a, crop));
  const flagged = (
    [
      ["dry spells", a.dry.status],
      ["heat", a.heat.status],
      ["frost", a.frost.status],
      ["heavy rain", a.rain.status],
    ] as const
  ).filter(([, s]) => s !== "green");
  const commonUnknown = ["Your soil type", "Pests and diseases", "Crop prices", "Your machinery"];

  const keep: RotationOption = {
    key: "keep",
    title: `Keep ${crop.name.toLowerCase()}`,
    sequence: [1, 2, 3].map((y) => ({ label: crop.name, emoji: crop.emoji, sub: `Year ${y}` })),
    fit: fitCheck(crop, ff),
    why: [{ text: "This is what you grow now. It is the baseline to compare the other options with.", src: [15] }],
    data: [
      { text: fitCheck(crop, ff).text, src: [1, 3] },
      bare.length
        ? { text: `The field is likely bare in ${bare.join(", ")}.`, src: [3] }
        : { text: "The field is likely covered most of the year.", src: [3] },
      flagged.length
        ? { text: `Last season was unusual for ${flagged.map(([n]) => n).join(" and ")}. See your field report.`, src: [1] }
        : { text: "Last season was normal for this place on all four checks.", src: [1] },
    ],
    benefits: [{ text: "No change to what you already know how to grow.", src: [] }],
    unknown: commonUnknown,
    ask: [{ text: "Is growing the same crop every year building up pests or weeds on this field?", src: [] }],
  };

  const cover: RotationOption = {
    key: "cover",
    title: `${crop.name}, then a cover crop`,
    sequence: [1, 2, 3].map((y) => ({ label: `${crop.name} + cover`, emoji: `${crop.emoji}🌱`, sub: `Year ${y}` })),
    fit: rain < 508
      ? { status: "amber", label: "Check water", text: `Your area gets about ${rain} mm of rain a year.` }
      : { status: "green", label: "Fits your rain", text: `Your area gets about ${rain} mm of rain a year.` },
    why: [
      bare.length
        ? { text: `With ${crop.name.toLowerCase()} alone, the field is likely bare in ${bare.join(", ")}. A cover crop fills that gap.`, src: [3, 5] }
        : { text: "A cover crop keeps the soil covered between harvest and the next crop.", src: [5] },
    ],
    data: [
      { text: `Your area gets about ${rain} mm of rain a year (NASA POWER average).`, src: [1] },
      rain < 508
        ? { text: "That is under about 508 mm. In climates this dry, a cover crop can use moisture the next crop needs.", src: [8] }
        : { text: "That is above the 508 mm level where water use by cover crops is a known concern.", src: [8] },
    ],
    benefits: [
      { text: "Less erosion and runoff than leaving the field bare.", src: [9] },
      { text: "More rain soaks into the soil.", src: [9] },
    ],
    unknown: ["Which cover crop to sow", "When to sow and end it", ...commonUnknown],
    ask: [{ text: "Which cover crop and sowing date fit here without taking water from the next crop?", src: [8] }],
  };

  const partner = crop.legume ? WHEAT : SOY;
  const legume: RotationOption = {
    key: "legume",
    title: crop.legume ? `Alternate ${crop.name.toLowerCase()} with wheat` : `Add soybean to the rotation`,
    sequence: [
      { label: crop.name, emoji: crop.emoji, sub: "Year 1" },
      { label: partner.name, emoji: partner.emoji, sub: "Year 2" },
      { label: crop.name, emoji: crop.emoji, sub: "Year 3" },
    ],
    fit: fitCheck(partner, ff),
    why: [
      crop.legume
        ? { text: `${crop.name} is already a legume. Alternating it with a cereal keeps a legume in the rotation every other year.`, src: [4] }
        : { text: "Soybean is a legume. Legumes in a rotation usually improve the soil.", src: [4] },
    ],
    data: [{ text: fitCheck(partner, ff).text, src: [1, 3] }],
    benefits: [
      { text: "Better soil fertility, especially nitrogen.", src: [4] },
      { text: "Soil absorbs and holds more water.", src: [4] },
    ],
    unknown: ["Whether soybean sells well near you", ...commonUnknown],
    ask: [{ text: `Which ${partner.name.toLowerCase()} varieties suit this area?`, src: [] }],
  };

  return [keep, cover, legume];
}
