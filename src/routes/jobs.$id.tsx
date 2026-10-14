import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Building2, MapPin } from "lucide-react";
import { jobs, employers, fmtSalary } from "@/lib/data";
import { useProgress } from "@/lib/progress";

export const Route = createFileRoute("/jobs/$id")({
  loader: ({ params }) => {
    const job = jobs.find((j) => j.id === params.id);
    if (!job) throw notFound();
    return { job };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.job.title} at ${loaderData.job.employer} — Workforce Prep` },
          { name: "description", content: loaderData.job.summary },
          { property: "og:title", content: `${loaderData.job.title} — Workforce Prep` },
          { property: "og:description", content: loaderData.job.summary },
        ]
      : [{ title: "Job not found — Workforce Prep" }, { name: "robots", content: "noindex" }],
  }),
  notFoundComponent: () => <div className="p-10 text-center">Job not found. <Link to="/jobs" className="text-primary">Browse jobs</Link></div>,
  component: JobPage,
});

function JobPage() {
  const { job } = Route.useLoaderData();
  const emp = employers[job.employer]!;
  const { state } = useProgress();
  const jobApplications = state.applications.filter((a) => a.jobId === job.id);
  const applied = jobApplications[0];
  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 md:grid-cols-[1fr_300px]">
      <article className="rounded-lg border bg-card p-6 md:p-8">
        <Link to="/jobs" className="text-sm text-muted-foreground">← All jobs</Link>
        <div className="mt-3 inline-flex rounded-full border border-amber-600/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-300">Simulated practice listing · not a live vacancy</div>
        <h1 className="mt-3 text-3xl font-bold">{job.title}</h1>
        <p className="mt-1 text-muted-foreground">{job.employer} · <MapPin className="inline h-3.5 w-3.5" /> {job.location} · {job.remote}</p>
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <span className="rounded bg-secondary px-2 py-1 font-medium">{fmtSalary(job.salary)}</span>
          <span className="rounded bg-secondary px-2 py-1">{job.type}</span>
          <span className="rounded bg-secondary px-2 py-1">{job.level} level</span>
        </div>
        <div className="mt-6">
          <div className="flex flex-wrap gap-3">
            {applied ? (
              <Link to="/applications/$id" params={{ id: applied.id }} className="inline-flex h-11 items-center rounded-md border px-6 font-semibold">View latest application</Link>
            ) : (
              <Link to="/apply/$id" params={{ id: job.id }} className="inline-flex h-11 items-center rounded-md bg-primary px-6 font-semibold text-primary-foreground hover:bg-primary/90">Apply now</Link>
            )}
            <Link to="/apply/$id" params={{ id: job.id }} className="inline-flex h-11 items-center rounded-md bg-primary px-6 font-semibold text-primary-foreground hover:bg-primary/90">
              {applied ? "Reapply as new attempt" : "Start a new application"}
            </Link>
          </div>
          {jobApplications.length > 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              {jobApplications.length} saved {jobApplications.length === 1 ? "attempt" : "attempts"} for this role. Reapplying creates a new record; previous results stay in your dashboard.
            </p>
          )}
        </div>
        <Section title="About the role"><p>{job.summary}</p></Section>
        <Section title="Responsibilities"><List items={job.responsibilities} /></Section>
        <Section title="Required qualifications"><List items={job.required} /></Section>
        <Section title="Preferred qualifications"><List items={job.preferred} /></Section>
      </article>
      <aside className="space-y-4">
        <div className="rounded-lg border bg-card p-5">
          <Building2 className="h-6 w-6 text-primary" />
          <h2 className="mt-3 font-semibold">{emp.name}</h2>
          <p className="text-sm text-muted-foreground">{emp.tagline}</p>
          <dl className="mt-4 space-y-2 text-sm">
            <div><dt className="text-muted-foreground">Size</dt><dd>{emp.size} employees</dd></div>
            <div><dt className="text-muted-foreground">Headquarters</dt><dd>{emp.hq}</dd></div>
            <div><dt className="text-muted-foreground">Culture</dt><dd>{emp.culture}</dd></div>
          </dl>
        </div>
        <div className="rounded-lg border bg-card p-5 text-sm">
          <p className="font-semibold">Recruiter strictness</p>
          <div className="mt-2 flex gap-1">{[1, 2, 3, 4, 5].map((n) => <span key={n} className={`h-2 flex-1 rounded ${n <= job.difficulty ? "bg-primary" : "bg-muted"}`} />)}</div>
          <p className="mt-2 text-muted-foreground">Practice interview threshold: score {55 + job.difficulty * 5}/100. Fictional employer and role for rehearsal only.</p>
        </div>
      </aside>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="mt-8"><h2 className="mb-2 text-lg font-semibold">{title}</h2><div className="text-foreground/85">{children}</div></section>;
}
function List({ items }: { items: string[] }) {
  return <ul className="list-disc space-y-1 pl-5">{items.map((i) => <li key={i}>{i}</li>)}</ul>;
}
