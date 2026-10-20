import { describe, expect, it } from "vitest";
import { buildScoreImprovementPlan, scoreResume } from "./resume-ats-scoring";

describe("resume ATS checklist scoring", () => {
  it("returns a usable score and actionable categories for a short resume", () => {
    const result = scoreResume("Customer service representative with communication and teamwork skills.");
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.categories.map((item) => item.name)).toEqual([
      "Resume details",
      "Qualifications & experience",
      "Skills",
      "Professional traits evidence",
    ]);
    expect(result.categories.some((item) => item.recommendations.length > 0)).toBe(true);
  });

  it("uses profile contact details and reports target-job keyword overlap", () => {
    const result = scoreResume(
      "Professional Summary\nExperienced project manager skilled in SQL, Excel, leadership, and communication.\nWork Experience 2022-Present\nImproved reporting time by 20%.\nEducation: Bachelor's degree. Skills: SQL, Excel.",
      { name: "Taylor Candidate", email: "taylor@example.com", phone: "555-123-4567", city: "Orlando", state: "FL" },
      "Project manager required skills include SQL, Excel, and data analysis.",
    );
    expect(result.keywordMatch).toBeDefined();
    expect(result.keywordMatch?.matched).toContain("excel");
    expect(result.categories.at(-1)?.name).toBe("Target-job keywords");
    expect(result.score).toBeGreaterThan(0);
  });


  it("creates a short, unique, task-based improvement checklist", () => {
    const resume = [
      "Taylor Candidate",
      "Professional Summary: Customer service professional with communication and teamwork experience.",
      "Work Experience: Retail Associate, 2022-Present",
      "Resolved customer questions, managed inventory, and trained new teammates.",
      "Education: High School Diploma",
      "Skills: customer service, scheduling, inventory management, Microsoft Excel",
    ].join("\n");
    const jobDescription = [
      "Customer Service Representative",
      "Required: customer relations, conflict resolution, scheduling, and accurate documentation.",
      "Preferred: CRM software and experience tracking service metrics.",
    ].join("\n");
    const result = scoreResume(resume, {}, jobDescription);
    const plan = buildScoreImprovementPlan(result, jobDescription, resume);
    expect(plan.length).toBeLessThanOrEqual(10);
    expect(new Set(plan.map((task) => task.title.toLowerCase())).size).toBe(plan.length);
    expect(plan.every((task) => task.action.length >= 80)).toBe(true);
    expect(plan.every((task) => task.reason.length > 20)).toBe(true);
  });

  it("does not invent a target-job keyword score when no description is supplied", () => {
    const result = scoreResume("Skills: communication, teamwork.");
    expect(result.keywordMatch).toBeUndefined();
    expect(result.categories.reduce((sum, item) => sum + item.weight, 0)).toBe(100);
  });
});
