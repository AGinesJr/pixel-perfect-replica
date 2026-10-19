import { describe, expect, it } from "vitest";
import { highDemandIndustries, highDemandJobs, outlookPeriod } from "./high-demand-outlook";

describe("BLS high-demand outlook snapshot", () => {
  it("identifies the projection period and includes job and industry rankings", () => {
    expect(outlookPeriod).toBe("2024–2034");
    expect(highDemandJobs.length).toBeGreaterThanOrEqual(8);
    expect(highDemandIndustries.length).toBeGreaterThanOrEqual(8);
  });

  it("contains valid, unique entries and positive projected growth", () => {
    expect(new Set(highDemandJobs.map((item) => item.title)).size).toBe(highDemandJobs.length);
    expect(new Set(highDemandIndustries.map((item) => item.title)).size).toBe(highDemandIndustries.length);
    for (const item of [...highDemandJobs, ...highDemandIndustries]) {
      expect(item.growthPercent).toBeGreaterThan(0);
      expect(item.jobsAdded).toBeGreaterThan(0);
    }
  });

  it("sorts industries by projected jobs added", () => {
    expect(highDemandIndustries[0]?.jobsAdded).toBeGreaterThan(highDemandIndustries[1]?.jobsAdded ?? 0);
  });
});
