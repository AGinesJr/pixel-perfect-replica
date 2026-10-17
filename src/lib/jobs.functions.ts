import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

type Job = {
  guid?: string; title?: string; companyName?: string; companyLogo?: string | null;
  excerpt?: string; description?: string; applicationLink?: string; pubDate?: string | number;
  employmentType?: string; minSalary?: number | null; maxSalary?: number | null; salaryPeriod?: string;
  currency?: string; categories?: string[]; parentCategories?: string[]; locationRestrictions?: string[];
  timezoneRestrictions?: string[]; location?: string; source?: "Himalayas" | "USAJOBS"; isRemote?: boolean;
};
type HimalayasResponse = { jobs?: Job[]; data?: Job[]; totalCount?: number };
type USAJobsDescriptor = {
  PositionID?: string; PositionTitle?: string; PositionURI?: string; ApplyURI?: string[];
  OrganizationName?: string; DepartmentName?: string;
  PositionLocation?: Array<{ LocationName?: string; CityName?: string; CountrySubDivisionCode?: string }>;
  PublicationStartDate?: string;
  PositionRemuneration?: Array<{ MinimumRange?: string; MaximumRange?: string; RateIntervalCode?: string }>;
  PositionFormattedDescription?: Array<{ Label?: string; Content?: string }>;
  UserArea?: { Details?: { JobSummary?: string; MajorDuties?: string; Requirements?: string } };
};
type USAJobsResponse = { SearchResult?: { SearchResultCountAll?: number; SearchResultItems?: Array<{ MatchedObjectDescriptor?: USAJobsDescriptor }> } };
type SearchResult = { jobs: Job[]; totalCount: number; expiresAt: number; locationSearchAvailable: boolean; sources: string[] };

const cache = new Map<string, SearchResult>();
const CACHE_MS = 15 * 60 * 1000;
const searchInput = z.object({
  query: z.string().trim().max(120).default(""),
  city: z.string().trim().max(80).default(""),
  state: z.string().trim().max(40).default(""),
  zip: z.string().trim().max(10).regex(/^$|^\d{5}(-\d{4})?$/).default(""),
  radius: z.number().int().min(5).max(100).default(25),
  seniority: z.enum(["", "Entry-level", "Mid-level", "Senior", "Manager", "Director", "Executive"]).default(""),
  employmentType: z.enum(["", "Full Time", "Part Time", "Contractor", "Temporary", "Intern", "Volunteer", "Other"]).default(""),
  page: z.number().int().min(1).max(100).default(1),
});

function formatUSAJobs(job: USAJobsDescriptor): Job | null {
  const title = job.PositionTitle?.trim();
  const applicationLink = job.ApplyURI?.[0] || job.PositionURI;
  if (!title || !applicationLink) return null;
  const locations = (job.PositionLocation || []).map((item) =>
    [item.CityName, item.CountrySubDivisionCode].filter(Boolean).join(", ") || item.LocationName
  ).filter(Boolean);
  const remuneration = job.PositionRemuneration?.[0];
  const minSalary = remuneration?.MinimumRange ? Number(remuneration.MinimumRange) : null;
  const maxSalary = remuneration?.MaximumRange ? Number(remuneration.MaximumRange) : null;
  const summary = job.UserArea?.Details?.JobSummary || job.UserArea?.Details?.MajorDuties ||
    job.PositionFormattedDescription?.find((item) => item.Label?.toLowerCase().includes("summary"))?.Content;
  return {
    guid: "usajobs-" + (job.PositionID || applicationLink), title,
    companyName: job.OrganizationName || job.DepartmentName || "U.S. Federal Government",
    excerpt: summary?.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 900),
    applicationLink, pubDate: job.PublicationStartDate,
    minSalary: minSalary != null && Number.isFinite(minSalary) ? minSalary : null,
    maxSalary: maxSalary != null && Number.isFinite(maxSalary) ? maxSalary : null,
    salaryPeriod: remuneration?.RateIntervalCode?.toLowerCase() === "pa" ? "annual" : remuneration?.RateIntervalCode,
    currency: "USD", categories: ["Federal government"], location: locations.join(" · ") || "Location listed on USAJOBS",
    source: "USAJOBS", isRemote: false,
  };
}

