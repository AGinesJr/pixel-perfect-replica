import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { FileText, RotateCcw, UploadCloud } from "lucide-react";
import LiveInterview from "@/components/LiveInterview";
import type { InterviewMsg, VoiceJob } from "@/lib/live-interview";
import { useRef, useState } from "react";
import { interviewFeedback } from "@/lib/ai.functions";

export const Route = createFileRoute("/job-prep")({
  head: () => ({
    meta: [
      { title: "Job Prep — Workforce Prep" },
      { name: "description", content: "Upload a job description and practice a tailored mock interview." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: JobPrep,
});

type Feedback = {
  overall: number;
  summary: string;
  scores: { name: string; score: number; evidence: string }[];
  improvements: string[];
};



function JobPrep() {
  const [title, setTitle] = useState("");
  const [employer, setEmployer] = useState("");
  const [description, setDescription] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [stage, setStage] = useState<"setup" | "interview">("setup");
  const fileRef = useRef<HTMLInputElement>(null);
  const getFeedback = useServerFn(interviewFeedback);

  const cleanDescription = description.trim();
  const lines = cleanDescription
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*(?:[-*•▪‣]|\d+[.)])\s*/, "").trim())
    .filter(Boolean);
  const required = lines.filter((line) => /required|qualification|must have|experience|proficien|skill|degree|certif|ability|knowledge/i.test(line)).slice(0, 12);
  const preferred = lines.filter((line) => /preferred|nice to have|bonus|desired|plus/i.test(line)).slice(0, 8);
  const responsibilities = lines.filter((line) => /responsibilit|duties|you will|manage|support|coordinate|develop|maintain|perform|responsible|oversee|deliver/i.test(line)).slice(0, 12);

  const toSchemaBullets = (items: string[], fallback: string[]) =>
    (items.length ? items : fallback)
      .flatMap((item) => {
        const normalized = item.trim();
        return normalized ? (normalized.match(/[\s\S]{1,450}/g) ?? []) : [];
      })
      .slice(0, 30);

  const job = {
    title: title.trim() || "Role described in uploaded job description",
    employer: employer.trim() || "Target employer",
    level: "",
    summary: cleanDescription,
    responsibilities: toSchemaBullets(responsibilities, lines.slice(0, 8)),
    required: toSchemaBullets(required, lines.slice(0, 8)),
    preferred: toSchemaBullets(preferred, []),
    difficulty: 3,
    culture: "Use only the supplied job description. This is a simulated practice interview, not a real employer interview.",
  };

  const voiceJob: VoiceJob = {
    title: job.title, employer: job.employer, level: job.level, summary: job.summary,
    responsibilities: job.responsibilities, required: job.required, preferred: job.preferred,
  };

  async function readFile(file?: File) {
    setError("");
    if (!file) return;
    if (!/\.(txt|md|html?)$/i.test(file.name) && !/^text\//i.test(file.type)) {
      setError("For now, upload a .txt, .md, or .html file. For PDF or Word documents, copy the job-description text and paste it below.");
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    try {
      const text = await file.text();
      const normalized = file.name.toLowerCase().endsWith(".html")
        || file.name.toLowerCase().endsWith(".htm")
        ? text.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/\s+/g, " ")
        : text;
      setDescription(normalized);
      setFeedback(null);
      setStage("setup");
    } catch {
      setError("We couldn't read that file. Try a plain-text file or paste the description instead.");
    }
  }

  async function startInterview() {
    if (cleanDescription.length < 80) {
      setError("Add at least 80 characters so the interviewer has enough role details to work with.");
      return;
    }
    setError("");
    setFeedback(null);
    setStage("interview");
  }

  async function finishInterview(transcript: InterviewMsg[]) {
    setBusy(true);
    setError("");
    try {
      const result = await getFeedback({ data: { job, history: transcript.map((message) => ({ role: message.role, text: message.text })) } });
      setFeedback(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't generate feedback. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setFeedback(null);
    setDone(false);
    setError("");
    setStage("setup");
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 md:py-10">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Personalized interview practice</p>
        <h1 className="mt-2 text-3xl font-bold md:text-4xl">Job Prep</h1>
        <p className="mt-3 text-muted-foreground">Bring the job description you’re applying for. Workforce Prep will use its responsibilities and qualifications to guide a tailored mock interview, then give you evidence-based feedback on your answers.</p>
      </div>

      {stage === "setup" ? (
        <section className="mt-7 rounded-xl border bg-card p-5 md:p-7">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><FileText className="h-5 w-5" /></span>
            <div><h2 className="text-xl font-bold">1. Add the job description</h2><p className="mt-1 text-sm text-muted-foreground">Upload a text file or paste the full description. The full description is sent to the AI service without a fixed character cutoff to generate interview questions and feedback.</p></div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-medium">Job title <span className="font-normal text-muted-foreground">(optional)</span>
              <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} placeholder="e.g. Assistant Property Manager" className="mt-2 h-11 w-full rounded-md border bg-background px-3 text-sm" />
            </label>
            <label className="block text-sm font-medium">Company <span className="font-normal text-muted-foreground">(optional)</span>
              <input value={employer} onChange={(e) => setEmployer(e.target.value)} maxLength={160} placeholder="e.g. Example Properties" className="mt-2 h-11 w-full rounded-md border bg-background px-3 text-sm" />
            </label>
          </div>

          <div className="mt-5 rounded-lg border border-dashed p-4 md:p-5">
            <input ref={fileRef} type="file" accept=".txt,.md,.html,.htm,text/plain,text/markdown,text/html" onChange={(e) => void readFile(e.target.files?.[0])} className="sr-only" id="job-description-file" />
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-muted"><UploadCloud className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1"><p className="font-semibold">Upload a job description</p><p className="mt-1 text-xs text-muted-foreground">TXT, Markdown, or HTML · no app-imposed size cutoff</p></div>
              <button type="button" onClick={() => fileRef.current?.click()} className="h-10 rounded-md border px-4 text-sm font-semibold hover:bg-muted">Choose file</button>
            </div>
          </div>

          <label htmlFor="job-description-text" className="mt-5 block text-sm font-semibold">Or paste the job description</label>
          <textarea id="job-description-text" value={description} onChange={(e) => { setDescription(e.target.value); setError(""); }} rows={11} placeholder={"About the role…\nResponsibilities…\nRequired qualifications…\nPreferred skills…"} className="mt-2 w-full rounded-md border bg-background p-3 text-sm leading-6" />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">{description.length.toLocaleString()} characters</span>
            <button type="button" onClick={() => { setDescription(""); setError(""); if (fileRef.current) fileRef.current.value = ""; }} className="rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted">Clear description</button>
          </div>

          {error && <p role="alert" className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
          <button type="button" onClick={() => void startInterview()} disabled={busy || cleanDescription.length < 80} className="mt-5 h-11 rounded-md bg-primary px-5 font-semibold text-primary-foreground disabled:opacity-50">{busy ? "Preparing interview…" : "Create my mock interview"}</button>
          <p className="mt-4 text-xs leading-5 text-muted-foreground">Privacy: the uploaded file is read in your browser; it is not stored by this page. The job description and your interview answers are sent to the configured AI service for this session. No audio is recorded in this manual interview.</p>
        </section>
      ) : (
        <section className="mt-7">
          <div className="rounded-xl border bg-card p-5 md:p-7">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><p className="text-sm font-semibold uppercase tracking-wide text-primary">Mock interview</p><h2 className="mt-1 text-2xl font-bold">{job.title}</h2><p className="mt-1 text-sm text-muted-foreground">{job.employer} · AI practice only, not a real employer interview</p></div>
              <button type="button" onClick={reset} className="inline-flex h-10 items-center gap-2 rounded-md border px-3 text-sm font-semibold hover:bg-muted"><RotateCcw className="h-4 w-4" /> Start over</button>
            </div>
            <LiveInterview job={voiceJob} scoring={busy} onFinish={(transcript) => void finishInterview(transcript)} onSwitchToManual={() => setError("This interview is voice-only. Retry the live interview to continue.")} voiceOnly />
            {error && <p role="alert" className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
            {feedback && <div className="mt-6 space-y-4" aria-live="polite">
              <div className="rounded-xl border p-5"><p className="text-sm font-semibold uppercase tracking-wide text-primary">Your interview feedback</p><div className="mt-2 flex flex-wrap items-center gap-4"><div className="grid h-20 w-20 place-items-center rounded-full border-4 border-primary"><div className="text-center"><p className="metric-value font-display text-2xl font-bold leading-none">{feedback.overall}</p><p className="mt-1 text-[10px] text-muted-foreground">/ 100</p></div></div><p className="min-w-[200px] flex-1 text-sm leading-6">{feedback.summary}</p></div></div>
              <div className="grid gap-3 md:grid-cols-2">{feedback.scores.map((item) => <article key={item.name} className="rounded-lg border p-4"><div className="flex items-start justify-between gap-3"><h3 className="font-semibold">{item.name}</h3><span className="metric-value font-bold">{item.score}/100</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: item.score + "%" }} /></div><p className="mt-2 text-sm text-muted-foreground">{item.evidence}</p></article>)}</div>
              <article className="rounded-lg border p-5"><h3 className="font-semibold">What to improve next</h3><ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-6">{feedback.improvements.map((item) => <li key={item}>{item}</li>)}</ul></article>
              <div className="flex flex-wrap gap-3"><button type="button" onClick={reset} className="h-11 rounded-md bg-primary px-5 font-semibold text-primary-foreground">Practice another role</button><Link to="/profile" className="inline-flex h-11 items-center rounded-md border px-5 font-semibold hover:bg-muted">Go to Resume</Link></div>
            </div>}
          </div>
          {error && <p role="alert" className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
        </section>
      )}
    </main>
  );
}
