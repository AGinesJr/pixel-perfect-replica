import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { jobs } from "@/lib/data";
import { useProgress, type PracticeMode } from "@/lib/progress";
import { evaluateApplication } from "@/lib/ai.functions";
import { jobPayload } from "@/lib/job-payload";

export const Route = createFileRoute("/apply/$id")({
  loader: ({ params }) => {
    const job = jobs.find((j) => j.id === params.id);
    if (!job) throw notFound();
    return { job };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `Apply: ${loaderData.job.title} — Workforce Prep` : "Apply — Workforce Prep" },
      { name: "description", content: "Submit a practice application and get screened by an AI recruiter." },
      { property: "og:title", content: "Apply — Workforce Prep" },
      { property: "og:description", content: "Submit a practice application and get screened by an AI recruiter." },
    ],
  }),
  component: Apply,
});

function Apply() {
  const { job } = Route.useLoaderData();
  const { state, update, ready } = useProgress();
  const [mode, setMode] = useState<PracticeMode>("training");
  const [resume, setResume] = useState("");
  const [cover, setCover] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const evaluate = useServerFn(evaluateApplication);
  const nav = useNavigate();
  useEffect(() => {
    if (!ready) return;
    // Reapplications are new records, prefilled from the latest attempt for this job.
    const previous = state.applications.find((application) => application.jobId === job.id);
    if (previous) {
      setResume(previous.resume || state.resume);
      setCover(previous.coverLetter || "");
      setMode(previous.mode || "training");
    } else if (!resume) {
      setResume(state.resume);
    }
  }, [ready, job.id]); // eslint-disable-line

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setBusy(true);
    try {
      const evaluation = await evaluate({ data: { job: jobPayload(job), resume, coverLetter: cover, mode } });
      const id = crypto.randomUUID();
      update((s) => ({
        ...s,
        resume: s.resume || resume,
        // Always append a distinct application ID. Earlier attempts and their scores remain untouched.
        applications: [
          { id, jobId: job.id, submittedAt: new Date().toISOString(), mode, resume, coverLetter: cover, evaluation },
          ...s.applications,
        ],
      }));
      nav({ to: "/applications/$id", params: { id } });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong.");
    } finally { setBusy(false); }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link to="/jobs/$id" params={{ id: job.id }} className="text-sm text-muted-foreground">← Back to job</Link>
      <h1 className="mt-3 text-3xl font-bold">Apply to {job.title}</h1>
      <p className="text-muted-foreground">{job.employer} · {job.location}</p>
      <form onSubmit={submit} className="mt-6 space-y-5 rounded-lg border bg-card p-6">
        <fieldset className="space-y-3">
          <legend className="font-semibold">Choose your practice mode</legend>
          <p className="text-sm text-muted-foreground">Training is the default. Your feedback stays private to your account.</p>
          <label className="flex cursor-pointer gap-3 rounded-md border p-3">
            <input type="radio" name="practice-mode" value="training" checked={mode === "training"} onChange={() => setMode("training")} className="mt-1" />
            <span><span className="block font-semibold">Training mode · Recommended</span><span className="block text-sm text-muted-foreground">Supportive screening, specific coaching, and a clear plan to improve and try again.</span></span>
          </label>
          <label className="flex cursor-pointer gap-3 rounded-md border p-3">
            <input type="radio" name="practice-mode" value="simulation" checked={mode === "simulation"} onChange={() => setMode("simulation")} className="mt-1" />
            <span><span className="block font-semibold">Career simulation</span><span className="block text-sm text-muted-foreground">A balanced, realistic hiring simulation with evidence-based feedback.</span></span>
          </label>
          <label className="flex cursor-pointer gap-3 rounded-md border p-3">
            <input type="radio" name="practice-mode" value="market-reality" checked={mode === "market-reality"} onChange={() => setMode("market-reality")} className="mt-1" />
            <span><span className="block font-semibold">Market Reality · Advanced</span><span className="block text-sm text-muted-foreground">A stricter simulated threshold. This does not represent real competition, live vacancies, or other users.</span></span>
          </label>
        </fieldset>
        <label className="block">
          <span className="font-semibold">Resume</span>
          <span className="block text-sm text-muted-foreground">Paste your resume text. Include experience, skills, certifications and education.</span>
          <textarea required minLength={20} value={resume} onChange={(e) => setResume(e.target.value)} rows={12} className="mt-2 w-full rounded-md border bg-background p-3 text-sm" />
        </label>
        <label className="block">
          <span className="font-semibold">Cover letter <span className="font-normal text-muted-foreground">(optional)</span></span>
          <textarea value={cover} onChange={(e) => setCover(e.target.value)} rows={6} className="mt-2 w-full rounded-md border bg-background p-3 text-sm" />
        </label>
        {err && <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{err}</p>}
        <button disabled={busy} className="h-11 rounded-md bg-primary px-6 font-semibold text-primary-foreground disabled:opacity-60">
          {busy ? "Recruiter is reviewing…" : "Submit application"}
        </button>
        <p className="text-xs text-muted-foreground">Practice simulation. An AI recruiter scores your application only on job-related evidence. Saved privately in this browser.</p>
      </form>
    </div>
  );
}
