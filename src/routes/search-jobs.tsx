import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { BriefcaseBusiness, Building2, CalendarDays, ExternalLink, Globe2, Search, SlidersHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import { searchLiveJobs } from "@/lib/jobs.functions";

export const Route = createFileRoute("/search-jobs")({
  head: () => ({
    meta: [
      { title: "Search Jobs — Workforce Prep" },
      { name: "description", content: "Search live US-eligible remote job listings and prepare to apply with Workforce Prep." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SearchJobs,
});

type Job = {
  guid?: string;
  title?: string;
  companyName?: string;
  companyLogo?: string | null;
  excerpt?: string;
  description?: string;
  applicationLink?: string;
  pubDate?: string | number;
  employmentType?: string;
  minSalary?: number | null;
  maxSalary?: number | null;
  salaryPeriod?: string;
  currency?: string;
  categories?: string[];
  parentCategories?: string[];
  locationRestrictions?: string[];
  timezoneRestrictions?: string[];
};

type SearchResult = { jobs: Job[]; totalCount: number };

const seniorityOptions = ["", "Entry-level", "Mid-level", "Senior", "Manager", "Director", "Executive"];
const employmentOptions = ["", "Full Time", "Part Time", "Contractor", "Temporary", "Intern", "Volunteer", "Other"];

function formatSalary(job: Job) {
  if (job.minSalary == null && job.maxSalary == null) return "";
  const format = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: job.currency || "USD",
      maximumFractionDigits: 0,
    }).format(value);
  const range =
    job.minSalary != null && job.maxSalary != null
      ? `${format(job.minSalary)}–${format(job.maxSalary)}`
      : format((job.minSalary ?? job.maxSalary) as number);
  const period = job.salaryPeriod && job.salaryPeriod !== "annual" ? ` / ${job.salaryPeriod}` : " / year";
  return range + period;
}

function formatPosted(value: string | number | undefined) {
  if (value == null || value === "") return "";
  let dateValue: number | string = value;
  if (typeof value === "number" || /^\d+$/.test(String(value))) {
    const numeric = Number(value);
    dateValue = numeric < 10_000_000_000 ? numeric * 1000 : numeric;
  }
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function SearchJobs() {
  const getLiveJobs = useServerFn(searchLiveJobs);
  const [query, setQuery] = useState("");
  const [seniority, setSeniority] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<SearchResult>({ jobs: [], totalCount: 0 });
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  async function loadJobs(nextPage = 1) {
    setLoading(true);
    setError("");
    try {
      const data = await getLiveJobs({
        data: {
          query: query.trim(),
          seniority: seniority as "" | "Entry-level" | "Mid-level" | "Senior" | "Manager" | "Director" | "Executive",
          employmentType: employmentType as "" | "Full Time" | "Part Time" | "Contractor" | "Temporary" | "Intern" | "Volunteer" | "Other",
          page: nextPage,
        },
      });
      setResult(data);
      setPage(nextPage);
      setSearched(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We couldn't load job listings. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadJobs(1);
    // Load the initial live feed once on page entry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void loadJobs(1);
  }

  function clearFilters() {
    setQuery("");
    setSeniority("");
    setEmploymentType("");
    setPage(1);
    setLoading(true);
    setError("");
    void getLiveJobs({ data: { query: "", seniority: "", employmentType: "", page: 1 } })
      .then((data) => {
        setResult(data);
        setSearched(true);
      })
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "We couldn't load job listings."))
      .finally(() => setLoading(false));
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 md:py-10">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Live opportunities</p>
        <h1 className="mt-2 text-3xl font-bold md:text-4xl">Search Jobs</h1>
        <p className="mt-3 leading-6 text-muted-foreground">
          Explore current remote jobs that are open to candidates in the United States. Search by role, company, or skill, then open the original listing to review requirements and apply.
        </p>
      </div>

      <section className="mt-7 rounded-xl border bg-card p-4 md:p-6">
        <form onSubmit={submitSearch}>
          <label htmlFor="job-search-query" className="mb-2 block text-sm font-semibold">What job are you looking for?</label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input
                id="job-search-query"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                maxLength={120}
                placeholder="Job title, company, or skill"
                className="h-12 w-full rounded-md border bg-background pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <button type="submit" disabled={loading} className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-primary px-5 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60">
              <Search className="h-4 w-4" aria-hidden="true" /> {loading ? "Searching…" : "Search jobs"}
            </button>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-medium">
              <span className="mb-2 flex items-center gap-2"><SlidersHorizontal className="h-4 w-4 text-muted-foreground" aria-hidden="true" /> Career level</span>
              <select value={seniority} onChange={(event) => setSeniority(event.target.value)} className="h-11 w-full rounded-md border bg-background px-3 text-sm">
                {seniorityOptions.map((option) => <option key={option || "all"} value={option}>{option || "All levels"}</option>)}
              </select>
            </label>
            <label className="text-sm font-medium">
              <span className="mb-2 flex items-center gap-2"><BriefcaseBusiness className="h-4 w-4 text-muted-foreground" aria-hidden="true" /> Employment type</span>
              <select value={employmentType} onChange={(event) => setEmploymentType(event.target.value)} className="h-11 w-full rounded-md border bg-background px-3 text-sm">
                {employmentOptions.map((option) => <option key={option || "all"} value={option}>{option || "All employment types"}</option>)}
              </select>
            </label>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground"><Globe2 className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />Remote positions · open to US-based candidates</p>
            <button type="button" onClick={clearFilters} className="text-sm font-medium text-muted-foreground underline underline-offset-4 hover:text-foreground">Clear filters</button>
          </div>
        </form>
      </section>

      <div className="mt-7 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Current openings</h2>
          <p className="mt-1 text-sm text-muted-foreground">{loading ? "Getting the latest listings…" : result.totalCount > 0 ? `${result.totalCount.toLocaleString()} matching listings reported by the source` : "Listings update from the live job feed."}</p>
        </div>
        <p className="text-xs text-muted-foreground">Source: <a href="https://himalayas.app/" target="_blank" rel="noreferrer" className="font-semibold underline underline-offset-4 hover:text-foreground">Himalayas</a></p>
      </div>

      {error && (
        <div role="alert" className="mt-5 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <p className="font-semibold">Listings couldn't be loaded</p>
          <p className="mt-1 text-sm text-muted-foreground">{error}</p>
          <button type="button" onClick={() => void loadJobs(page)} className="mt-3 rounded-md border px-3 py-2 text-sm font-semibold hover:bg-muted">Try again</button>
        </div>
      )}

      {loading && result.jobs.length === 0 && (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((item) => <div key={item} className="h-44 animate-pulse rounded-xl border bg-muted/40" />)}
        </div>
      )}

      {!loading && !error && result.jobs.length === 0 && searched && (
        <section className="mt-5 rounded-xl border border-dashed p-8 text-center">
          <Search className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />
          <h3 className="mt-3 font-semibold">No matching jobs found</h3>
          <p className="mt-1 text-sm text-muted-foreground">Try a broader keyword or clear one of the filters.</p>
          <button type="button" onClick={clearFilters} className="mt-4 rounded-md border px-4 py-2 text-sm font-semibold hover:bg-muted">Show all jobs</button>
        </section>
      )}

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {result.jobs.map((job, index) => {
          const salary = formatSalary(job);
          const posted = formatPosted(job.pubDate);
          return (
            <article key={job.guid || job.applicationLink || `${job.companyName}-${job.title}-${index}`} className="flex min-w-0 flex-col rounded-xl border bg-card p-5 transition-shadow hover:shadow-sm">
              <div className="flex items-start gap-3">
                {job.companyLogo ? (
                  <img src={job.companyLogo} alt="" loading="lazy" className="h-11 w-11 shrink-0 rounded-lg border bg-background object-contain p-1" />
                ) : (
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground"><Building2 className="h-5 w-5" aria-hidden="true" /></span>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="break-words text-lg font-bold leading-snug">{job.title}</h3>
                  <p className="mt-1 break-words text-sm text-muted-foreground">{job.companyName || "Company not provided"}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">Remote · US eligible</span>
                {job.employmentType && <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">{job.employmentType}</span>}
                {salary && <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">{salary}</span>}
              </div>
              {job.excerpt && <p className="mt-4 line-clamp-4 text-sm leading-6 text-muted-foreground">{job.excerpt.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()}</p>}
              {(posted || job.categories?.length) && (
                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  {posted && <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" aria-hidden="true" /> Posted {posted}</span>}
                  {job.categories?.slice(0, 2).map((category) => <span key={category} className="rounded bg-muted px-2 py-1">{category}</span>)}
                </div>
              )}
              <div className="mt-auto pt-5">
                <a href={job.applicationLink} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                  View listing &amp; apply <ExternalLink className="h-4 w-4" aria-hidden="true" />
                </a>
              </div>
            </article>
          );
        })}
      </div>

      {result.jobs.length > 0 && (
        <div className="mt-7 flex items-center justify-between gap-3">
          <button type="button" onClick={() => void loadJobs(page - 1)} disabled={page <= 1 || loading} className="h-10 rounded-md border px-4 text-sm font-semibold disabled:opacity-40 hover:bg-muted">Previous</button>
          <span className="text-sm text-muted-foreground">Page {page}</span>
          <button type="button" onClick={() => void loadJobs(page + 1)} disabled={loading || result.jobs.length < 10} className="h-10 rounded-md border px-4 text-sm font-semibold disabled:opacity-40 hover:bg-muted">Next</button>
        </div>
      )}

      <section className="mt-10 rounded-xl border bg-muted/30 p-5">
        <h2 className="font-semibold">Found a role worth pursuing?</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">Open the original posting first, then bring its description into Interview Prep to practice role-specific questions. Job listings are supplied by an independent third-party source; availability and requirements can change.</p>
        <Link to="/job-prep" className="mt-3 inline-flex h-10 items-center rounded-md border bg-background px-4 text-sm font-semibold hover:bg-muted">Go to Interview Prep</Link>
      </section>
      <p className="mt-5 text-xs leading-5 text-muted-foreground">Listing source: Himalayas. Workforce Prep is not affiliated with the listed employers or the job source. Job data refreshes on the source's schedule and is cached briefly to respect its free API allowance.</p>
    </main>
  );
}
