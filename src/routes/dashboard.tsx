import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Award, BriefcaseBusiness, FileText, Lock, MessageSquare } from "lucide-react";
import { jobs } from "@/lib/data";
import { useProgress, xpFor, levelFor, achievements } from "@/lib/progress";
import { JobCard } from "@/components/JobCard";
import { RewardedPracticeTip } from "@/components/RewardedPracticeTip";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Career dashboard — Workforce Prep" },
      { name: "description", content: "Review your career practice progress, saved roles, application activity, and next steps." },
      { property: "og:title", content: "Career dashboard — Workforce Prep" },
      { property: "og:description", content: "Review your career practice progress, saved roles, application activity, and next steps." },
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
  const completedInterviews = state.applications.filter((a) => a.interview).length;
  const progressPercent = Math.max(0, Math.min(100, Math.round((lv.into / Math.max(1, lv.next)) * 100)));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-primary">Your career command center</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Your next move starts here.</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Review what you’ve practiced, pick a useful next step, and keep building toward your own career goals.</p>
        </div>
        <Link to="/jobs" className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-lg bg-primary px-5 font-semibold text-primary-foreground transition-colors hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:self-auto">
          Find a practice role <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </header>

      <section aria-label="Career practice overview" className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-border bg-hero p-5 text-foreground dark:text-ink-foreground sm:col-span-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-foreground/75 dark:text-ink-foreground/75">Practice level</p>
              <p className="metric-value mt-1 font-display text-4xl font-bold sm:text-5xl">Level {lv.level}</p>
            </div>
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-success/15 text-success"><Award className="h-5 w-5" aria-hidden="true" /></span>
          </div>
          <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-foreground/15 dark:bg-ink-foreground/15" role="progressbar" aria-label="Progress to next practice level" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progressPercent}>
            <div className="h-full rounded-full bg-success transition-[width] duration-200" style={{ width: `${progressPercent}%` }} />
          </div>
          <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-foreground/75 dark:text-ink-foreground/75">
            <span>{xp.toLocaleString()} practice XP</span><span>{Math.max(0, lv.next - lv.into).toLocaleString()} XP to next level</span>
          </div>
          <p className="mt-3 text-xs text-foreground/70 dark:text-ink-foreground/70">Practice level reflects platform activity, not job readiness or hiring likelihood.</p>
        </article>
        <Stat label="Applications practiced" value={state.applications.length} detail="Simulated applications" />
        <Stat label="Interview sessions" value={completedInterviews} detail="Completed practice sessions" />
      </section>

      <RewardedPracticeTip />

      <section className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><p className="text-xs font-semibold uppercase tracking-wide text-primary">Keep moving forward</p><h2 className="mt-1 text-2xl font-bold">Your next three actions</h2></div>
          <p className="text-sm text-muted-foreground">Choose what helps you most today.</p>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <NextAction icon={<BriefcaseBusiness className="h-5 w-5" aria-hidden="true" />} number="01" title="Explore a role" detail="Compare practice requirements with your experience before you apply." to="/jobs" action="Find practice jobs" />
          <NextAction icon={<FileText className="h-5 w-5" aria-hidden="true" />} number="02" title="Strengthen your resume" detail="Review your resume score, identify gaps, and apply the next recommended fix." to="/profile" action="Open Resume Studio" />
          <NextAction icon={<MessageSquare className="h-5 w-5" aria-hidden="true" />} number="03" title="Practice an answer" detail="Rehearse a role-specific question and use the feedback to try again." to="/job-prep" action="Start interview practice" />
        </div>
      </section>

      <div className="mt-9 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section>
          <h2 className="text-xl font-semibold">Application practice history</h2>
          {state.applications.length === 0 ? (
            <div className="mt-3 rounded-xl border border-dashed border-border bg-card p-8 text-center">
              <p className="font-semibold text-foreground">Your practice history starts with one role.</p>
              <p className="mt-1 text-sm text-muted-foreground">Try a sample application to see the simulated screening process and build your own history.</p>
              <Link to="/jobs" className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:brightness-105">Explore practice jobs <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
            </div>
          ) : (
            <div className="mt-3 overflow-hidden rounded-xl border border-border bg-card">
              {state.applications.map((a) => {
                const j = jobs.find((x) => x.id === a.jobId);
                return (
                  <Link key={a.id} to="/applications/$id" params={{ id: a.id }} className="flex flex-col justify-between gap-3 border-b border-border/70 p-4 transition-colors last:border-b-0 hover:bg-muted/50 sm:flex-row sm:items-center">
                    <div className="min-w-0"><p className="font-semibold">{j?.title ?? "Practice role"}</p><p className="mt-1 text-sm text-muted-foreground">{j?.employer ?? "Workforce Prep practice"} · {new Date(a.submittedAt).toLocaleDateString()}</p></div>
                    <div className="text-left text-sm sm:text-right"><p className="font-medium">{a.interview ? "Interview practiced" : a.evaluation ? status[a.evaluation.decision] : "Submitted"}</p><p className="mt-1 tabular-nums text-muted-foreground">Screen {a.evaluation?.score ?? "—"}{a.interview ? ` · Interview ${a.interview.overall}` : ""}</p></div>
                  </Link>
                );
              })}
            </div>
          )}
          {scores.length > 0 && (
            <div className="mt-6 rounded-xl border border-border bg-card p-5">
              <h3 className="font-semibold">Interview score trend</h3>
              <p className="mt-1 text-sm text-muted-foreground">Scores from your recorded practice sessions. This trend describes practice performance, not hiring probability.</p>
              <div className="mt-4 flex h-32 items-end gap-2" role="img" aria-label={`Interview practice scores: ${scores.join(", ")} out of 100`}>
                {scores.map((score, index) => <div key={index} className="relative flex-1 rounded-t-md bg-primary/80 transition-[height] duration-200" style={{ height: `${score}%` }} title={`Practice score: ${score}/100`}><span className="sr-only">{score} out of 100</span></div>)}
              </div>
              <div className="mt-2 flex justify-between text-xs text-muted-foreground"><span>Earlier sessions</span><span>Recent sessions</span></div>
            </div>
          )}
          {saved.length > 0 && (<><div className="mt-8 flex items-center justify-between gap-3"><h2 className="text-xl font-semibold">Saved practice roles</h2><Link to="/jobs" className="text-sm font-semibold text-primary hover:underline">View all</Link></div><div className="mt-3 grid gap-4 md:grid-cols-2">{saved.map((job) => <JobCard key={job.id} job={job} />)}</div></>)}
        </section>

        <aside aria-labelledby="achievements-heading">
          <h2 id="achievements-heading" className="text-xl font-semibold">Milestones</h2>
          <p className="mt-1 text-sm text-muted-foreground">Recognizing meaningful practice, not time spent online.</p>
          <div className="mt-3 space-y-2">
            {ach.map((item) => (
              <article key={item.name} className={`flex items-start gap-3 rounded-xl border border-border bg-card p-3.5 ${item.done ? "border-success/35 bg-success/5" : "opacity-80"}`}>
                {item.done ? <Award className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-hidden="true" /> : <Lock className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />}
                <div><p className="text-sm font-semibold">{item.name}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{item.desc}</p>{item.done && <p className="mt-1 text-xs font-semibold text-success">Completed</p>}</div>
              </article>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

function Stat({ label, value, detail }: { label: string; value: number; detail: string }) {
  return <article className="rounded-2xl border border-border bg-card p-5"><p className="text-sm text-muted-foreground">{label}</p><p className="metric-value mt-2 font-display text-4xl font-bold">{value.toLocaleString()}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></article>;
}

function NextAction({ icon, number, title, detail, to, action }: { icon: React.ReactNode; number: string; title: string; detail: string; to: "/jobs" | "/profile" | "/job-prep"; action: string }) {
  return <article className="group rounded-xl border border-border bg-card p-5 transition-[border-color,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg hover:shadow-black/10"><div className="flex items-center justify-between gap-3"><span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">{icon}</span><span className="font-display text-sm font-semibold tabular-nums text-muted-foreground">{number}</span></div><h3 className="mt-4 text-lg font-semibold">{title}</h3><p className="mt-2 min-h-12 text-sm leading-6 text-muted-foreground">{detail}</p><Link to={to} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">{action}<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></article>;
}
