import type { ThreatId } from "./threats";

/**
 * What a farmer can do about each threat. Every line paraphrases a source that was opened and read in full
 * on 2026-11-14; the exact quoted words are kept in `quote` so the paraphrase can be checked.
 */
export type ActionSourceTag = "A1" | "A2";

export const ACTION_SOURCES: Record<ActionSourceTag, { title: string; url: string; read: string }> = {
  A1: {
    title: "FAO, Conservation Agriculture: Soil organic cover",
    url: "https://www.fao.org/conservation-agriculture/in-practice/soil-organic-cover/en",
    read: "2026-11-14",
  },
  A2: {
    title: "FAO, Frost Protection: fundamentals, practice and economics, Chapter 8: Appropriate technologies",
    url: "https://www.fao.org/4/y7223e/y7223e0e.htm",
    read: "2026-11-14",
  },
};

export interface SourcedLine {
  text: string;
  source: ActionSourceTag;
  quote: string;
}

export const ACTIONS: Record<ThreatId, { doNow: SourcedLine[]; askAgronomist: SourcedLine[] }> = {
  dry: {
    doNow: [
      {
        text: "Keep the soil covered with crop residue (mulch). It slows the loss of soil moisture to evaporation.",
        source: "A1",
        quote: "inhibits the evaporation of soil moisture",
      },
      {
        text: "More soil cover means more of the rain soaks into the soil instead of running off.",
        source: "A1",
        quote: "The percentage of rainwater that infiltrates the soil depends on the amount of soil cover provided.",
      },
    ],
    askAgronomist: [
      {
        text: "Cover crops between harvest and the next crop use the moisture left in the soil. Is that a good trade on your farm in dry years?",
        source: "A1",
        quote: "Cover crops are grown during fallow periods, between harvest and planting of commercial crops",
      },
    ],
  },
  soil: {
    doNow: [
      {
        text: "Keep crop residue on the soil surface. It slows the loss of soil moisture to evaporation.",
        source: "A1",
        quote: "inhibits the evaporation of soil moisture",
      },
    ],
    askAgronomist: [
      {
        text: "Cover crops between harvest and the next crop use the moisture left in the soil. Is that a good trade on your farm when the soil is dry?",
        source: "A1",
        quote: "Cover crops are grown during fallow periods, between harvest and planting of commercial crops",
      },
    ],
  },
  frost: {
    doNow: [
      {
        text: "Sow annual crops after the chance of spring frost has dropped. The dates below show when that usually happens here.",
        source: "A2",
        quote: "planting annual crops after the probability of frost has diminished in the spring",
      },
      {
        text: "Choose frost-tolerant varieties.",
        source: "A2",
        quote: "selecting varieties that are frost tolerant",
      },
      {
        text: "Prefer higher ground (upper slopes) and remove obstacles that trap cold air.",
        source: "A2",
        quote:
          "Site selection of frost-free sites (e.g. upper hill slopes are better). / Removing obstacles that cause ponding of cold air is usually also cost-effective.",
      },
    ],
    askAgronomist: [
      {
        text: "Which local varieties tolerate frost, and how late can you sow them and still harvest before autumn frost?",
        source: "A2",
        quote: "Late planting to avoid sensitive stages during frost periods",
      },
    ],
  },
};
