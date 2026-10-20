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


export type ScoreImprovementTask = {
  id: string;
  title: string;
  priority: "Must-have" | "Recommended";
  action: string;
  reason: string;
  type: "resume" | "skill";
};

/**
 * Converts the actual checklist and simulated ATS results into a short,
 * prioritized action plan. Suggestions are guidance, not claims that the
 * applicant has a skill they have not demonstrated.
 */
export function buildScoreImprovementPlan(
  result: ResumeScoreResult,
  jobDescription = "",
  resume = "",
): ScoreImprovementTask[] {
  const candidates: ScoreImprovementTask[] = [];
  const resumeText = normalize(resume);
  const jobTerms = (result.keywordMatch?.missing ?? [])
    .filter((term) => term.length > 3 && !includesTerm(resumeText, term))
    .slice(0, 5);
  const roleContext = jobDescription.trim()
    ? "the target job listing"
    : "the roles you are targeting";

  const add = (task: ScoreImprovementTask) => {
    const normalizedTitle = normalize(task.title);
    const normalizedAction = normalize(task.action);
    if (!normalizedTitle || candidates.some((existing) =>
      normalize(existing.title) === normalizedTitle ||
      normalize(existing.action) === normalizedAction
    )) return;
    candidates.push(task);
  };

  const detailFor = (recommendation: string) => {
    const text = recommendation.toLowerCase();
    if (/professional name|resume header/.test(text)) return {
      title: "Add a clear resume header",
      action: "At the top of the resume, put your name on its own line, followed by your preferred phone number, professional email, and city/state. Keep contact details in the document body rather than a header or footer.",
      type: "resume" as const,
    };
    if (/email address/.test(text)) return {
      title: "Add a recruiter-ready email address",
      action: "Add a professional email beside your phone number near the top of the resume. Check spelling and make sure the address is one you monitor; do not add private account details.",
      type: "resume" as const,
    };
    if (/phone number/.test(text)) return {
      title: "Add a preferred contact number",
      action: "If you want employers to call, add the number where you can reliably receive messages. Include it in the resume body near your email and confirm it is current.",
      type: "resume" as const,
    };
    if (/city and state|location/.test(text)) return {
      title: "Clarify your work location",
      action: "Add your city and state near your contact details when relevant to the position. If the listing specifies on-site, hybrid, or travel expectations, make sure your application accurately reflects your availability.",
      type: "resume" as const,
    };
    if (/professional summary|summary tailored/.test(text)) return {
      title: "Write a role-focused professional summary",
      action: `Write 2–3 lines that connect your strongest real experience to ${roleContext}. Use this structure: “[${jobTerms[0] ?? "Relevant skill"}] professional with experience in [real task or setting], known for [evidence-backed strength].” Replace every bracket with truthful details and remove any claim you cannot support.`,
      type: "resume" as const,
    };
    if (/linkedin|portfolio|work-sample|website/.test(text)) return {
      title: "Add a relevant professional profile or work sample",
      action: "If you have a current LinkedIn profile, portfolio, or relevant work sample, add a clean link to the contact line. Open the link in a private browser window to confirm it works and contains only information you intend to share.",
      type: "resume" as const,
    };
    if (/work experience|employment history|section/.test(text) && /experience|employment/.test(text)) return {
      title: "Make your work history easy to scan",
      action: "Add a standard “Work Experience” heading. For each role, use job title, employer, location (optional), and dates, followed by 2–4 concise bullets that describe what you did and the result.",
      type: "resume" as const,
    };
    if (/education section|education and relevant degrees/.test(text)) return {
      title: "Add a clear education section",
      action: "Create an “Education” heading and list the school or training provider, credential (or program), and completion date or expected date. Include relevant coursework only when it directly supports the role; never imply a degree you have not earned.",
      type: "resume" as const,
    };
    if (/certification|license|credential/.test(text)) return {
      title: "Verify role-relevant credentials",
      action: `Compare the listing's required credentials with certificates or licenses you actually hold. Add the exact credential name and status/date when accurate; if a required credential is missing, record how to obtain it instead of listing it as completed.`,
      type: "skill" as const,
    };
    if (/accomplishments|numbers|truthful accomplishments/.test(text)) return {
      title: "Turn two duties into measurable accomplishments",
      action: "Choose two existing experience bullets and rewrite each as action + task + result. Example: “Organized daily inventory checks, helping the team reduce stock discrepancies by [verified amount].” Use a real number only if you can explain where it came from; otherwise describe the observable outcome without a number.",
      type: "resume" as const,
    };
    if (/dates|durations|timeline/.test(text)) return {
      title: "Clarify dates and work timeline",
      action: "Use one date style consistently (for example, “May 2023 – Aug 2025”) for each role and education entry. Check for unexplained overlaps or typos; do not invent dates or hide experience inaccurately.",
      type: "resume" as const,
    };
    if (/skills or core competencies/.test(text)) return {
      title: "Build a focused skills section",
      action: `Add a “Skills” heading with 6–10 relevant skills that you can demonstrate. Prioritize true matches to ${roleContext}; move each important skill into an experience bullet where you have a concrete example.`,
      type: "resume" as const,
    };
    if (/specific skills or tools|software|equipment|systems|methods/.test(text)) return {
      title: "Name the tools you have actually used",
      action: `Review ${roleContext} for named software, equipment, systems, or methods. Add only tools you have used and, where possible, show them in a bullet describing the task you completed with them. For a missing must-have tool, make a practice plan rather than claiming proficiency.`,
      type: "skill" as const,
    };
    if (/transferable skills|teamwork|collaboration/.test(text)) return {
      title: "Prove a transferable skill with an example",
      action: "Pick one real project or shift where you worked with others. Add a bullet describing your contribution, who you coordinated with, and the outcome; replace a bare claim such as “team player” with evidence.",
      type: "resume" as const,
    };
    if (/communication|presenting information|customer support/.test(text)) return {
      title: "Show communication in a concrete work example",
      action: "Add one bullet showing how you communicated with customers, coworkers, or stakeholders. State the situation, what you explained or documented, and the result (for example, fewer errors, a resolved question, or a smoother handoff) only if accurate.",
      type: "resume" as const,
    };
    if (/initiative|training someone|leading a task|leadership/.test(text)) return {
      title: "Add evidence of initiative or training",
      action: "Identify a time you volunteered for a task, trained a coworker, or helped coordinate work. Write one bullet beginning with a precise verb such as “Trained,” “Coordinated,” or “Improved,” then explain the scope and verified result.",
      type: "resume" as const,
    };
    if (/problem|adapting|resolving|troubleshooting/.test(text)) return {
      title: "Describe one problem you resolved",
      action: "Choose a real work or school problem and write a short STAR bullet: situation/task, action you personally took, and result. Keep the details relevant to the target role and avoid sharing confidential employer or customer information.",
      type: "resume" as const,
    };
    return {
      title: recommendation.replace(/[.:]+$/, "").slice(0, 90),
      action: `1) Review the relevant section of your resume. 2) Apply this check: ${recommendation} 3) Add a concrete example from your own experience, or leave the claim out if you cannot support it. Tailor the wording to ${roleContext} without copying requirements as if they were experience.`,
      type: /skill|tool|software|certification|practice|learn|course/i.test(recommendation) ? "skill" as const : "resume" as const,
    };
  };

  for (const item of result.categories) {
    for (const recommendation of item.recommendations) {
      const detail = detailFor(recommendation);
      add({
        id: `category-${item.name}-${candidates.length}`,
        title: detail.title,
        priority: item.score < 55 ? "Must-have" : "Recommended",
        action: detail.action,
        reason: `${item.name} scored ${item.score}%. This task addresses a specific gap found in your resume check. ${jobDescription.trim() ? "Confirm the change supports a real requirement in the target listing." : "Prioritize changes relevant to the jobs you want."}`,
        type: detail.type,
      });
    }
  }

  if (jobDescription.trim() && result.keywordMatch?.missing.length) {
    const terms = jobTerms.slice(0, 4);
    if (terms.length) add({
      id: "target-job-evidence",
      title: "Map key job requirements to truthful resume evidence",
      priority: result.keywordMatch.score < 50 ? "Must-have" : "Recommended",
      action: `1) Review these terms from the listing: ${terms.join(", ")}. 2) For each term, find a real example in your work, education, volunteering, or training. 3) Add the strongest example to the relevant experience bullet using an action and outcome. If you have no evidence for a must-have, mark it as a skill to develop—do not add the keyword as an unsupported claim.`,
      reason: `The text-overlap estimate is ${result.keywordMatch.score}%; missing words may be a wording gap or a genuine skill gap. Validate each term against the full listing before editing.`,
      type: "resume",
    });
  }

  const weakFormatting = result.platformScores.some((platform) =>
    platform.breakdown.formatting.score < 70 || platform.breakdown.formatting.issues.length > 0
  );
  if (weakFormatting) add({
    id: "ats-format",
    title: "Improve readability for resume parsers",
    priority: "Must-have",
    action: "Use standard headings, a simple single-column layout, readable type, and consistent dates. Keep important contact details in the document body; avoid tables, text boxes, and graphics for essential information. Export as a text-selectable PDF or DOCX, then copy its text into a plain-text editor to check reading order.",
    reason: "One or more simulated parser profiles flagged layout concerns. This is a formatting check, not a prediction of any specific employer's system.",
    type: "resume",
  });

  const lowQuantification = result.platformScores.some((platform) =>
    platform.breakdown.experience.totalBullets > 0 &&
    platform.breakdown.experience.quantifiedBullets < platform.breakdown.experience.totalBullets
  );
  if (lowQuantification) add({
    id: "measurable-impact",
    title: "Strengthen two experience bullets with outcomes",
    priority: "Recommended",
    action: "Select two bullets that currently describe duties only. Rewrite them with an action verb, the task or scope, and the result. Example: “Resolved customer questions at the service desk and documented recurring issues for the team.” Add verified volume, time, quality, or sales figures only when you can substantiate them.",
    reason: "The simulated parser profiles found experience bullets where the impact could be clearer.",
    type: "resume",
  });

  if (jobDescription.trim() && result.keywordMatch?.missing.length) add({
    id: "target-skill-development",
    title: "Make a plan for one genuine skill gap",
    priority: "Recommended",
    action: "Choose the highest-priority requirement you cannot yet demonstrate. Find a free reputable lesson, practice environment, or supervised opportunity; set one measurable milestone for this week and keep a note of what you complete. Add the skill to your resume only after you can honestly demonstrate it.",
    reason: "This separates a real development need from a resume wording gap and gives you a practical next step.",
    type: "skill",
  });

  // Avoid near-duplicate tasks by grouping common topics as well as exact titles.
  const topicFor = (task: ScoreImprovementTask) => {
    const value = normalize(task.title + " " + task.action);
    if (/format|parser|single column|readability/.test(value)) return "formatting";
    if (/keyword|job requirement|target listing|target job evidence/.test(value)) return "job-evidence";
    if (/measurable|quantif|outcome|accomplishment/.test(value)) return "impact";
    if (/skill gap|build a plan|training|free reputable lesson/.test(value)) return "skill-development";
    if (/skill section|tools you have actually used/.test(value)) return "skills-inventory";
    if (/communication|teamwork|transferable skill|initiative|problem you resolved/.test(value)) return "behavioral-evidence-" + task.title.toLowerCase();
    return normalize(task.title);
  };
  const unique: ScoreImprovementTask[] = [];
  const seenTitles = new Set<string>();
  const seenTopics = new Set<string>();
  for (const task of candidates) {
    const titleKey = normalize(task.title);
    const topicKey = topicFor(task);
    if (seenTitles.has(titleKey) || seenTopics.has(topicKey)) continue;
    seenTitles.add(titleKey);
    seenTopics.add(topicKey);
    unique.push(task);
  }

  // Keep must-have gaps first while retaining recommended work when it is available.
  const mustHave = unique.filter((task) => task.priority === "Must-have");
  const recommended = unique.filter((task) => task.priority === "Recommended");
  const ordered = mustHave.length && recommended.length
    ? [...mustHave.slice(0, 7), ...recommended.slice(0, 3), ...mustHave.slice(7), ...recommended.slice(3)]
    : [...mustHave, ...recommended];
  return ordered.slice(0, 10).map((task, index) => ({
    ...task,
    id: task.id || `task-${index}`,
  }));
}
