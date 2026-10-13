import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { jobs } from "@/lib/data";
import { useProgress } from "@/lib/progress";
import { interviewTurn, interviewFeedback } from "@/lib/ai.functions";
import { jobPayload } from "@/lib/job-payload";
import { ScoreBar } from "./applications.$id";

export const Route = createFileRoute("/interview/$id")({
  head: () => ({
    meta: [
      { title: "AI interview — Workforce Prep" },
      { name: "description", content: "Practice a realistic interview with an AI hiring manager." },
      { property: "og:title", content: "AI interview — Workforce Prep" },
      { property: "og:description", content: "Practice a realistic interview with an AI hiring manager." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Interview,
});

type Msg = { role: "interviewer" | "candidate"; text: string };

function Interview() {
  const { id } = Route.useParams();
  const { state, update, ready } = useProgress();
  const app = state.applications.find((a) => a.id === id);
  const job = app && jobs.find((j) => j.id === app.jobId);
  const [history, setHistory] = useState<Msg[]>([]);
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  const turn = useServerFn(interviewTurn);
  const feedback = useServerFn(interviewFeedback);
  const started = useRef(false);
  const end = useRef<HTMLDivElement>(null);

  async function next(h: Msg[]) {
    if (!job || !app) return;
    setBusy(true); setErr("");
    try {
      const r = await turn({ data: { job: jobPayload(job), resume: app.resume, history: h } });
      setHistory([...h, { role: "interviewer", text: r.question }]);
      if (r.done) setDone(true);
    } catch (e) { setErr(e instanceof Error ? e.message : "Error"); }
    finally { setBusy(false); }
  }

  useEffect(() => {
    if (ready && app && !app.interview && !started.current) { started.current = true; next([]); }
  }, [ready, app]); // eslint-disable-line
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [history, busy]);

  async function finish() {
    if (!job || !app) return;
    setBusy(true); setErr("");
    try {
      const r = await feedback({ data: { job: jobPayload(job), history } });
      update((s) => ({ ...s, applications: s.applications.map((a) => (a.id === id ? { ...a, interview: r } : a)) }));
    } catch (e) { setErr(e instanceof Error ? e.message : "Error"); }
    finally { setBusy(false); }
  }

  if (!ready) return <div className="p-10 text-center text-muted-foreground">Loading…</div>;
  if (!app || !job) return <div className="p-10 text-center">Interview not found. <Link to="/dashboard" className="text-primary">Dashboard</Link></div>;

  if (app.interview) {
    const r = app.interview;
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <p className="text-sm text-muted-foreground">Interview feedback</p>
        <h1 className="text-3xl font-bold">{job.title} · {job.employer}</h1>
        <div className="mt-6 rounded-lg bg-hero p-6 text-ink-foreground">
          <p className="font-display text-5xl font-bold">{r.overall}<span className="text-xl">/100</span></p>
          <p className="mt-2 text-ink-foreground/85">{r.summary}</p>
        </div>
        <div className="mt-6 space-y-3">
          {r.scores.map((s) => (
            <div key={s.name} className="rounded-lg border bg-card p-4">
              <div className="flex justify-between text-sm font-semibold"><span>{s.name}</span><span>{s.score}</span></div>
              <div className="mt-2"><ScoreBar score={s.score} /></div>
              <p className="mt-2 text-sm text-muted-foreground">{s.evidence}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 rounded-lg border bg-card p-5">
          <h2 className="font-semibold">Your practice plan</h2>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">{r.improvements.map((i) => <li key={i}>{i}</li>)}</ol>
        </div>
        <Link to="/jobs" className="mt-6 inline-block font-semibold text-primary">Apply to another role →</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col px-4 py-8">
      <h1 className="text-2xl font-bold">Interview: {job.title}</h1>
      <p className="text-sm text-muted-foreground">Hiring manager, {job.employer} · about 5 questions · practice simulation</p>
      <div className="mt-6 space-y-4">
        {history.map((m, i) => (
          <div key={i} className={m.role === "candidate" ? "ml-auto max-w-[85%] rounded-lg bg-ink px-4 py-3 text-ink-foreground" : "max-w-[85%] rounded-lg border bg-card px-4 py-3"}>
            <p className="mb-1 text-xs font-semibold opacity-70">{m.role === "candidate" ? "You" : "Hiring manager"}</p>
            <p className="whitespace-pre-wrap text-sm">{m.text}</p>
          </div>
        ))}
        {busy && <p className="text-sm text-muted-foreground">Thinking…</p>}
        {err && <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{err}</p>}
        <div ref={end} />
      </div>
      {done ? (
        <button onClick={finish} disabled={busy} className="mt-6 h-11 rounded-md bg-primary font-semibold text-primary-foreground disabled:opacity-60">{busy ? "Scoring your interview…" : "Get my feedback"}</button>
      ) : (
        <form
          onSubmit={(e) => { e.preventDefault(); if (!answer.trim()) return; const h = [...history, { role: "candidate" as const, text: answer.trim() }]; setHistory(h); setAnswer(""); next(h); }}
          className="sticky bottom-4 mt-6 rounded-lg border bg-card p-3 shadow-lg"
        >
          <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} rows={4} placeholder="Type your answer. Tip: Situation, Task, Action, Result." className="w-full resize-none bg-transparent p-1 text-sm outline-none" disabled={busy || history.length === 0} />
          <div className="flex justify-end"><button disabled={busy || !answer.trim()} className="h-9 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50">Send answer</button></div>
        </form>
      )}
    </div>
  );
}
