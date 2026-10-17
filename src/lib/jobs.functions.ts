import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

type HimalayasJob = {
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

type SearchResponse = {
  jobs?: HimalayasJob[];
  data?: HimalayasJob[];
  totalCount?: number;
};

const cache = new Map<string, { expiresAt: number; jobs: HimalayasJob[]; totalCount: number }>();
const CACHE_MS = 15 * 60 * 1000;

const searchInput = z.object({
  query: z.string().trim().max(120).default(""),
  city: z.string().trim().max(80).default(""),
  state: z.string().trim().max(40).default(""),
  zip: z.string().trim().max(10).regex(/^$|^\\d{5}(-\\d{4})?$/).default(""),
  seniority: z.enum(["", "Entry-level", "Mid-level", "Senior", "Manager", "Director", "Executive"]).default(""),
  employmentType: z.enum(["", "Full Time", "Part Time", "Contractor", "Temporary", "Intern", "Volunteer", "Other"]).default(""),
  page: z.number().int().min(1).max(100).default(1),
});

export const searchLiveJobs = createServerFn({ method: "GET" })
  .validator((input: unknown) => searchInput.parse(input))
  .handler(async ({ data }) => {
    const cacheKey = JSON.stringify(data);
    const cached = cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return cached;

    const url = new URL("https://himalayas.app/jobs/api/search");
    url.searchParams.set("country", "US");
    url.searchParams.set("sort", data.query ? "relevant" : "recent");
    url.searchParams.set("page", String(data.page));
    const searchTerms = [data.query, data.city, data.state, data.zip].filter(Boolean).join(" ").trim();
    if (searchTerms) url.searchParams.set("q", searchTerms);
    if (data.seniority) url.searchParams.set("seniority", data.seniority);
    if (data.employmentType) url.searchParams.set("employment_type", data.employmentType);

    const response = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(12000),
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error("The free job feed is temporarily busy. Please wait a minute and try again.");
      }
      throw new Error("Live job listings are temporarily unavailable. Please try again shortly.");
    }

    const payload = (await response.json()) as SearchResponse | HimalayasJob[];
    const jobs = Array.isArray(payload)
      ? payload
      : Array.isArray(payload.jobs)
        ? payload.jobs
        : Array.isArray(payload.data)
          ? payload.data
          : [];
    const result = {
      jobs: jobs.filter((job) => job && job.title && job.applicationLink),
      totalCount: Array.isArray(payload) ? jobs.length : Number(payload.totalCount ?? jobs.length),
      expiresAt: Date.now() + CACHE_MS,
    };
    cache.set(cacheKey, result);
    return result;
  });
