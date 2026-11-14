// Every fact shown to the farmer points to an entry in SOURCES.
// Wording paraphrases the sources listed in PROJECT_RISKS_AND_UI.md section 5 and PROJECT_SPEC.md.

export type Source = { id: number; title: string; url: string };

export const SOURCES: Source[] = [
  { id: 1, title: "NASA POWER, Daily API documentation", url: "https://power.larc.nasa.gov/docs/services/api/temporal/daily/" },
  { id: 2, title: "ETCCDI, Definitions of the 27 core climate change indices", url: "https://etccdi.pacificclimate.org/list_27_indices.shtml" },
  { id: 3, title: "FAO, Crop Water Needs, Table 4: growing periods", url: "https://www.fao.org/4/s2022e/s2022e02.htm" },
  { id: 4, title: "FAO, Aims and techniques of soil management (T0389E)", url: "https://www.fao.org/4/T0389E/T0389E05.htm" },
  { id: 5, title: "FAO Conservation Agriculture, Soil organic cover", url: "https://www.fao.org/conservation-agriculture/in-practice/soil-organic-cover/en" },
  { id: 6, title: "Practice Brief: Conservation Agriculture", url: "https://assets.publishing.service.gov.uk/media/57a089c4e5274a27b2000261/Practice_brief_Conservation_Agriculture.pdf" },
  { id: 7, title: "FAO, adaptation options brief (cb3696en)", url: "https://www.fao.org/3/cb3696en/cb3696en.pdf" },
  { id: 8, title: "USDA NRCS, Cover Crop practice effects (code 340)", url: "https://www.nrcs.usda.gov/sites/default/files/2022-09/Cover_Crop_340_CPPE.pdf" },
  { id: 9, title: "USDA NRCS, Cover Crops for Soil Health", url: "https://www.nrcs.usda.gov/conservation-basics/soil/soil-health/cover-crops-for-soil-health" },
  { id: 10, title: "FAO, The heat is on (22 April 2026)", url: "https://www.fao.org/newsroom/story/the-heat-is-on/en" },
  { id: 11, title: "FAO, Frost Protection, chapter 6: site selection", url: "https://www.fao.org/3/y7223e/y7223e0c.htm" },
  { id: 12, title: "FAO, Frost Protection, chapter 8: survey of methods", url: "https://www.fao.org/4/y7223e/y7223e0e.htm" },
  { id: 13, title: "FAO, Frost Protection, chapter 2: recommended methods", url: "https://www.fao.org/3/y7223e/y7223e08.htm" },
  { id: 14, title: "UNCCD, Organic mulching", url: "https://www.unccd.int/land-and-life/sds/toolbox/organic-mulching" },
  { id: 15, title: "NASA Space Apps 2026, Field Shift challenge", url: "https://www.spaceappschallenge.org/2026/challenges/adapting-farms-with-nasa-data/" },
];

export type Crop = {
  id: string;
  name: string;
  emoji: string;
  minDays: number;
  maxDays: number;
  legume: boolean;
};

// Growing periods: FAO Table 4 [3]. FAO calls these rough approximations; local values are better.
export const CROPS: Crop[] = [
  { id: "wheat", name: "Wheat", emoji: "🌾", minDays: 120, maxDays: 150, legume: false },
  { id: "barley", name: "Barley", emoji: "🌾", minDays: 120, maxDays: 150, legume: false },
  { id: "sunflower", name: "Sunflower", emoji: "🌻", minDays: 125, maxDays: 130, legume: false },
  { id: "maize", name: "Maize (grain)", emoji: "🌽", minDays: 125, maxDays: 180, legume: false },
  { id: "potato", name: "Potato", emoji: "🥔", minDays: 105, maxDays: 145, legume: false },
  { id: "soybean", name: "Soybean", emoji: "🫘", minDays: 135, maxDays: 150, legume: true },
];

export type Advice = { text: string; src: number[] };

export const THREAT_INFO = {
  dry: {
    title: "Dry spells",
    howWeKnow:
      "Longest run of days with less than 1 mm of rain (the CDD index) and total rain in the season, compared with every past season at this place since 1981.",
    srcHow: [1, 2],
    actions: [
      { text: "Keep the soil covered and reduce tillage. This raises infiltration and cuts runoff and evaporation, so the soil holds more water.", src: [6] },
      { text: "A mulch layer slows evaporation from the soil and helps rain soak in.", src: [5] },
      { text: "Consider drought-tolerant or early-maturing varieties, or moving the planting date to match the rains.", src: [7] },
    ] as Advice[],
    ask: [
      { text: "Cover crops can take moisture from the main crop in dry climates (under about 508 mm of rain a year). Ask if they suit your field.", src: [8] },
    ] as Advice[],
  },
  heat: {
    title: "Heat",
    howWeKnow:
      "Share of season days when the daily maximum temperature was above the 90th percentile for that calendar day (the TX90p index). The percentile comes from this place's own 1991–2020 record.",
    srcHow: [1, 2],
    actions: [
      { text: "Use heat-tolerant varieties.", src: [10] },
      { text: "Increase water storage, or use shading where it is practical.", src: [10] },
    ] as Advice[],
    ask: [{ text: "Which varieties and planting dates fit your area?", src: [] }] as Advice[],
  },
  frost: {
    title: "Frost",
    howWeKnow:
      "Number of days in the season when the night temperature fell below 0 °C (the FD index), plus the last spring frost and first autumn frost of each year since 1981.",
    srcHow: [1, 2],
    actions: [
      { text: "Choose the site with care. FAO calls site selection the most important frost protection method. Avoid low-lying cold spots.", src: [11, 13] },
      { text: "Plant later so sensitive growth stages miss the frost period, and choose tolerant varieties.", src: [12] },
      { text: "These passive methods usually cost less than active protection.", src: [13] },
    ] as Advice[],
    ask: [{ text: "Many frost measures in the FAO manual are for orchards. Which ones apply to field crops?", src: [] }] as Advice[],
  },
  rain: {
    title: "Heavy rain",
    howWeKnow:
      "Wettest single day of the season (the Rx1day index) and number of days with 20 mm of rain or more (R20mm), compared with every past season at this place since 1981.",
    srcHow: [1, 2],
    actions: [
      { text: "Bare soil and seedling-stage row crops lose the most soil in heavy rain. Keep the ground covered.", src: [4] },
      { text: "Leave crop residues as mulch. Rain soaks in more easily and no crust forms.", src: [4, 14] },
      { text: "Sow a cover crop in the gap between harvest and the next crop.", src: [5, 9] },
      { text: "Reducing tillage and keeping residue cover can cut erosion by up to 80%.", src: [6] },
    ] as Advice[],
    ask: [{ text: "When can a cover crop be sown here without using water the next crop needs?", src: [8] }] as Advice[],
  },
} as const;

export type ThreatId = keyof typeof THREAT_INFO;
