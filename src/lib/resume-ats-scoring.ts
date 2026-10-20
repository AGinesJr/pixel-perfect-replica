import { scoreResumeAcrossPlatforms } from "@/lib/ats-screener";
import type { ScoreResult as ATSPlatformScore } from "@/lib/ats-screener/scorer/types";

export type ResumeScoreProfile = {
  name?: string;
  email?: string;
  phone?: string;
  city?: string;
  state?: string;
};

export type ResumeScoreCategory = {
  name: string;
  score: number;
  weight: number;
  summary: string;
  recommendations: string[];
};

export type ResumeScoreResult = {
  score: number;
  label: string;
  categories: ResumeScoreCategory[];
  keywordMatch?: { score: number; matched: string[]; missing: string[] };
  platformScores: ATSPlatformScore[];
  disclaimer: string;
};

const SKILL_TERMS = [
  "communication", "leadership", "teamwork", "customer service", "project management",
  "problem solving", "time management", "organization", "attention to detail",
  "adaptability", "conflict resolution", "critical thinking", "collaboration",
  "microsoft excel", "excel", "word", "powerpoint", "google workspace", "sql",
  "python", "javascript", "typescript", "react", "data analysis", "budgeting",
  "scheduling", "inventory management", "sales", "cash handling", "quality assurance",
  "training", "supervision", "documentation", "troubleshooting", "forklift",
  "first aid", "cpr", "customer relations", "research", "writing", "negotiation",
  "project coordination", "bookkeeping", "accounting", "marketing", "logistics",
];

const STOP_WORDS = new Set([
  "about", "above", "across", "after", "again", "against", "also", "and", "any",
  "are", "been", "before", "being", "between", "both", "but", "can", "could",
  "demonstrate", "demonstrated", "desired", "duties", "each", "experience",
  "for", "from", "good", "have", "help", "including", "into", "job", "knowledge",
  "looking", "must", "our", "other", "required", "requirements", "role", "should",
  "skills", "such", "that", "the", "their", "them", "then", "there", "these",
  "this", "those", "through", "to", "using", "various", "will", "with", "work",
  "working", "years", "your",
]);

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9+#.\s/-]/g, " ").replace(/\s+/g, " ").trim();
}

