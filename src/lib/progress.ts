import { useEffect, useState, useCallback } from "react";
import { getStoredSession, loadCloudProgress, saveCloudProgress } from "@/lib/supabase";

export type Evaluation = {
  decision: "interview" | "more_info" | "reject";
  score: number;
  summary: string;
  strengths: string[];
  gaps: string[];
  criteria: { name: string; score: number; note: string }[];
};

export type InterviewResult = {
  overall: number;
  summary: string;
  scores: { name: string; score: number; evidence: string }[];
  improvements: string[];
};

export type Application = {
  id: string;
  jobId: string;
  submittedAt: string;
  resume: string;
  coverLetter: string;
  evaluation?: Evaluation;
  interview?: InterviewResult;
};

export type ProgressState = {
  name: string;
  resume: string;
  contactEmail: string;
  phone: string;
  city: string;
  state: string;
  zipCode: string;
  avatarDataUrl: string;
  saved: string[];
  applications: Application[];
};

const KEY = "workforce-prep-v1";
const empty: ProgressState = {
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

function read(): ProgressState {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...empty, ...JSON.parse(raw) } : empty;
  } catch {
    return empty;
  }
}

export function useProgress() {
  const [state, setState] = useState<ProgressState>(empty);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let active = true;
    const local = read();
    setState(local);
    setReady(true);

    const syncFromCloud = async () => {
      if (!getStoredSession()) return;
      try {
        const localProgress = read();
        const cloud = await loadCloudProgress(localProgress);
        if (!active) return;
        if (cloud) {
          localStorage.setItem(KEY, JSON.stringify(cloud.progress));
          setState(cloud.progress);
          window.dispatchEvent(new Event("wp-progress"));
          if (cloud.needsRepair) {
            // Fill the missing cloud row without discarding local-only data.
            await saveCloudProgress(cloud.progress);
          }
        } else {
          // First sign-in: migrate this browser's existing practice data once.
          await saveCloudProgress(localProgress);
        }
      } catch (error) {
        if (active) {
          window.dispatchEvent(new CustomEvent("wp-sync-error", {
            detail: error instanceof Error ? error.message : "Cloud sync failed.",
          }));
        }
      }
    };

    const onLocalProgress = () => setState(read());
    const onAuthChange = () => { void syncFromCloud(); };
    window.addEventListener("wp-progress", onLocalProgress);
    window.addEventListener("wp-auth", onAuthChange);
    void syncFromCloud();
    return () => {
      active = false;
      window.removeEventListener("wp-progress", onLocalProgress);
      window.removeEventListener("wp-auth", onAuthChange);
    };
  }, []);
  const update = useCallback((fn: (s: ProgressState) => ProgressState) => {
    const next = fn(read());
    localStorage.setItem(KEY, JSON.stringify(next));
    setState(next);
    window.dispatchEvent(new Event("wp-progress"));
    if (getStoredSession()) {
      void saveCloudProgress(next).catch((error: unknown) => {
        window.dispatchEvent(new CustomEvent("wp-sync-error", {
          detail: error instanceof Error ? error.message : "Cloud sync failed.",
        }));
      });
    }
  }, []);
  return { state, update, ready };
}

export function xpFor(s: ProgressState) {
  let xp = 0;
  for (const a of s.applications) {
    xp += 50;
    if (a.evaluation?.decision === "interview") xp += 75;
    if (a.interview) xp += 100 + a.interview.overall;
  }
  if (s.resume.length > 200) xp += 50;
  return xp;
}

export function levelFor(xp: number) {
  const level = Math.floor(xp / 250) + 1;
  return { level, into: xp % 250, next: 250 };
}

export function achievements(s: ProgressState) {
  const apps = s.applications;
  return [
    { name: "Resume ready", desc: "Add a resume of 200+ characters", done: s.resume.length > 200 },
    { name: "First application", desc: "Submit your first application", done: apps.length >= 1 },
    { name: "Got the call", desc: "Earn an interview invitation", done: apps.some((a) => a.evaluation?.decision === "interview") },
    { name: "Interview complete", desc: "Finish an AI interview", done: apps.some((a) => a.interview) },
    { name: "Strong performer", desc: "Score 80+ in an interview", done: apps.some((a) => (a.interview?.overall ?? 0) >= 80) },
    { name: "Persistent", desc: "Submit 5 applications", done: apps.length >= 5 },
  ];
}
