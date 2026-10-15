import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { industries, type Job } from "@/lib/data";
import { searchPracticeJobs } from "@/lib/practice-jobs";
import { JobCard } from "@/components/JobCard";

const SEARCH_DEBOUNCE_MS = 350;
const levels: Job["level"][] = ["Entry", "Junior", "Mid", "Senior", "Lead", "Manager", "Director", "Executive"];
const employmentTypes: Job["type"][] = ["Full-time", "Part-time", "Contract", "Temporary", "Internship", "Apprenticeship"];
const searchSchema = z.object({
  q: z.string().optional().catch(""),
  loc: z.string().optional().catch(""),
  industry: z.string().optional().catch(""),
  remote: z.string().optional().catch(""),
  level: z.string().optional().catch(""),
  type: z.string().optional().catch(""),
  sort: z.enum(["relevance", "salary-desc", "salary-asc", "title"]).optional().catch("relevance"),
  page: z.coerce.number().int().min(1).optional().catch(1),
});

export const Route = createFileRoute("/jobs/")({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ ...search }),
  loader: ({ deps }) => searchPracticeJobs(deps),
  head: () => ({ meta: [
    { title: "Find practice jobs — Workforce Prep" },
    { name: "description", content: "Search 10,000+ simulated practice job listings across industries, locations, and experience levels." },
    { property: "og:title", content: "Find practice jobs — Workforce Prep" },
    { property: "og:description", content: "Search simulated practice listings across the United States." },
  ] }),
  component: Jobs,
});

function Jobs() {
  const s = Route.useSearch();
  const nav = Route.useNavigate();
  const result = Route.useLoaderData();
  const [queryText, setQueryText] = useState(s.q ?? "");
  const [locationText, setLocationText] = useState(s.loc ?? "");
  const list = result.jobs;
  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));
  const page = result.page;

  // Keep text inputs local and update route search only after the user pauses.
  useEffect(() => {
    setQueryText(s.q ?? "");
    setLocationText(s.loc ?? "");
  }, [s.q, s.loc]);

  useEffect(() => {
    const currentQuery = s.q ?? "";
    const currentLocation = s.loc ?? "";
    if (queryText === currentQuery && locationText === currentLocation) return;

    const timeout = window.setTimeout(() => {
      void nav({
        search: (previous) => ({
          ...previous,
          q: queryText || undefined,
          loc: locationText || undefined,
          page: undefined,
        }),
      });
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeout);
  }, [nav, queryText, locationText, s.q, s.loc]);

  const set = (key: string, value: string) => nav({
    search: (previous) => ({ ...previous, [key]: value || undefined, ...(key === "page" ? {} : { page: undefined }) }),
  });
  const goToPage = (next: number) => nav({ search: (previous) => ({ ...previous, page: next > 1 ? next : undefined }) });
  const sel = "h-10 rounded-md border bg-card px-3 text-sm";

  return <div className="mx-auto max-w-6xl px-4 py-8">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><h1 className="text-3xl font-bold">Practice jobs</h1><p className="mt-1 max-w-2xl text-sm text-muted-foreground">Explore fictional job scenarios across industries and career levels. These are simulated postings, not verified live vacancies.</p></div>
      <span className="rounded-md border bg-muted px-3 py-2 text-sm font-semibold">10,010 practice listings</span>
    </div>
    <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      <input value={queryText} onChange={(e) => setQueryText(e.target.value)} placeholder="Job title, skill, company, or keyword" aria-label="Search jobs" className={sel + " min-w-0"} />
      <input value={locationText} onChange={(e) => setLocationText(e.target.value)} placeholder="City or state" aria-label="Filter by location" className={sel + " min-w-0"} />
      <select value={s.industry ?? ""} onChange={(e) => set("industry", e.target.value)} aria-label="Filter by industry" className={sel}><option value="">All {industries.length} industries</option>{industries.map((industry) => <option key={industry} value={industry}>{industry}</option>)}</select>
      <select value={s.level ?? ""} onChange={(e) => set("level", e.target.value)} aria-label="Filter by experience level" className={sel}><option value="">All experience levels</option>{levels.map((level) => <option key={level} value={level}>{level} level</option>)}</select>
      <select value={s.remote ?? ""} onChange={(e) => set("remote", e.target.value)} aria-label="Filter by work arrangement" className={sel}><option value="">Any work arrangement</option><option value="Remote">Remote</option><option value="Hybrid">Hybrid</option><option value="On-site">On-site</option></select>
      <select value={s.type ?? ""} onChange={(e) => set("type", e.target.value)} aria-label="Filter by employment type" className={sel}><option value="">Any employment type</option>{employmentTypes.map((type) => <option key={type} value={type}>{type}</option>)}</select>
      <select value={s.sort ?? "relevance"} onChange={(e) => set("sort", e.target.value)} aria-label="Sort jobs" className={sel}><option value="relevance">Default order</option><option value="salary-desc">Highest salary</option><option value="salary-asc">Lowest salary</option><option value="title">Job title A–Z</option></select>
      <button type="button" onClick={() => { setQueryText(""); setLocationText(""); void nav({ search: {} }); }} className={sel + " font-medium hover:bg-muted"}>Clear filters</button>
    </div>
    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground" aria-live="polite">
      <p>{result.total.toLocaleString()} matching simulated listings · showing {result.total ? (page - 1) * result.pageSize + 1 : 0}–{Math.min(page * result.pageSize, result.total)}</p><p>Page {page} of {totalPages}</p>
    </div>
    {list.length ? <div className="mt-4 grid gap-4 md:grid-cols-2">{list.map((job) => <JobCard key={job.id} job={job} />)}</div> : <div className="mt-8 rounded-lg border border-dashed p-10 text-center"><h2 className="font-semibold">No practice jobs match those filters</h2><p className="mt-1 text-sm text-muted-foreground">Try a broader keyword, another location, or clear some filters.</p><button type="button" onClick={() => { setQueryText(""); void nav({ search: {} }); }} className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Clear filters</button></div>}
    {totalPages > 1 && <nav aria-label="Job results pages" className="mt-8 flex items-center justify-center gap-3"><button type="button" disabled={page <= 1} onClick={() => goToPage(page - 1)} className="rounded-md border px-4 py-2 text-sm font-semibold disabled:opacity-40">Previous</button><span className="text-sm text-muted-foreground">Page {page} / {totalPages}</span><button type="button" disabled={page >= totalPages} onClick={() => goToPage(page + 1)} className="rounded-md border px-4 py-2 text-sm font-semibold disabled:opacity-40">Next</button></nav>}
    <p className="mt-5 text-xs text-muted-foreground">Catalog source: {result.source === "database" ? "Supabase practice catalog" : "bundled practice catalog"}. All roles remain simulated scenarios.</p>
  </div>;
}
