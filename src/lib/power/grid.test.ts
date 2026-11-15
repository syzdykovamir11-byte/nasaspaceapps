import { describe, expect, it } from "vitest";
import { cellSizeKm } from "./grid";

describe("cellSizeKm", () => {
  it("is about 55.7 km north-south everywhere", () => {
    expect(cellSizeKm(0).northSouth).toBeCloseTo(55.66, 1);
  });
  it("shrinks east-west with latitude (0.625° of longitude)", () => {
    expect(cellSizeKm(0).eastWest).toBeCloseTo(69.6, 1);
    expect(cellSizeKm(51.17).eastWest).toBeCloseTo(43.6, 1);
    expect(cellSizeKm(54.87).eastWest).toBeCloseTo(40.0, 1);
  });
});
