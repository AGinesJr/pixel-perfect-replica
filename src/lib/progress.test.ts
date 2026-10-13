import { describe, expect, it } from "vitest";
import { achievements, levelFor, xpFor, type ProgressState } from "./progress";

const emptyState: ProgressState = {
  name: "",
  resume: "",
  saved: [],
  applications: [],
};

describe("career progress helpers", () => {
  it("starts at level one with no progress", () => {
    expect(xpFor(emptyState)).toBe(0);
    expect(levelFor(0)).toEqual({ level: 1, into: 0, next: 250 });
  });

  it("awards progress for a resume, application, interview invitation, and completed interview", () => {
    const state: ProgressState = {
      ...emptyState,
      resume: "x".repeat(201),
      applications: [{
        id: "app-1",
        jobId: "data-analyst",
        submittedAt: "2026-01-01T00:00:00.000Z",
        resume: "resume",
        coverLetter: "",
        evaluation: {
          decision: "interview",
          score: 80,
          summary: "Evidence-based practice feedback.",
          strengths: ["Relevant skills"],
          gaps: ["More detail"],
          criteria: [],
        },
        interview: {
          overall: 85,
          summary: "Good practice interview.",
          scores: [],
          improvements: ["Use a specific example"],
        },
      }],
    };
    expect(xpFor(state)).toBe(360);
    expect(levelFor(360)).toEqual({ level: 2, into: 110, next: 250 });
  });

  it("marks achievements only when their conditions are met", () => {
    const initial = achievements(emptyState);
    expect(initial.every((achievement) => !achievement.done)).toBe(true);

    const state: ProgressState = {
      ...emptyState,
      resume: "x".repeat(201),
      applications: [{
        id: "app-1",
        jobId: "data-analyst",
        submittedAt: "2026-01-01T00:00:00.000Z",
        resume: "resume",
        coverLetter: "",
        evaluation: {
          decision: "interview",
          score: 70,
          summary: "Practice evaluation.",
          strengths: [],
          gaps: [],
          criteria: [],
        },
        interview: {
          overall: 80,
          summary: "Practice feedback.",
          scores: [],
          improvements: [],
        },
      }],
    };
    const completed = achievements(state);
    expect(completed.find((achievement) => achievement.name === "Resume ready")?.done).toBe(true);
    expect(completed.find((achievement) => achievement.name === "Got the call")?.done).toBe(true);
    expect(completed.find((achievement) => achievement.name === "Interview complete")?.done).toBe(true);
    expect(completed.find((achievement) => achievement.name === "Strong performer")?.done).toBe(true);
  });
});