function includesTerm(text: string, term: string): boolean {
  const escaped = term.toLowerCase().replace(/[.*+?^$()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
  return new RegExp("(^|[^a-z0-9])" + escaped + "($|[^a-z0-9])", "i").test(text);
}

function category(
  name: string,
  checks: { passed: boolean; advice: string }[],
  weight: number,
  summary: string,
): ResumeScoreCategory {
  const score = checks.length ? Math.round((checks.filter((check) => check.passed).length / checks.length) * 100) : 0;
  const recommendations = checks.filter((check) => !check.passed).map((check) => check.advice);
  return { name, score, weight, summary, recommendations };
}

function keywordTerms(value: string): string[] {
  const normalized = normalize(value);
  return [...new Set(normalized.split(/[\s/-]+/).map((word) => word.replace(/^[.+#-]+|[.+#-]+$/g, "")))]
    .filter((word) => word.length > 3 && !STOP_WORDS.has(word) && !/^\d+$/.test(word));
}

export function scoreResume(
  resume: string,
  profile: ResumeScoreProfile = {},
  jobDescription = "",
): ResumeScoreResult {
  const text = normalize(resume);
  const has = (term: string) => includesTerm(text, normalize(term));
  const details = category("Resume details", [
    { passed: Boolean(profile.name?.trim()) || has("name"), advice: "Add your professional name in the account profile or resume header." },
    { passed: Boolean(profile.email?.trim()) || /\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b/i.test(resume), advice: "Include a professional email address in your account profile." },
    { passed: Boolean(profile.phone?.trim()) || /(?:\+?\d[\d().\s-]{7,}\d)/.test(resume), advice: "Add a phone number to your account profile if you want employers to contact you." },
    { passed: Boolean(profile.city?.trim() || profile.state?.trim()) || has("location"), advice: "Add your city and state to your account profile or resume when relevant to the role." },
    { passed: /\b(summary|professional profile|career objective|about me|professional overview)\b/i.test(text), advice: "Add a short professional summary tailored to the kind of role you want." },
    { passed: /\b(linkedin|github|portfolio|website)\b/i.test(text) || /https?:\/\//i.test(resume), advice: "Consider adding a relevant LinkedIn profile, portfolio, or work-sample link." },
  ], jobDescription.trim() ? 15 : 20, "Contact information and clear resume context.");

  const qualifications = category("Qualifications & experience", [
    { passed: /\b(experience|employment|work history|professional history|career history)\b/i.test(text), advice: "Use a clearly labeled Work Experience or Employment History section." },
    { passed: /\b(education|degree|diploma|high school|bachelor|associate|master|university|college|ged)\b/i.test(text), advice: "Add an Education section and relevant degrees, diplomas, or equivalent education." },
    { passed: /\b(certification|certified|license|licensed|credential|cpr|osha|servsafe)\b/i.test(text), advice: "List relevant certifications or licenses; if you have none, skip this and focus on qualifications you do have." },
    { passed: /\b(increased|improved|reduced|saved|delivered|completed|managed|trained|achieved|generated|resolved|led)\b/i.test(text) && /\b\d+(?:[.,]\d+)?\s*(%|percent|hours|days|weeks|months|years|people|customers|projects|dollars|\$)?\b/i.test(text), advice: "Add truthful accomplishments with numbers where possible, such as volume, time saved, quality, or customer outcomes." },
    { passed: /\b(19|20)\d{2}\b/.test(text) || /\b(current|present)\b/i.test(text), advice: "Add dates or durations for work and education so your timeline is easy to follow." },
  ], jobDescription.trim() ? 20 : 30, "Education, experience, credentials, and evidence of results.");

  const skillCount = SKILL_TERMS.filter((term) => has(term)).length;
  const skills = category("Skills", [
    { passed: /\b(skills|core competencies|technical skills|key strengths|areas of expertise)\b/i.test(text), advice: "Add a clearly labeled Skills or Core Competencies section." },
    { passed: skillCount >= 3, advice: "Name at least three specific skills or tools you genuinely use, rather than relying only on general claims." },
    { passed: SKILL_TERMS.slice(14).some((term) => has(term)), advice: "Include relevant software, equipment, systems, methods, or tools you have actually used." },
    { passed: SKILL_TERMS.slice(0, 14).some((term) => has(term)), advice: "Include transferable skills supported by examples from your experience." },
  ], jobDescription.trim() ? 20 : 30, "Specific skills and tools that a resume parser can recognize.");

  const traits = category("Professional traits evidence", [
    { passed: has("teamwork") || has("collaboration") || has("cross-functional"), advice: "If accurate, show how you worked with teammates, customers, or other departments." },
    { passed: has("communication") || has("written communication") || has("presentations"), advice: "Add an example of communication, customer support, documentation, or presenting information." },
    { passed: has("leadership") || has("initiative") || has("mentoring") || has("trained") || has("led"), advice: "Describe a real example of taking initiative, training someone, or leading a task." },
    { passed: has("adaptability") || has("problem solving") || has("problem-solving") || has("troubleshooting") || has("resolved"), advice: "Include an example of adapting to change or resolving a work problem." },
  ], jobDescription.trim() ? 10 : 20, "Explicit, work-related evidence of professional behaviors—not a judgment of your personality.");

  const categories = [details, qualifications, skills, traits];
  let keywordMatch: ResumeScoreResult["keywordMatch"];
  if (jobDescription.trim()) {
    const terms = keywordTerms(jobDescription);
    const matched = terms.filter((term) => has(term));
    const missing = terms.filter((term) => !has(term));
    const score = terms.length ? Math.round((matched.length / terms.length) * 100) : 0;
    keywordMatch = { score, matched: matched.slice(0, 12), missing: missing.slice(0, 12) };
    categories.push({
      name: "Target-job keywords",
      score,
      weight: 35,
      summary: "Overlap between terms in the target description and words in your resume.",
      recommendations: missing.length
        ? ["Review these target-job terms and add only those that accurately describe your experience: " + missing.slice(0, 6).join(", ") + "."]
        : ["Your resume includes the main terms detected in this description; verify that each skill is supported by a truthful example."],
    });
  }

  const totalWeight = categories.reduce((total, item) => total + item.weight, 0);
  const score = Math.round(categories.reduce((total, item) => total + item.score * item.weight, 0) / totalWeight);
  const label = score >= 85 ? "Strong starting point" : score >= 70 ? "Good foundation" : score >= 50 ? "Room to strengthen" : "Needs more detail";
  return {
    score,
    label,
    categories,
    keywordMatch,
    platformScores: scoreResumeAcrossPlatforms(resume, jobDescription),
    disclaimer: "This is a transparent, browser-based checklist estimate—not a score from a real ATS, a hiring prediction, or a judgment of your personality. Professional traits are counted only when your text explicitly mentions related evidence. Different employers and applicant-tracking systems use different criteria.",
  };
}
