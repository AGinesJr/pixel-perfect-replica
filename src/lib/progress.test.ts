import { describe, expect, it } from "vitest";
import { achievements, levelFor, xpFor, type ProgressState } from "./progress";
import { reconcileCloudProgress } from "./supabase";

const emptyState: ProgressState = {
  name: "",
  resume: "",
  contactEmail: "",
  phone: "",
  city: "",
  state: "",
  zipCode: "",
  avatarDataUrl: "",
  saved: [],
  applications: [],
};

const cloudProfile = (display_name: string, resume_text: string) => ({
  display_name,
  resume_text,
  contact_email: "candidate@example.com",
  phone: "555-0100",
  city: "Sanford",
  state: "FL",
  zip_code: "32771",
  avatar_data_url: "",
});

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
    expect(completed.find((achievement) => achievement.name === "Resume ready")?.done).toBe(true);
    expect(completed.find((achievement) => achievement.name === "Got the call")?.done).toBe(true);
    expect(completed.find((achievement) => achievement.name === "Interview complete")?.done).toBe(true);
    expect(completed.find((achievement) => achievement.name === "Strong performer")?.done).toBe(true);
  });
});

describe("cloud progress reconciliation", () => {
  const local: ProgressState = {
    ...emptyState,
    name: "Local name",
    resume: "Local resume",
    contactEmail: "local@example.com",
    phone: "555-0199",
    city: "Orlando",
    state: "FL",
    zipCode: "32801",
    avatarDataUrl: "local-photo",
    saved: ["local-job"],
  };

  it("preserves local practice data when only the cloud profile exists", () => {
    const result = reconcileCloudProgress(local, [cloudProfile("Cloud name", "Cloud resume")], []);
    expect(result).toEqual({
      progress: {
        ...local,
        name: "Cloud name",
        resume: "Cloud resume",
        contactEmail: "candidate@example.com",
        phone: "555-0100",
        city: "Sanford",
        state: "FL",
        zipCode: "32771",
        avatarDataUrl: "",
      },
      needsRepair: true,
    });
  });

  it("preserves local profile data when only cloud practice data exists", () => {
    const result = reconcileCloudProgress(local, [], [{ saved_jobs: ["cloud-job"], applications: [] }]);
    expect(result).toEqual({
      progress: { ...local, saved: ["cloud-job"], applications: [] },
      needsRepair: true,
    });
  });

  it("returns null when neither cloud record exists so first sign-in can migrate local data", () => {
    expect(reconcileCloudProgress(local, [], [])).toBeNull();
  });

  it("does not request repair when both cloud records exist", () => {
    const result = reconcileCloudProgress(
      local,
      [cloudProfile("Cloud name", "Cloud resume")],
      [{ saved_jobs: ["cloud-job"], applications: [] }],
    );
    expect(result?.needsRepair).toBe(false);
    expect(result?.progress).toEqual({
      ...local,
      name: "Cloud name",
      resume: "Cloud resume",
      contactEmail: "candidate@example.com",
      phone: "555-0100",
      city: "Sanford",
      state: "FL",
      zipCode: "32771",
      avatarDataUrl: "",
      saved: ["cloud-job"],
      applications: [],
    });
  });
});
