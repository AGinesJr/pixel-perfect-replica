import { describe, expect, it } from "vitest";
import { buildPracticeJobSearchText } from "./practice-job-search-text";

describe("practice job searchable text", () => {
  it("includes titles, employer, location, summary, responsibilities, and qualifications", () => {
    const text = buildPracticeJobSearchText({
      title: "Operations Coordinator",
      employer: "Example Logistics",
      industry: "Logistics",
      location: "Orlando, FL",
      summary: "Coordinate daily work.",
      responsibilities: ["Schedule deliveries"],
      required: ["Excel"],
      preferred: ["Customer service"],
    });
    for (const phrase of [
      "Operations Coordinator",
      "Example Logistics",
      "Logistics",
      "Orlando, FL",
      "Coordinate daily work.",
      "Schedule deliveries",
      "Excel",
      "Customer service",
    ]) {
      expect(text).toContain(phrase);
    }
  });
});