async function fetchHimalayas(data: z.infer<typeof searchInput>): Promise<{ jobs: Job[]; totalCount: number }> {
  const url = new URL("https://himalayas.app/jobs/api/search");
  url.searchParams.set("country", "US");
  url.searchParams.set("sort", data.query ? "relevant" : "recent");
  url.searchParams.set("page", String(data.page));
  if (data.query) url.searchParams.set("q", data.query);
  if (data.seniority) url.searchParams.set("seniority", data.seniority);
  if (data.employmentType) url.searchParams.set("employment_type", data.employmentType);
  const response = await fetch(url.toString(), { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(12000) });
  if (!response.ok) throw new Error(response.status === 429 ? "Himalayas rate limit reached" : "Himalayas unavailable");
  const payload = (await response.json()) as HimalayasResponse | Job[];
  const jobs = Array.isArray(payload) ? payload : Array.isArray(payload.jobs) ? payload.jobs : Array.isArray(payload.data) ? payload.data : [];
  return {
    jobs: jobs.filter((job) => job && job.title && job.applicationLink).map((job) => ({ ...job, source: "Himalayas", isRemote: true })),
    totalCount: Array.isArray(payload) ? jobs.length : Number(payload.totalCount ?? jobs.length),
  };
}

async function fetchUSAJobs(data: z.infer<typeof searchInput>, locationName: string, stateOnly: boolean): Promise<{ jobs: Job[]; totalCount: number }> {
  const apiKey = process.env.USAJOBS_API_KEY;
  const userAgent = process.env.USAJOBS_USER_AGENT;
  if (!apiKey || !userAgent) return { jobs: [], totalCount: 0 };
  const url = new URL("https://data.usajobs.gov/api/search");
  url.searchParams.set("WhoMayApply", "Public");
  url.searchParams.set("Fields", "Full");
  url.searchParams.set("ResultsPerPage", "25");
  url.searchParams.set("Page", String(data.page));
  if (data.query) url.searchParams.set("Keyword", data.query);
  if (locationName) {
    url.searchParams.set("LocationName", locationName);
    if (!stateOnly) url.searchParams.set("Radius", String(data.radius));
  }
  const response = await fetch(url.toString(), {
    headers: { Accept: "application/json", Host: "data.usajobs.gov", "User-Agent": userAgent, "Authorization-Key": apiKey },
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error("USAJOBS is temporarily unavailable");
  const payload = (await response.json()) as USAJobsResponse;
  const items = payload.SearchResult?.SearchResultItems ?? [];
  return {
    jobs: items.map((item) => item.MatchedObjectDescriptor ? formatUSAJobs(item.MatchedObjectDescriptor) : null).filter((job): job is Job => Boolean(job)),
    totalCount: Number(payload.SearchResult?.SearchResultCountAll ?? items.length),
  };
}

export const searchLiveJobs = createServerFn({ method: "GET" })
  .validator((input: unknown) => searchInput.parse(input))
  .handler(async ({ data }) => {
    const cacheKey = JSON.stringify(data);
    const cached = cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return cached;
    const locationName = data.zip || [data.city, data.state].filter(Boolean).join(", ");
    const stateOnly = !data.zip && !data.city && Boolean(data.state);
    const usaJobsConfigured = Boolean(process.env.USAJOBS_API_KEY && process.env.USAJOBS_USER_AGENT);
    const [remoteResult, federalResult] = await Promise.allSettled([
      fetchHimalayas(data),
      usaJobsConfigured ? fetchUSAJobs(data, locationName, stateOnly) : Promise.resolve({ jobs: [], totalCount: 0 }),
    ]);
    const remote = remoteResult.status === "fulfilled" ? remoteResult.value : null;
    const federal = federalResult.status === "fulfilled" ? federalResult.value : null;
    if (!remote && !federal) throw new Error("Job listings are temporarily unavailable. Please try again shortly.");
    const jobs = [...(federal?.jobs ?? []), ...(remote?.jobs ?? [])];
    const seen = new Set<string>();
    const deduplicated = jobs.filter((job) => {
      const key = (job.applicationLink || job.guid || (job.companyName || "") + "-" + (job.title || "")).toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    const result: SearchResult = {
      jobs: deduplicated, totalCount: (federal?.totalCount ?? 0) + (remote?.totalCount ?? 0),
      expiresAt: Date.now() + CACHE_MS, locationSearchAvailable: usaJobsConfigured && Boolean(locationName),
      sources: [...(federal ? ["USAJOBS"] : []), ...(remote ? ["Himalayas"] : [])],
    };
    cache.set(cacheKey, result);
    return result;
  });
