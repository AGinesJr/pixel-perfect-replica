import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { jobs } from "@/lib/data";
import { useProgress } from "@/lib/progress";
import { evaluateApplication } from "@/lib/ai.functions";
import { jobPayload } from "@/lib/job-payload";

export const Route = createFileRoute("/jobs/$id/apply")({
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
  const [resume, setResume] = useState("");
  const [cover, setCover] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const evaluate = useServerFn(evaluateApplication);
  const nav = useNavigate();
  useEffect(() => { if (ready && !resume) setResume(state.resume); }, [ready]); // eslint-disable-line

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setBusy(true);
    try {
      const evaluation = await evaluate({ data: { job: jobPayload(job), resume, coverLetter: cover } });
      const id = crypto.randomUUID();
      update((s) => ({ ...s, resume: s.resume || resume, applications: [{ id, jobId: job.id, submittedAt: new Date().toISOString(), resume, coverLetter: cover, evaluation }, ...s.applications] }));
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
