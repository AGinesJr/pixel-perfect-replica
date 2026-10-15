import { describe, expect, it } from "vitest";
import { rankJobsForResume } from "./resume-job-matching";
import { jobs } from "./data";

describe("resume matching", () => {
  it("returns no matches for an empty resume", () => {
    expect(rankJobsForResume(" ", jobs)).toEqual([]);
  });
  it("limits the number of returned matches", () => {
    expect(rankJobsForResume("Excel customer service", jobs, 2)).toHaveLength(2);
  });
});
