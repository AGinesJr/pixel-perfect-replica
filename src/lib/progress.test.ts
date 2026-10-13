import { describe, expect, it } from "vitest";
import { achievements, levelFor, xpFor, type ProgressState } from "./progress";
import { reconcileCloudProgress } from "./supabase";

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
      applications: [
        {
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
        },
      ],
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
      applications: [
        {
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
        },
      ],
    };
    const completed = achievements(state);
    expect(
      completed.find((achievement) => achievement.name === "Resume ready")?.done,
    ).toBe(true);
    expect(
      completed.find((achievement) => achievement.name === "Got the call")?.done,
    ).toBe(true);
    expect(
      completed.find((achievement) => achievement.name === "Interview complete")?.done,
    ).toBe(true);
    expect(
      completed.find((achievement) => achievement.name === "Strong performer")?.done,
    ).toBe(true);
  });
});

describe("cloud progress reconciliation", () => {
  const local: ProgressState = {
    name: "Local name",
    resume: "Local resume",
    saved: ["local-job"],
    applications: [],
  };

  it("preserves local practice data when only the cloud profile exists", () => {
    const result = reconcileCloudProgress(
      local,
      [{ display_name: "Cloud name", resume_text: "Cloud resume" }],
      [],
    );
    expect(result).toEqual({
      progress: {
        name: "Cloud name",
        resume: "Cloud resume",
        saved: ["local-job"],
        applications: [],
      },
      needsRepair: true,
    });
  });

  it("preserves local profile data when only cloud practice data exists", () => {
    const result = reconcileCloudProgress(
      local,
      [],
      [{ saved_jobs: ["cloud-job"], applications: [] }],
    );
    expect(result).toEqual({
      progress: {
        name: "Local name",
        resume: "Local resume",
        saved: ["cloud-job"],
        applications: [],
      },
      needsRepair: true,
    });
  });

  it("returns null when neither cloud record exists so first sign-in can migrate local data", () => {
    expect(reconcileCloudProgress(local, [], [])).toBeNull();
  });

  it("does not request repair when both cloud records exist", () => {
    const result = reconcileCloudProgress(
      local,
      [{ display_name: "Cloud name", resume_text: "Cloud resume" }],
      [{ saved_jobs: ["cloud-job"], applications: [] }],
    );
    expect(result?.needsRepair).toBe(false);
    expect(result?.progress).toEqual({
      name: "Cloud name",
      resume: "Cloud resume",
      saved: ["cloud-job"],
      applications: [],
    });
  });
});
