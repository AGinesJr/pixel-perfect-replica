import { describe, expect, it } from "vitest";
import { blsLausAreas } from "./bls-laus-areas";

describe("bundled BLS LAUS area catalog", () => {
  it("contains the full selectable catalog without duplicate area codes", () => {
    expect(blsLausAreas.length).toBeGreaterThan(8_000);
    expect(new Set(blsLausAreas.map((area) => area.areaCode)).size).toBe(blsLausAreas.length);
  });

  it("includes state, metro, county, and post-2025 planning-region geography", () => {
    expect(blsLausAreas.some((area) => area.name === "Florida" && area.areaTypeCode === "A")).toBe(true);
    expect(blsLausAreas.some((area) => area.areaTypeCode === "B")).toBe(true);
    expect(blsLausAreas.some((area) => area.areaTypeCode === "F")).toBe(true);
    expect(blsLausAreas.some((area) => area.name.includes("Planning Region"))).toBe(true);
  });
});
