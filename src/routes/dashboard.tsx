import { createFileRoute, Link } from "@tanstack/react-router";
import { Award, Lock } from "lucide-react";
import { jobs } from "@/lib/data";
import { useProgress, xpFor, levelFor, achievements } from "@/lib/progress";
import { JobCard } from "@/components/JobCard";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "My career dashboard — Workforce Prep" },
      { name: "description", content: "Track applications, interview scores, level and achievements." },
      { property: "og:title", content: "My career dashboard — Workforce Prep" },
      { property: "og:description", content: "Track applications, interview scores, level and achievements." },
    ],
  }),
  component: Dashboard,
});

const status = { interview: "Interview", more_info: "More evidence needed", qualified_not_selected: "Qualified, below simulated threshold", reject: "Required qualification gap" } as const;

function Dashboard() {
  const { state } = useProgress();
  const xp = xpFor(state);
  const lv = levelFor(xp);
  const ach = achievements(state);
  const scores = state.applications.filter((a) => a.interview).map((a) => a.interview!.overall).reverse();
  const saved = jobs.filter((j) => state.saved.includes(j.id));
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-bold">My career</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-lg bg-hero p-5 text-ink-foreground md:col-span-2">
          <p className="text-sm text-ink-foreground/70">Career level</p>
          <p className="font-display text-4xl font-bold">Level {lv.level}</p>
          <div className="mt-3 h-2 rounded bg-ink-foreground/20"><div className="h-2 rounded bg-ink-foreground" style={{ width: `${(lv.into / lv.next) * 100}%` }} /></div>
          <p className="mt-2 text-xs text-ink-foreground/70">{xp} XP · {lv.next - lv.into} XP to next level</p>
        </div>
        <Stat label="Applications" value={state.applications.length} />
        <Stat label="Interviews earned" value={state.applications.filter((a) => a.evaluation?.decision === "interview").length} />
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-[1fr_320px]">
        <section>
          <h2 className="text-xl font-semibold">Applications</h2>
          {state.applications.length === 0 ? (
            <div className="mt-3 rounded-lg border border-dashed bg-card p-8 text-center text-muted-foreground">No applications yet. <Link to="/jobs" className="font-semibold text-primary">Find a job to practice on</Link></div>
          ) : (
            <div className="mt-3 divide-y rounded-lg border bg-card">
              {state.applications.map((a) => {
                const j = jobs.find((x) => x.id === a.jobId);
                return (
                  <Link key={a.id} to="/applications/$id" params={{ id: a.id }} className="flex items-center justify-between gap-4 p-4 hover:bg-muted/50">
                    <div><p className="font-semibold">{j?.title}</p><p className="text-sm text-muted-foreground">{j?.employer} · {new Date(a.submittedAt).toLocaleDateString()}</p></div>
                    <div className="text-right text-sm"><p className="font-medium">{a.interview ? "Interviewed" : a.evaluation ? status[a.evaluation.decision] : "Submitted"}</p><p className="text-muted-foreground">Screen {a.evaluation?.score ?? "–"}{a.interview ? ` · Interview ${a.interview.overall}` : ""}</p></div>
                  </Link>
                );
              })}
            </div>
          )}
          {scores.length > 0 && (
            <div className="mt-6 rounded-lg border bg-card p-5">
              <h3 className="font-semibold">Interview score trend</h3>
              <div className="mt-4 flex h-32 items-end gap-2">
                {scores.map((s, i) => <div key={i} className="flex-1 rounded-t bg-primary" style={{ height: `${s}%` }} title={`${s}`} />)}
              </div>
            </div>
          )}
          {saved.length > 0 && (<><h2 className="mt-8 text-xl font-semibold">Saved jobs</h2><div className="mt-3 grid gap-4 md:grid-cols-2">{saved.map((j) => <JobCard key={j.id} job={j} />)}</div></>)}
        </section>
        <aside>
          <h2 className="text-xl font-semibold">Achievements</h2>
          <div className="mt-3 space-y-2">
            {ach.map((a) => (
              <div key={a.name} className={`flex items-center gap-3 rounded-lg border bg-card p-3 ${a.done ? "" : "opacity-60"}`}>
                {a.done ? <Award className="h-5 w-5 text-primary" /> : <Lock className="h-5 w-5 text-muted-foreground" />}
                <div><p className="text-sm font-semibold">{a.name}</p><p className="text-xs text-muted-foreground">{a.desc}</p></div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div className="rounded-lg border bg-card p-5"><p className="text-sm text-muted-foreground">{label}</p><p className="font-display text-4xl font-bold">{value}</p></div>;
}
