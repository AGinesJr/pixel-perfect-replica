import { scoreResume as scoreAcrossProfiles } from "./scorer/engine";
import type { ScoringInput, ScoreResult } from "./scorer/types";

const SECTION_PATTERNS: Array<[string, RegExp]> = [
  ["experience", /^(?:professional\s+)?(?:work\s+)?(?:experience|employment|work history|professional history|career history)\s*:?$/i],
  ["education", /^(?:education|academic background|qualifications|degrees?)\s*:?$/i],
  ["skills", /^(?:skills|technical skills|core competencies|competencies|areas of expertise|key skills)\s*:?$/i],
  ["certifications", /^(?:certifications?|licenses?|credentials?)\s*:?$/i],
  ["projects", /^(?:projects|selected projects|portfolio)\s*:?$/i],
  ["summary", /^(?:professional summary|summary|profile|objective|career objective)\s*:?$/i],
];

function sectionContent(text: string, sectionNames: string[]): string {
  const lines = text.split(/\r?\n/);
  let active = false;
  const selected: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    const detected = SECTION_PATTERNS.find(([, pattern]) => pattern.test(trimmed));
    if (detected) {
      active = sectionNames.includes(detected[0]);
      continue;
    }
    if (active) {
      if (/^[A-Z][A-Z &/()-]{2,45}:?$/.test(trimmed) && trimmed.length < 46) {
        active = false;
      } else if (trimmed) {
        selected.push(trimmed);
      }
    }
  }
  return selected.join("\n");
}

function buildInput(resumeText: string, jobDescription = ""): ScoringInput {
  const text = resumeText.trim();
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const sections = new Set<string>();
  if (/\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b/i.test(text) || /(?:\+?\d[\d().\s-]{7,}\d)/.test(text)) {
    sections.add("contact");
  }
  for (const [name, pattern] of SECTION_PATTERNS) {
    if (lines.some((line) => pattern.test(line.replace(/\s*[-–—].*$/, "").trim()))) sections.add(name);
  }
  if (/\b(?:experience|employment|work history|professional history|career history)\b/i.test(text)) sections.add("experience");
  if (/\b(?:education|degree|diploma|high school|bachelor|associate|master|university|college|ged)\b/i.test(text)) sections.add("education");
  if (/\b(?:skills|core competencies|technical skills|key skills)\b/i.test(text)) sections.add("skills");

  const experienceText = sectionContent(text, ["experience"]);
  const experienceBullets = (experienceText || lines.filter((line) => /^[•*▪‣-]\s+/.test(line)).join("\n"))
    .split(/\r?\n/)
    .map((line) => line.replace(/^[•*▪‣-]\s*/, "").trim())
    .filter((line) => line.length >= 12 && !/^(?:19|20)\d{2}\s*[-–—]/.test(line));
  const skillsText = sectionContent(text, ["skills"]);
  const resumeSkills = [...new Set((skillsText || "").toLowerCase().match(/[a-z][a-z0-9+#./-]{1,}/g) || [])]
    .filter((word) => word.length > 2);
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const pageCount = Math.max(1, Math.ceil(wordCount / 500));
  const hasTables = /\t{2,}|\|[^\n]+\|/.test(text);
  const hasMultipleColumns = /\S {4,}\S/.test(text.split(/\r?\n/).slice(0, 20).join("\n")) && hasTables;

  return {
    resumeText: text,
    resumeSkills,
    resumeSections: [...sections],
    experienceBullets,
    educationText: sectionContent(text, ["education"]),
    hasMultipleColumns,
    hasTables,
    hasImages: false,
    pageCount,
    wordCount,
    jobDescription: jobDescription.trim() || undefined,
  };
}

export function scoreResumeAcrossPlatforms(resumeText: string, jobDescription = ""): ScoreResult[] {
  return scoreAcrossProfiles(buildInput(resumeText, jobDescription));
}
