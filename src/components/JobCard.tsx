import { Link } from "@tanstack/react-router";
import { Bookmark, MapPin } from "lucide-react";
import { type Job, fmtSalary } from "@/lib/data";
import { useProgress } from "@/lib/progress";

export function JobCard({ job }: { job: Job }) {
  const { state, update } = useProgress();
  const saved = state.saved.includes(job.id);

  return (
    <article className="group relative rounded-xl border border-border bg-card p-5 transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg hover:shadow-black/10">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            to="/jobs/$id"
            params={{ id: job.id }}
            className="font-display text-lg font-semibold leading-snug text-foreground after:absolute after:inset-0 group-hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {job.title}
          </Link>
          <p className="mt-1 text-sm text-muted-foreground">{job.employer}</p>
          <span className="mt-2 inline-flex items-center rounded-full border border-warning/35 bg-warning/10 px-2.5 py-1 text-xs font-medium text-warning">
            Practice scenario
          </span>
        </div>
        <button
          type="button"
          aria-label={saved ? `Remove ${job.title} from saved jobs` : `Save ${job.title}`}
          aria-pressed={saved}
          onClick={() => update((s) => ({ ...s, saved: saved ? s.saved.filter((x) => x !== job.id) : [...s.saved, job.id] }))}
          className={`relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${saved ? "border-success/40 bg-success/10 text-success" : "border-border text-muted-foreground hover:border-primary/50 hover:bg-muted hover:text-foreground"}`}
        >
          <Bookmark className={`h-4 w-4 ${saved ? "fill-current" : ""}`} aria-hidden="true" />
        </button>
      </div>

      <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
        <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
        {job.location}
      </p>

      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <span className="rounded-md bg-secondary px-2.5 py-1.5 font-semibold tabular-nums text-secondary-foreground">{fmtSalary(job.salary)}</span>
        <span className="rounded-md bg-secondary px-2.5 py-1.5 text-secondary-foreground">{job.type}</span>
        <span className="rounded-md bg-secondary px-2.5 py-1.5 text-secondary-foreground">{job.remote}</span>
        <span className="rounded-md bg-secondary px-2.5 py-1.5 text-secondary-foreground">{job.level}</span>
      </div>

      <p className="mt-3 line-clamp-3 text-sm leading-6 text-foreground/85">{job.summary}</p>
      <p className="mt-4 border-t border-border/70 pt-3 text-xs text-muted-foreground">Simulated posting · {job.posted}</p>
    </article>
  );
}
