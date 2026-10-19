import type { Job } from "@/lib/data";

const STOP_WORDS = new Set([
  "and", "the", "for", "with", "from", "that", "this", "your", "you", "our",
  "their", "have", "has", "had", "are", "was", "were", "will", "can", "may",
  "able", "ability", "experience", "years", "year", "plus", "preferred", "required",
  "including", "such", "as", "into", "using", "use", "work", "working", "role",
  "job", "team", "teams", "strong", "excellent", "good", "knowledge", "skills",
  "skill", "support", "provide", "ensure", "maintain", "related", "relevant",
  "degree", "or", "in", "of", "to", "a", "an", "on", "at", "by", "be", "is",
  "it", "if", "not", "per", "all", "other", "within", "across", "daily",
]);

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9+#.\s-]/g, " ").replace(/\s+/g, " ").trim();
}

function terms(value: string): Set<string> {
  return new Set(
    normalize(value)
      .split(/[\s/-]+/)
      .map((word) => word.replace(/^[.+-]+|[.+-]+$/g, ""))
      .filter((word) => word.length > 2 && !STOP_WORDS.has(word)),
  );
}

type ResumeProfile = { normalized: string; terms: Set<string> };
function profile(resume: string): ResumeProfile {
  return { normalized: normalize(resume), terms: terms(resume) };
}

function hasEvidence(resume: ResumeProfile, requirement: string): boolean {
  const normalizedRequirement = normalize(requirement);
  if (normalizedRequirement.length >= 4 && resume.normalized.includes(normalizedRequirement)) return true;
  const requirementTerms = terms(requirement);
  if (requirementTerms.size === 0) return false;
  const overlap = [...requirementTerms].filter((term) => resume.terms.has(term)).length;
  const minimumOverlap = requirementTerms.size === 1 ? 1 : Math.max(2, Math.ceil(requirementTerms.size * 0.6));
  return overlap >= minimumOverlap;
}

export type RequirementEvidence = { text: string; found: boolean };
export type ResumeJobMatch = {
  job: Job;
  score: number;
  required: RequirementEvidence[];
  preferred: RequirementEvidence[];
  responsibilities: RequirementEvidence[];
  matchedCount: number;
  totalCount: number;
};

function matchWithProfile(resume: ResumeProfile, job: Job): ResumeJobMatch {
  const required = job.required.map((text) => ({ text, found: hasEvidence(resume, text) }));
  const preferred = job.preferred.map((text) => ({ text, found: hasEvidence(resume, text) }));
  const responsibilities = job.responsibilities.map((text) => ({ text, found: hasEvidence(resume, text) }));
  const coverage = (items: RequirementEvidence[]) =>
    items.length ? items.filter((item) => item.found).length / items.length : 0;
  const score = Math.round((coverage(required) * 0.6 + coverage(preferred) * 0.2 + coverage(responsibilities) * 0.2) * 100);
  const all = [...required, ...preferred, ...responsibilities];
  return {
    job, score, required, preferred, responsibilities,
    matchedCount: all.filter((item) => item.found).length,
    totalCount: all.length,
  };
}

export function matchResumeToJob(resume: string, job: Job): ResumeJobMatch {
  return matchWithProfile(profile(resume), job);
}

export function rankJobsForResume(resume: string, jobs: Job[], limit = 10): ResumeJobMatch[] {
  if (!resume.trim()) return [];
  const resumeProfile = profile(resume);
  return jobs
    .map((job) => matchWithProfile(resumeProfile, job))
    .sort((a, b) => b.score - a.score || a.job.title.localeCompare(b.job.title) || a.job.id.localeCompare(b.job.id))
    .slice(0, limit);
}
