import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { z } from "zod";
import { jobs, industries } from "@/lib/data";
import { JobCard } from "@/components/JobCard";

const search = z.object({
  q: z.string().optional().catch(""),
  loc: z.string().optional().catch(""),
  industry: z.string().optional().catch(""),
  remote: z.string().optional().catch(""),
  level: z.string().optional().catch(""),
});

export const Route = createFileRoute("/jobs/")({
  validateSearch: search,
  head: () => ({
    meta: [
      { title: "Find practice jobs — Workforce Prep" },
      { name: "description", content: "Search realistic job listings across healthcare, tech, retail, logistics, finance and more." },
      { property: "og:title", content: "Find practice jobs — Workforce Prep" },
      { property: "og:description", content: "Search realistic job listings across many industries." },
    ],
  }),
  component: Jobs,
});

function Jobs() {
  const s = Route.useSearch();
  const nav = Route.useNavigate();
  const set = (k: string, v: string) => nav({ search: (p) => ({ ...p, [k]: v || undefined }) });
  const list = useMemo(() => jobs.filter((j) => {
    const q = (s.q ?? "").toLowerCase();
    if (q && !`${j.title} ${j.employer} ${j.required.join(" ")}`.toLowerCase().includes(q)) return false;
    if (s.loc && !j.location.toLowerCase().includes(s.loc.toLowerCase())) return false;
    if (s.industry && j.industry !== s.industry) return false;
    if (s.remote && j.remote !== s.remote) return false;
    if (s.level && j.level !== s.level) return false;
    return true;
  }), [s]);

  const sel = "h-10 rounded-md border bg-card px-3 text-sm";
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-bold">Jobs</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        <input defaultValue={s.q} onChange={(e) => set("q", e.target.value)} placeholder="Keyword" className={`${sel} flex-1 min-w-48`} />
        <input defaultValue={s.loc} onChange={(e) => set("loc", e.target.value)} placeholder="Location" className={sel} />
        <select value={s.industry ?? ""} onChange={(e) => set("industry", e.target.value)} className={sel}>
          <option value="">All industries</option>{industries.map((i) => <option key={i}>{i}</option>)}
        </select>
        <select value={s.remote ?? ""} onChange={(e) => set("remote", e.target.value)} className={sel}>
          <option value="">Any workplace</option><option>Remote</option><option>Hybrid</option><option>On-site</option>
        </select>
        <select value={s.level ?? ""} onChange={(e) => set("level", e.target.value)} className={sel}>
          <option value="">Any level</option><option>Entry</option><option>Mid</option><option>Senior</option>
        </select>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">{list.length} practice jobs · employers and listings are fictional</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">{list.map((j) => <JobCard key={j.id} job={j} />)}</div>
    </div>
  );
}
