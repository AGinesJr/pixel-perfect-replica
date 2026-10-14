import type { Job } from "./data";

/** Flatten the user-visible role content into one field for safe database keyword search. */
export function buildPracticeJobSearchText(job: Pick<Job,
  "title" | "employer" | "industry" | "location" | "summary" |
  "responsibilities" | "required" | "preferred"
>): string {
  return [
    job.title,
    job.employer,
    job.industry,
    job.location,
    job.summary,
    ...job.responsibilities,
    ...job.required,
    ...job.preferred,
  ].join(" ");
}
