import { createFileRoute, Link } from "@tanstack/react-router";
import { jobs } from "@/lib/data";
import { useProgress } from "@/lib/progress";

export const Route = createFileRoute("/applications/$id")({
  head: () => ({
    meta: [
      { title: "Application result — Workforce Prep" },
      { name: "description", content: "See how the AI recruiter scored your practice application." },
      { property: "og:title", content: "Application result — Workforce Prep" },
      { property: "og:description", content: "Transparent recruiter scoring for your practice application." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AppResult,
});

const label = {
  interview: { t: "Interview invitation", c: "bg-success/15 text-success border-success/30" },
  more_info: { t: "More information requested", c: "bg-warning/15 text-foreground border-warning/40" },
  reject: { t: "Does not yet meet listed requirements", c: "bg-destructive/10 text-destructive border-destructive/30" },
};

export function ScoreBar({ score }: { score: number }) {
  return <div className="h-2 w-full rounded bg-muted"><div className="h-2 rounded bg-primary" style={{ width: `${Math.max(0, Math.min(100, score))}%` }} /></div>;
}

function AppResult() {
  const { id } = Route.useParams();
  const { state, ready } = useProgress();
  if (!ready) return <div className="p-10 text-center text-muted-foreground">Loading…</div>;
  const app = state.applications.find((a) => a.id === id);
  const job = app && jobs.find((j) => j.id === app.jobId);
  if (!app || !job || !app.evaluation) return <div className="p-10 text-center">Application not found. <Link to="/dashboard" className="text-primary">Go to dashboard</Link></div>;
  const ev = app.evaluation;
  const l = label[ev.decision];
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <p className="text-sm text-muted-foreground">Application · {new Date(app.submittedAt).toLocaleDateString()}</p>
      <h1 className="mt-1 text-3xl font-bold">{job.title}</h1>
      <p className="text-muted-foreground">{job.employer}</p>
      <p className="mt-1 text-xs text-muted-foreground">Practice mode: {app.mode === "market-reality" ? "Market Reality (simulated)" : app.mode === "simulation" ? "Career simulation" : "Training"}</p>
      <div className={`mt-6 rounded-lg border p-5 ${l.c}`}>
        <div className="flex items-center justify-between gap-4">
          <p className="font-display text-xl font-bold">{l.t}</p>
          <p className="font-display text-3xl font-bold">{ev.score}<span className="text-base">/100</span></p>
        </div>
        <p className="mt-2 text-foreground">{ev.summary}</p>
        <p className="mt-2 text-xs text-muted-foreground">Interview threshold for this role: {55 + job.difficulty * 5}</p>
      </div>
      {ev.decision === "interview" && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-5">
          <p>{app.interview ? `Interview completed — score ${app.interview.overall}/100.` : "The hiring manager is ready to interview you now."}</p>
          <Link to="/interview/$id" params={{ id: app.id }} className="h-10 rounded-md bg-primary px-5 py-2 font-semibold text-primary-foreground">{app.interview ? "View feedback" : "Start interview"}</Link>
        </div>
      )}
      <h2 className="mt-8 text-xl font-semibold">How you were scored</h2>
      <div className="mt-3 space-y-3">
        {ev.criteria.map((c) => (
          <div key={c.name} className="rounded-lg border bg-card p-4">
            <div className="flex justify-between text-sm font-semibold"><span>{c.name}</span><span>{c.score}</span></div>
            <div className="mt-2"><ScoreBar score={c.score} /></div>
            <p className="mt-2 text-sm text-muted-foreground">{c.note}</p>
          </div>
        ))}
      </div>
      <section className="mt-8 rounded-lg border bg-card p-5">
        <h2 className="text-xl font-semibold">Your next steps</h2>
        <p className="mt-1 text-sm text-muted-foreground">This is coaching for practice, not a real employer decision. Use the plan to strengthen your evidence and retest.</p>
        {ev.actionPlan?.length ? (
          <ol className="mt-4 space-y-4">
            {ev.actionPlan.map((item, index) => (
              <li key={item.step + index} className="flex gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">{index + 1}</span>
                <div>
                  <p className="font-semibold">{item.step}</p>
                  <p className="text-xs font-medium text-primary">{item.timeline}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.action}</p>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {ev.gaps.map((gap) => <li key={gap}>{gap}</li>)}
          </ul>
        )}
      </section>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-5"><h3 className="font-semibold">Strengths</h3><ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{ev.strengths.map((s) => <li key={s}>{s}</li>)}</ul></div>
        <div className="rounded-lg border bg-card p-5"><h3 className="font-semibold">Gaps to close</h3><ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{ev.gaps.map((s) => <li key={s}>{s}</li>)}</ul></div>
      </div>
    </div>
  );
}
