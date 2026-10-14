import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { jobs as bundledJobs, type Job } from "@/lib/data";

const PAGE_SIZE = 24;
const SUPABASE_URL = (import.meta.env["VITE_SUPABASE_URL"] as string | undefined)?.replace(/\/$/, "");
const SUPABASE_KEY = (import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ??
  import.meta.env["VITE_SUPABASE_ANON_KEY"]) as string | undefined;
type PracticeJobsQuery = ReturnType<ReturnType<SupabaseClient["from"]>["select"]>;

type PracticeJobRow = {
  id: string;
  title: string;
  employer: string;
  industry: string;
  location: string;
  workplace_type: Job["remote"];
  employment_type: Job["type"];
  experience_level: Job["level"];
  salary_min: number;
  salary_max: number;
  posted_label: string;
  summary: string;
  responsibilities: string[];
  required_qualifications: string[];
  preferred_qualifications: string[];
  difficulty: number;
  source_type: "simulated";
};

export type PracticeJobSearch = {
  q?: string;
  loc?: string;
  industry?: string;
  remote?: string;
  level?: string;
  type?: string;
  sort?: "relevance" | "salary-desc" | "salary-asc" | "title";
  page?: number;
};

export type PracticeJobResults = {
  jobs: Job[];
  total: number;
  page: number;
  pageSize: number;
  source: "database" | "bundled";
};

function client(): SupabaseClient | null {
  if (!SUPABASE_URL || !SUPABASE_KEY || !SUPABASE_URL.startsWith("https://")) return null;
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

function safeFilterText(value: string | undefined): string {
  // Keep PostgREST's filter grammar out of user-controlled search values.
  return (value ?? "").replace(/[^a-zA-Z0-9\s-]/g, " ").trim().replace(/\s+/g, " ");
}

export function mapPracticeJobRow(row: PracticeJobRow): Job {
  return {
    id: row.id,
    title: row.title,
    employer: row.employer,
    industry: row.industry,
    location: row.location,
    remote: row.workplace_type,
    type: row.employment_type,
    level: row.experience_level,
    sourceType: "simulated",
    salary: [row.salary_min, row.salary_max],
    posted: row.posted_label,
    summary: row.summary,
    responsibilities: row.responsibilities ?? [],
    required: row.required_qualifications ?? [],
    preferred: row.preferred_qualifications ?? [],
    difficulty: row.difficulty,
  };
}

function locallyFilter(search: PracticeJobSearch): Job[] {
  const q = safeFilterText(search.q).toLowerCase();
  const loc = safeFilterText(search.loc).toLowerCase();
  const filtered = bundledJobs.filter((job) => {
    const searchable = [
      job.title,
      job.employer,
      job.industry,
      job.location,
      job.summary,
      ...job.required,
      ...job.preferred,
      ...job.responsibilities,
    ].join(" ").toLowerCase();
    if (q && !searchable.includes(q)) return false;
    if (loc && !job.location.toLowerCase().includes(loc)) return false;
    if (search.industry && job.industry !== search.industry) return false;
    if (search.remote && job.remote !== search.remote) return false;
    if (search.level && job.level !== search.level) return false;
    if (search.type && job.type !== search.type) return false;
    return true;
  });

  if (search.sort === "salary-desc") filtered.sort((a, b) => b.salary[1] - a.salary[1]);
  else if (search.sort === "salary-asc") filtered.sort((a, b) => a.salary[0] - b.salary[0]);
  else if (search.sort === "title") filtered.sort((a, b) => a.title.localeCompare(b.title));
  return filtered;
}

function applyDatabaseFilters(query: PracticeJobsQuery, search: PracticeJobSearch): PracticeJobsQuery {
  const q = safeFilterText(search.q);
  const loc = safeFilterText(search.loc);
  let filtered = query.eq("is_active", true).eq("source_type", "simulated");
  if (q) {
    const pattern = `*${q}*`;
    filtered = filtered.or([
      `title.ilike.${pattern}`,
      `employer.ilike.${pattern}`,
      `industry.ilike.${pattern}`,
      `location.ilike.${pattern}`,
      `summary.ilike.${pattern}`,
    ].join(","));
  }
  if (loc) filtered = filtered.ilike("location", `*${loc}*`);
  if (search.industry) filtered = filtered.eq("industry", search.industry);
  if (search.remote) filtered = filtered.eq("workplace_type", search.remote);
  if (search.level) filtered = filtered.eq("experience_level", search.level);
  if (search.type) filtered = filtered.eq("employment_type", search.type);
  return filtered;
}

function fallback(search: PracticeJobSearch): PracticeJobResults {
  const filtered = locallyFilter(search);
  const pageSize = PAGE_SIZE;
  const total = filtered.length;
  const page = Math.min(Math.max(1, Math.floor(search.page ?? 1)), Math.max(1, Math.ceil(total / pageSize)));
  return {
    jobs: filtered.slice((page - 1) * pageSize, page * pageSize),
    total,
    page,
    pageSize,
    source: "bundled",
  };
}

/**
 * Query the public, RLS-protected catalog. Only the public Supabase key is used here.
 * If Supabase is unconfigured, the table/migration is unavailable, or the table has
 * not been seeded yet, retain the bundled practice catalog as a safe fallback.
 */
export async function searchPracticeJobs(search: PracticeJobSearch): Promise<PracticeJobResults> {
  const supabase = client();
  if (!supabase) return fallback(search);

  try {
    const countResult = await applyDatabaseFilters(
      supabase.from("practice_jobs").select("id", { count: "exact", head: true }),
      search,
    );
    if (countResult.error || countResult.count === null) return fallback(search);

    // An empty table means the migration may be applied but the seed has not run yet.
    const catalogCount = await supabase.from("practice_jobs")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true)
      .eq("source_type", "simulated");
    if (catalogCount.error || !catalogCount.count) return fallback(search);

    const total = countResult.count;
    const pageSize = PAGE_SIZE;
    const page = Math.min(Math.max(1, Math.floor(search.page ?? 1)), Math.max(1, Math.ceil(total / pageSize)));
    let query = applyDatabaseFilters(supabase.from("practice_jobs").select("*"), search);
    if (search.sort === "salary-desc") query = query.order("salary_max", { ascending: false });
    else if (search.sort === "salary-asc") query = query.order("salary_min", { ascending: true });
    else if (search.sort === "title") query = query.order("title", { ascending: true });
    else query = query.order("id", { ascending: true });

    const { data, error } = await query.range((page - 1) * pageSize, page * pageSize - 1);
    if (error || !data) return fallback(search);

    return {
      jobs: (data as PracticeJobRow[]).map(mapPracticeJobRow),
      total,
      page,
      pageSize,
      source: "database",
    };
  } catch {
    return fallback(search);
  }
}

export async function getPracticeJobById(id: string): Promise<Job | undefined> {
  const supabase = client();
  if (supabase) {
    try {
      const { data, error } = await supabase.from("practice_jobs")
        .select("*")
        .eq("id", id)
        .eq("is_active", true)
        .eq("source_type", "simulated")
        .maybeSingle();
      if (!error && data) return mapPracticeJobRow(data as PracticeJobRow);
    } catch {
      // Fall through to the bundled catalog if the database is unavailable.
    }
  }
  return bundledJobs.find((job) => job.id === id);
}
