import { Link } from "@tanstack/react-router";
import { Bookmark, MapPin } from "lucide-react";
import { type Job, fmtSalary } from "@/lib/data";
import { useProgress } from "@/lib/progress";

export function JobCard({ job }: { job: Job }) {
  const { state, update } = useProgress();
  const saved = state.saved.includes(job.id);
  return (
    <div className="group relative rounded-lg border bg-card p-5 transition hover:border-primary/50 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link to="/jobs/$id" params={{ id: job.id }} className="font-display text-lg font-semibold text-foreground after:absolute after:inset-0 group-hover:text-primary">{job.title}</Link>
          <p className="text-sm text-muted-foreground">{job.employer}</p>
          <span className="mt-1 inline-flex rounded-full border border-amber-600/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-300">Simulated practice</span>
        </div>
        <button
          aria-label={saved ? "Unsave job" : "Save job"}
          onClick={() => update((s) => ({ ...s, saved: saved ? s.saved.filter((x) => x !== job.id) : [...s.saved, job.id] }))}
          className="relative z-10 rounded-md p-2 text-muted-foreground hover:bg-muted"
        >
          <Bookmark className={`h-4 w-4 ${saved ? "fill-primary text-primary" : ""}`} />
        </button>
      </div>
      <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{job.location}</p>
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <span className="rounded bg-secondary px-2 py-1 font-medium text-secondary-foreground">{fmtSalary(job.salary)}</span>
        <span className="rounded bg-secondary px-2 py-1 text-secondary-foreground">{job.type}</span>
        <span className="rounded bg-secondary px-2 py-1 text-secondary-foreground">{job.remote}</span>
        <span className="rounded bg-secondary px-2 py-1 text-secondary-foreground">{job.level}</span>
      </div>
      <p className="mt-3 line-clamp-2 text-sm text-foreground/80">{job.summary}</p>
      <p className="mt-3 text-xs text-muted-foreground">Sample listing · {job.posted}</p>
    </div>
  );
}
