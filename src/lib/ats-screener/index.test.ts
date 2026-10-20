import { describe, expect, it } from "vitest";
import { scoreResumeAcrossPlatforms } from "./index";

const sampleResume = `Jordan Taylor
jordan@example.com | (555) 555-0100 | Orlando, FL

Professional Summary
Customer-focused operations specialist with experience improving team workflows.

Work Experience
Operations Associate | Example Company | 2022-2025
- Improved order accuracy by 18% while supporting 40 customers per shift.
- Trained 5 new team members and managed daily inventory.

Education
Associate Degree in Business Administration, Example College, 2022

Skills
Customer service, inventory management, Microsoft Excel, scheduling, teamwork
`;

describe("ATS Screener integration", () => {
  it("returns six bounded platform estimates", () => {
    const results = scoreResumeAcrossPlatforms(sampleResume);
    expect(results).toHaveLength(6);
    expect(results.map((result) => result.system)).toEqual([
      "Workday",
      "Taleo",
      "SuccessFactors",
      "iCIMS",
      "Greenhouse",
      "Lever",
    ]);
    for (const result of results) {
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
      expect(result.breakdown.formatting.score).toBeGreaterThanOrEqual(0);
      expect(result.breakdown.formatting.score).toBeLessThanOrEqual(100);
    }
  });

  it("returns actionable platform suggestions", () => {
    const results = scoreResumeAcrossPlatforms(sampleResume);
    expect(results.every((result) => Array.isArray(result.suggestions))).toBe(true);
  });

  it("accepts an optional job description for keyword matching", () => {
    const results = scoreResumeAcrossPlatforms(
      sampleResume,
      "Customer service, inventory management, scheduling, point of sale, and team training",
    );
    expect(results).toHaveLength(6);
    expect(results.some((result) => result.breakdown.keywordMatch.matched.length > 0)).toBe(true);
  });
});
