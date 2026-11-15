/**
 * Crop properties used for the rotation comparison. Every value has a source tag.
 * null = the source does not list this crop. It is never filled with a guess.
 * Values were checked against the source pages on 2026-11-14.
 */

export type SourceTag = "C1" | "C2" | "C3" | "C4";

export const SOURCES: Record<SourceTag, { title: string; url: string; read: string }> = {
  C1: {
    title: "FAO, Irrigation Water Management Training Manual No. 3, Ch. 2, Table 4 (total growing period) and Table 5 (seasonal crop water need)",
    url: "https://www.fao.org/4/s2022e/s2022e02.htm",
    read: "2026-11-14",
  },
  C2: {
    title: "FAO Irrigation and Drainage Paper 56, Ch. 8, Table 22 (maximum effective rooting depth)",
    url: "https://www.fao.org/4/x0490e/x0490e0e.htm",
    read: "2026-11-14",
  },
  C3: {
    title: "Government of Saskatchewan, Green Manuring with Legumes, Table 1 (nitrogen contribution of legumes)",
    url: "https://www.saskatchewan.ca/business/agriculture-natural-resources-and-industry/agribusiness-farmers-and-ranchers/crops-and-irrigation/soils-fertility-and-nutrients/green-manuring-with-legumes",
    read: "2026-11-14",
  },
  C4: {
    title: "Government of Saskatchewan, Inoculation of Pulse Crops",
    url: "https://www.saskatchewan.ca/business/agriculture-natural-resources-and-industry/agribusiness-farmers-and-ranchers/crops-and-irrigation/soils-fertility-and-nutrients/inoculation-of-pulse-crops",
    read: "2026-11-14",
  },
};

export type Range = readonly [number, number];

export interface Crop {
  id: string;
  name: string;
  group: "cereal" | "oilseed" | "legume" | "fallow";
  /** Total growing period, days [C1]. */
  growingDays: Range | null;
  /** Seasonal water need of a fully irrigated crop, mm [C1]. Only for comparing crops with each other. */
  waterMm: Range | null;
  /** Maximum effective rooting depth, m [C2]. */
  rootM: Range | null;
  /** Nitrogen fixed symbiotically, kg N/ha, and share of plant N from the air [C3]. */
  nFixKgHa: Range | null;
  nFromAirPct: number | null;
  notes?: string;
}

export const CROPS: readonly Crop[] = [
  { id: "wheat", name: "Spring wheat", group: "cereal", growingDays: [120, 150], waterMm: [450, 650], rootM: [1.0, 1.5], nFixKgHa: null, nFromAirPct: null, notes: "FAO lists wheat, barley and oats in one row." },
  { id: "barley", name: "Barley", group: "cereal", growingDays: [120, 150], waterMm: [450, 650], rootM: [1.0, 1.5], nFixKgHa: null, nFromAirPct: null, notes: "FAO lists wheat, barley and oats in one row." },
  { id: "oats", name: "Oats", group: "cereal", growingDays: [120, 150], waterMm: [450, 650], rootM: [1.0, 1.5], nFixKgHa: null, nFromAirPct: null, notes: "FAO lists wheat, barley and oats in one row." },
  { id: "millet", name: "Millet", group: "cereal", growingDays: [105, 140], waterMm: [450, 650], rootM: [1.0, 2.0], nFixKgHa: null, nFromAirPct: null, notes: "FAO water need is from the shared sorghum/millet row." },
  { id: "flax", name: "Flax", group: "oilseed", growingDays: [150, 220], waterMm: null, rootM: [1.0, 1.5], nFixKgHa: null, nFromAirPct: null },
  { id: "rapeseed", name: "Rapeseed / canola", group: "oilseed", growingDays: null, waterMm: null, rootM: [1.0, 1.5], nFixKgHa: null, nFromAirPct: null },
  { id: "sunflower", name: "Sunflower", group: "oilseed", growingDays: [125, 130], waterMm: [600, 1000], rootM: [0.8, 1.5], nFixKgHa: null, nFromAirPct: null },
  { id: "pea", name: "Field pea", group: "legume", growingDays: [90, 100], waterMm: [350, 500], rootM: [0.6, 1.0], nFixKgHa: [2, 200], nFromAirPct: 80 },
  { id: "lentil", name: "Lentil", group: "legume", growingDays: [150, 170], waterMm: null, rootM: [0.6, 0.8], nFixKgHa: [10, 150], nFromAirPct: 80 },
  { id: "chickpea", name: "Chickpea", group: "legume", growingDays: null, waterMm: null, rootM: [0.6, 1.0], nFixKgHa: null, nFromAirPct: null, notes: "Saskatchewan ranks chickpea between pea and lentil for N fixation but gives no figure [C4]." },
  { id: "fallow", name: "Fallow (no crop)", group: "fallow", growingDays: null, waterMm: null, rootM: null, nFixKgHa: null, nFromAirPct: null, notes: "No source on the effects of fallow has been read for this tool." },
];

export const CROP_BY_ID: Record<string, Crop> = Object.fromEntries(CROPS.map((c) => [c.id, c]));

export const mid = (r: Range) => (r[0] + r[1]) / 2;
