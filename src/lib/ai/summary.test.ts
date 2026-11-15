import { describe, expect, it } from "vitest";
import { buildFixedParts, checkSummary, type SummaryFacts } from "./summary";

const facts: SummaryFacts = {
  place: "Near Kostanay",
  weatherPeriod: "1981–2025",
  farmerPriority: "Improve soil",
  options: [
    {
      title: "Add a legume",
      cropsByYear: ["Spring wheat", "Field pea", "Fallow"],
      change: "Year 2: Spring wheat replaced by Field pea",
      yearsEveryCropFitsBetweenFrosts: "41 of 45 years, limited by Spring wheat",
      faoWaterNeedVsCurrent: "less",
      faoWaterNeedRanges: ["Field pea: 350-500 mm per season (irrigated crop guide value)"],
      includesNitrogenFixingLegume: true,
      unknowns: [],
    },
  ],
  ...buildFixedParts(),
};

describe("checkSummary", () => {
  it("passes a summary that only reuses numbers and sources from the facts", () => {
    expect(checkSummary("- Add a legume: fits in 41 of 45 years [NASA POWER]. Field pea needs 350-500 mm [C1].", facts)).toEqual([]);
  });
  it("accepts several known sources in one bracket", () => {
    expect(checkSummary("Water values [C1, C3; NASA POWER].", facts)).toEqual([]);
  });
  it("rejects a new number", () => {
    expect(checkSummary("- Add a legume: yield up 15%.", facts)[0]).toMatch(/numbers not in the facts: 15/);
  });
  it("rejects an unknown source and a link", () => {
    const p = checkSummary("See [Wikipedia] and https://example.com", facts);
    expect(p.join(" ")).toMatch(/web link/);
    expect(p.join(" ")).toMatch(/unknown sources: Wikipedia/);
  });
  it("rejects an empty answer", () => {
    expect(checkSummary("  ", facts)).toContain("empty");
  });
});
