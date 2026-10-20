import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ExternalLink as ExternalLinkIcon, FileText, UploadCloud } from "lucide-react";
import { RichTextEditor, plainTextFromRichTextHtml, sanitizeRichTextHtml } from "@/components/RichTextEditor";
import { extractResumeContent } from "@/lib/resume-file-parser";
import { useProgress } from "@/lib/progress";
import { buildScoreImprovementPlan, scoreResume, type ResumeScoreResult } from "@/lib/resume-ats-scoring";
import { jobs } from "@/lib/data";
import { rankJobsForResume } from "@/lib/resume-job-matching";
import { searchLiveJobs } from "@/lib/jobs.functions";

type LiveJob = {
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
  location?: string;
  source?: "Himalayas" | "USAJOBS";
  isRemote?: boolean;
};
type LiveJobMatch = { job: LiveJob; score: number; matchedKeywords: string[]; missingKeywords: string[] };

const MATCH_STOP_WORDS = new Set([
  "and", "the", "for", "with", "from", "that", "this", "your", "you", "our", "their",
  "have", "has", "had", "are", "was", "were", "will", "can", "may", "able", "ability",
  "experience", "years", "year", "plus", "preferred", "required", "including", "such",
  "into", "using", "use", "work", "working", "role", "job", "team", "teams", "strong",
  "excellent", "good", "knowledge", "skills", "skill", "support", "provide", "ensure",
  "maintain", "related", "relevant", "degree", "all", "other", "within", "across",
  "daily", "who", "what", "when", "where", "will", "must", "not", "you", "they",
]);

function matchKeywords(value: string): string[] {
  return [...new Set((value.toLowerCase().match(/[a-z][a-z0-9+#.-]{2,}/g) ?? [])
    .map((word) => word.replace(/^[.+-]+|[.+-]+$/g, ""))
    .filter((word) => word.length > 2 && !MATCH_STOP_WORDS.has(word)))];
}

function scoreLiveJobMatch(resume: string, job: LiveJob): LiveJobMatch {
  const resumeKeywords = new Set(matchKeywords(resume));
  const titleKeywords = matchKeywords(job.title ?? "");
  const descriptionKeywords = matchKeywords(
    [job.excerpt, job.description, ...(job.categories ?? [])].filter(Boolean).join(" ").replace(/<[^>]*>/g, " "),
  ).filter((word) => !titleKeywords.includes(word)).slice(0, 10);
  const keywords = [...titleKeywords, ...descriptionKeywords].slice(0, 15);
  const matchedKeywords = keywords.filter((word) => resumeKeywords.has(word));
  const missingKeywords = keywords.filter((word) => !resumeKeywords.has(word));
  const titleMatched = titleKeywords.filter((word) => resumeKeywords.has(word)).length;
  const titleWeight = titleKeywords.length * 2;
  const score = keywords.length
    ? Math.round(((titleMatched * 2 + Math.max(0, matchedKeywords.length - titleMatched)) / Math.max(1, titleWeight + Math.max(0, keywords.length - titleKeywords.length))) * 100)
    : 0;
  return { job, score, matchedKeywords, missingKeywords };
}

function buildResumeMatchTips(resume: string, matches: LiveJobMatch[]): string[] {
  const tips: string[] = [];
  const resumeKeywords = new Set(matchKeywords(resume));
  const missingCounts = new Map<string, number>();
  for (const match of matches) {
    for (const keyword of match.missingKeywords) {
      missingCounts.set(keyword, (missingCounts.get(keyword) ?? 0) + 1);
    }
  }
  const highValueGaps = [...missingCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([word]) => word)
    .filter((word) => !resumeKeywords.has(word))
    .slice(0, 6);

  if (highValueGaps.length) {
    tips.push(`If accurate for your background, add specific examples using job-related terms such as ${highValueGaps.slice(0, 5).join(", ")}. Include them in your experience or skills section only where they genuinely apply.`);
  }
  tips.push("Tailor your summary to the closest roles: name the type of work you do best and the strongest relevant experience you bring.");
  tips.push("Turn general duties into evidence of impact. Add truthful numbers where possible, such as customers served, tasks completed, time saved, sales achieved, or team size.");
  tips.push("Move the most relevant skills and accomplishments near the top so employers can spot the match quickly; use wording from each posting when it accurately describes your experience.");
  tips.push("Review each listing for required tools, licenses, certifications, or training. Add only credentials you already hold, or note relevant training you are actively completing.");
  return tips.slice(0, 5);
}

function distinctPracticeMatches(resume: string) {
  const ranked = rankJobsForResume(resume, jobs, jobs.length);
  const seen = new Set<string>();
  return ranked.filter((result) => {
    const title = result.job.title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if (!title || seen.has(title)) return false;
    seen.add(title);
    return true;
  }).slice(0, 3);
}

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Resume Studio — Workforce Prep" },
      { name: "description", content: "Edit, score, and match your resume to career-practice jobs in one workspace." },
      { property: "og:title", content: "Resume Studio — Workforce Prep" },
      { property: "og:description", content: "Edit, score, and match your resume to career-practice jobs in one workspace." },
    ],
  }),
  component: Profile,
});

function Profile() {
  const { state, update, ready } = useProgress();
  const getLiveJobs = useServerFn(searchLiveJobs);
  const [resume, setResume] = useState("");
  const [resumeHtml, setResumeHtml] = useState("");
  const [jobDescriptionHtml, setJobDescriptionHtml] = useState("");
  const [saved, setSaved] = useState(false);
  const [notice, setNotice] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [scoreResult, setScoreResult] = useState<ResumeScoreResult | null>(null);
  const [completedImprovementTasks, setCompletedImprovementTasks] = useState<string[]>([]);
  const [analyzedResume, setAnalyzedResume] = useState("");
  const [matchError, setMatchError] = useState("");
  const [liveMatchAsked, setLiveMatchAsked] = useState(false);
  const [liveMatchLoading, setLiveMatchLoading] = useState(false);
  const [liveMatchError, setLiveMatchError] = useState("");
  const [liveMatches, setLiveMatches] = useState<LiveJobMatch[]>([]);
  const [liveMatchTips, setLiveMatchTips] = useState<string[]>([]);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [selectedFileName, setSelectedFileName] = useState("");
  const resumeFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!ready) return;
    setResume(state.resume);
    const storedHtml = localStorage.getItem("wp-resume-rich-html") ?? "";
    const safeHtml = sanitizeRichTextHtml(storedHtml);
    setResumeHtml(storedHtml && plainTextFromRichTextHtml(safeHtml) === state.resume ? safeHtml : "");
  }, [ready, state.resume]);

  useEffect(() => {
    const onSyncError = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail;
      setNotice(`Cloud sync issue: ${detail} Your data remains in this browser.`);
    };
    window.addEventListener("wp-sync-error", onSyncError);
    return () => window.removeEventListener("wp-sync-error", onSyncError);
  }, []);

  async function handleResumeUpload(file?: File) {
    setUploadError("");
    if (!file) return;

    setUploadBusy(true);
    try {
      const extracted = await extractResumeContent(file);
      const extractedText = extracted.text
        .split(String.fromCharCode(0)).join("")
        .replace(/\r/g, "\n")
        .replace(/[ \t]+\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

      if (extractedText.length < 40) {
        throw new Error(
          "We couldn't find enough selectable text in this file. If it's a scanned PDF, run OCR on it first or paste the resume text below.",
        );
      }

      const safeHtml = sanitizeRichTextHtml(extracted.html);
      const formattedText = plainTextFromRichTextHtml(safeHtml)
        .split(String.fromCharCode(0)).join("")
        .replace(/\r/g, "\n")
        .replace(/[ \t]+\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
      const normalized = (formattedText.length >= 40 ? formattedText : extractedText).slice(0, 15000);

      setResume(normalized);
      setResumeHtml(safeHtml);
      localStorage.setItem("wp-resume-rich-html", safeHtml);
      setSelectedFileName(file.name);
      setSaved(false);
      setScoreResult(null);
      setAnalyzedResume("");
      setMatchError("");
      setNotice(
        extractedText.length > 15000
          ? "Resume imported with detected headings, bold text, and list structure. Only the first 15,000 characters were added; review and trim it below."
          : "Resume imported with detected headings, bold text, and list structure. Review the formatting and text below before scoring or saving.",
      );
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : "We couldn't read that file. Try another PDF or Word .docx file.",
      );
    } finally {
      setUploadBusy(false);
      if (resumeFileRef.current) resumeFileRef.current.value = "";
    }
  }

  function saveResume(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    update((current) => ({ ...current, resume }));
    if (resumeHtml) localStorage.setItem("wp-resume-rich-html", sanitizeRichTextHtml(resumeHtml));
    setSaved(true);
    setNotice("Your resume was saved in this browser. If signed in, cloud sync is also being attempted.");
  }

  function matchResume() {
    if (resume.trim().length < 40) {
      setMatchError("Add at least 40 characters of resume detail before matching.");
      return;
    }
    setMatchError("");
    setAnalyzedResume(resume.trim());
  }

  const matchResults = useMemo(
    () => analyzedResume ? distinctPracticeMatches(analyzedResume) : [],
    [analyzedResume],
  );

  async function matchToLiveJobs() {
    const resumeText = resume.trim();
    if (resumeText.length < 40) {
      setLiveMatchError("Add at least 40 characters of resume detail before matching.");
      return;
    }
    setLiveMatchAsked(true);
    setLiveMatchLoading(true);
    setLiveMatchError("");
    setLiveMatches([]);
    setLiveMatchTips([]);
    try {
      const practiceTitles = distinctPracticeMatches(resumeText).map((result) => result.job.title).slice(0, 3);
      const queries = practiceTitles.length ? practiceTitles : [""];
      const responses = await Promise.allSettled(queries.map((query) => getLiveJobs({ data: {
        query: query.slice(0, 120),
        city: state.city ?? "",
        state: state.state ?? "",
        zip: state.zipCode ?? "",
        radius: 25,
        seniority: "",
        employmentType: "",
        page: 1,
      } })));
      const successful = responses.flatMap((response) => response.status === "fulfilled" ? [response.value] : []);
      if (!successful.length) throw new Error("Live job listings are temporarily unavailable. Please try again later.");
      const unique = new Map<string, LiveJob>();
      for (const response of successful) {
        for (const job of response.jobs as LiveJob[]) {
          const key = (job.applicationLink || job.guid || [job.companyName, job.title].join("-")).toLowerCase();
          if (!unique.has(key)) unique.set(key, job);
        }
      }
      if (!unique.size) {
        const fallback = await getLiveJobs({ data: {
          query: "",
          city: state.city ?? "",
          state: state.state ?? "",
          zip: state.zipCode ?? "",
          radius: 25,
          seniority: "",
          employmentType: "",
          page: 1,
        } });
        for (const job of fallback.jobs as LiveJob[]) {
          const key = (job.applicationLink || job.guid || [job.companyName, job.title].join("-")).toLowerCase();
          if (!unique.has(key)) unique.set(key, job);
        }
      }
      const ranked = [...unique.values()]
        .map((job) => scoreLiveJobMatch(resumeText, job))
        .sort((a, b) => b.score - a.score || (a.job.title ?? "").localeCompare(b.job.title ?? ""))
        .slice(0, 3);
      setLiveMatches(ranked);
      setLiveMatchTips(buildResumeMatchTips(resumeText, ranked));
      if (!ranked.some((result) => result.score > 80)) {
        setLiveMatchError("No live postings in the current job-board results scored above 80%. Try again later as listings refresh, or broaden your resume details and practice matches.");
      }
    } catch (error) {
      setLiveMatchError(error instanceof Error ? error.message : "We couldn’t match your resume to live job listings. Please try again.");
    } finally {
      setLiveMatchLoading(false);
    }
  }

  const improvementPlan = useMemo(
    () => scoreResult ? buildScoreImprovementPlan(scoreResult, jobDescription, resume) : [],
    [scoreResult, jobDescription, resume],
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Career tools</p>
        <h1 className="mt-2 text-3xl font-bold md:text-4xl">Resume Studio</h1>
        <p className="mt-2 text-muted-foreground">
          Write and save your resume, check its readiness, and find simulated practice roles that may align with your experience—all in one place.
        </p>
      </div>

      <section className="mt-6 rounded-lg border bg-card p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold">Personal contact details</h2>
            <p className="mt-1 text-sm text-muted-foreground">Your name, contact information, location, and profile photo are managed separately.</p>
          </div>
          <Link to="/account" className="inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-semibold">Manage account &amp; profile</Link>
        </div>
        {(state.name || state.contactEmail || state.phone || state.city || state.state || state.zipCode) && (
          <div className="mt-4 border-t pt-4 text-sm">
            {state.name && <p className="font-semibold">{state.name}</p>}
            {state.contactEmail && <p>{state.contactEmail}</p>}
            {state.phone && <p>{state.phone}</p>}
            {(state.city || state.state || state.zipCode) && <p>{[state.city, state.state, state.zipCode].filter(Boolean).join(", ")}</p>}
          </div>
        )}
      </section>

      <form onSubmit={saveResume} className="mt-6 space-y-4 rounded-lg border bg-card p-6">
        <div>
          <h2 className="font-semibold">1. Upload Your Resume</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Add work history, education, skills, certifications, and achievements. Avoid including Social Security numbers, account numbers, or other sensitive information.
          </p>
        </div>
        <div className="rounded-lg border border-dashed p-4 md:p-5">
          <input
            ref={resumeFileRef}
            type="file"
            accept=".pdf,.doc,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
            onChange={(event) => void handleResumeUpload(event.target.files?.[0])}
            className="sr-only"
            id="resume-file-upload"
            aria-label="Upload resume as PDF or Word document"
          />
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary"><UploadCloud className="h-5 w-5" /></span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">Upload a resume for review</p>
              <p className="mt-1 text-xs text-muted-foreground">PDF or Word .docx · up to 10 MB · file text is extracted in your browser</p>
              {selectedFileName && <p className="mt-1 truncate text-xs text-muted-foreground">Last imported: {selectedFileName}</p>}
            </div>
            <button type="button" onClick={() => resumeFileRef.current?.click()} disabled={uploadBusy} className="inline-flex h-10 items-center gap-2 rounded-md border px-4 text-sm font-semibold hover:bg-muted disabled:opacity-50">
              <FileText className="h-4 w-4" /> {uploadBusy ? "Reading file…" : "Choose file"}
            </button>
          </div>
          {uploadBusy && <p className="mt-3 text-sm text-muted-foreground" role="status">Extracting resume text… larger PDFs may take a moment.</p>}
          {uploadError && <p role="alert" className="mt-3 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{uploadError}</p>}
        </div>

        <p className="text-center text-xs text-muted-foreground">Or paste or write your resume below</p>
        <RichTextEditor
          value={resume}
          htmlValue={resumeHtml}
          onChange={(text) => { setResume(text.slice(0, 15000)); setSaved(false); setScoreResult(null); setAnalyzedResume(""); setMatchError(""); }}
          onHtmlChange={(html) => { setResumeHtml(html); localStorage.setItem("wp-resume-rich-html", html); }}
          label="Resume text"
          placeholder="Your extracted resume text will appear here. Paste a formatted resume or edit it here…"
          minHeightClass="min-h-[28rem]"
        />
        <p className="text-right text-xs text-muted-foreground">{resume.length.toLocaleString()} / 15,000 characters</p>
        {notice && <p role="status" className="text-sm text-muted-foreground">{notice}</p>}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">Imported files are read in your browser and are not stored as files. The extracted text can be edited, scored, matched, and saved like pasted text.</p>
          <button disabled={!ready} className="h-11 rounded-md bg-primary px-6 font-semibold text-primary-foreground disabled:opacity-50">{saved ? "Resume saved ✓" : "Save resume"}</button>
        </div>
      </form>

      <section className="mt-6 rounded-xl border bg-card p-5 md:p-6">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Resume checkup</p>
          <h2 className="mt-1 text-2xl font-bold">2. Resume Analysis</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Check resume details, qualifications, skills, and evidence of professional traits. For a more targeted estimate, add the job description you plan to apply to.
          </p>
        </div>
        <label className="mt-5 block">
          <span className="font-semibold">Target job description <span className="font-normal text-muted-foreground">(optional)</span></span>
          <span className="mt-1 block text-sm text-muted-foreground">Paste the job requirements to see which relevant terms appear in your resume. Use only skills and qualifications that genuinely apply to you.</span>
          <div className="mt-2">
            <RichTextEditor
              value={jobDescription}
              htmlValue={jobDescriptionHtml}
              onChange={(text) => { setJobDescription(text.slice(0, 12000)); setScoreResult(null); }}
              onHtmlChange={setJobDescriptionHtml}
              label="Target job description"
              placeholder="Paste the job listing here. Headings, bullets, and emphasis are preserved…"
              minHeightClass="min-h-40"
            />
          </div>
        </label>
        <button type="button" onClick={() => { setScoreResult(scoreResume(resume, { name: state.name, email: state.contactEmail, phone: state.phone, city: state.city, state: state.state }, jobDescription)); setCompletedImprovementTasks([]); }} disabled={!ready || resume.trim().length < 40} className="mt-4 h-11 rounded-md bg-primary px-5 font-semibold text-primary-foreground disabled:opacity-50">
          Analyze my resume
        </button>
        {resume.trim().length < 40 && <p className="mt-2 text-sm text-muted-foreground">Add at least 40 characters to your resume to calculate a score.</p>}
        {scoreResult && <div className="mt-6 space-y-5" aria-live="polite">
          <div className="flex flex-col gap-4 rounded-lg border bg-muted/40 p-5 sm:flex-row sm:items-center">
            <div className="grid h-24 w-24 shrink-0 place-items-center rounded-full border-4 border-primary text-center">
              <div><p className="metric-value font-display text-3xl font-bold leading-none">{scoreResult.score}</p><p className="mt-1 text-xs text-muted-foreground">out of 100</p></div>
            </div>
            <div><h3 className="text-xl font-bold">{scoreResult.label}</h3><p className="mt-1 text-sm text-muted-foreground">ATS-style checklist estimate · not an employer ATS score</p><p className="mt-2 text-sm">Use the category breakdown below to improve clarity and role relevance—not to game an automated filter.</p></div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {scoreResult.categories.map((item) => <article key={item.name} className="rounded-lg border p-4">
              <div className="flex items-start justify-between gap-3"><h3 className="font-semibold">{item.name}</h3><span className="metric-value shrink-0 text-lg font-bold">{item.score}%</span></div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: item.score + "%" }} /></div>
              <p className="mt-2 text-sm text-muted-foreground">{item.summary}</p>
              {item.recommendations.length > 0 ? <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">{item.recommendations.map((recommendation) => <li key={recommendation}>{recommendation}</li>)}</ul> : <p className="mt-3 text-sm">No checklist gaps detected in this category. Review for accuracy before applying.</p>}
            </article>)}
          </div>
          <section className="rounded-xl border bg-muted/20 p-4 md:p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">Your next steps</p>
                <h3 className="mt-1 text-xl font-bold">How to Improve Your Resume</h3>
                <p className="mt-1 max-w-3xl text-sm text-muted-foreground">A prioritized, job-specific checklist built from your resume and the target listing. Each item is a distinct task with concrete steps or an example. The list includes only relevant actions (up to 10), mixes must-have gaps with recommended improvements, and never asks you to claim skills or credentials you do not have.</p>
              </div>
              <span className="shrink-0 rounded-full border px-3 py-1 text-xs font-semibold">{completedImprovementTasks.length} of {improvementPlan.length} complete</span>
            </div>
            {improvementPlan.length > 0 ? <ol className="mt-4 space-y-3">
              {improvementPlan.map((task, index) => {
                const completed = completedImprovementTasks.includes(task.id);
                return <li key={task.id} className={`rounded-lg border bg-card p-4 ${completed ? "opacity-70" : ""}`}>
                  <div className="flex items-start gap-3">
                    <input
                      id={`improvement-task-${index}`}
                      type="checkbox"
                      checked={completed}
                      onChange={(event) => setCompletedImprovementTasks((current) => event.target.checked ? [...current, task.id] : current.filter((id) => id !== task.id))}
                      className="mt-1 h-4 w-4 shrink-0 accent-primary"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <label htmlFor={`improvement-task-${index}`} className={`cursor-pointer font-semibold ${completed ? "line-through" : ""}`}>{index + 1}. {task.title}</label>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${task.priority === "Must-have" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>{task.priority}</span>
                        <span className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">{task.type === "skill" ? "Build skills" : "Improve resume"}</span>
                      </div>
                      <p className="mt-2 text-sm">{task.action}</p>
                      <p className="mt-2 text-xs leading-5 text-muted-foreground">Why this matters: {task.reason}</p>
                    </div>
                  </div>
                </li>;
              })}
            </ol> : <p className="mt-4 text-sm text-muted-foreground">No additional tasks were generated from this checkup. Review the score breakdown and make sure your resume is accurate and tailored to the role.</p>}
            {completedImprovementTasks.length > 0 && <button type="button" onClick={() => setCompletedImprovementTasks([])} className="mt-3 rounded-md border px-3 py-2 text-sm font-semibold hover:bg-muted">Reset checklist</button>}
          </section>
          <section className="space-y-3">
            <div>
              <h3 className="text-lg font-bold">Six simulated ATS platform profiles</h3>
              <p className="mt-1 text-sm text-muted-foreground">The same resume can be interpreted differently across systems. These are research-based simulations—not the vendors’ private algorithms, actual employer scores, or hiring predictions.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {scoreResult.platformScores.map((platform) => {
                const dimensions = [
                  { label: "Formatting", score: platform.breakdown.formatting.score },
                  { label: "Keywords", score: platform.breakdown.keywordMatch.score },
                  { label: "Sections", score: platform.breakdown.sections.score },
                  { label: "Experience", score: platform.breakdown.experience.score },
                  { label: "Education", score: platform.breakdown.education.score },
                ];
                return <article key={platform.system} className="min-w-0 rounded-lg border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0"><h4 className="font-semibold">{platform.system}</h4><p className="mt-1 text-xs text-muted-foreground">{platform.vendor}</p></div>
                    <span className="metric-value shrink-0 text-2xl font-bold">{platform.overallScore}<span className="text-sm">/100</span></span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: platform.overallScore + "%" }} /></div>
                  <p className="mt-2 text-xs text-muted-foreground">{platform.passesFilter ? "At or above this model’s illustrative threshold" : "Below this model’s illustrative threshold"}</p>
                  <div className="mt-4 space-y-2">
                    {dimensions.map((dimension) => <div key={dimension.label}>
                      <div className="flex justify-between gap-2 text-xs"><span>{dimension.label}</span><span className="metric-value font-semibold">{dimension.score}%</span></div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary/80" style={{ width: dimension.score + "%" }} /></div>
                    </div>)}
                  </div>
                  {platform.suggestions.length > 0 && <div className="mt-4 border-t pt-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Recommended improvements</p>
                    <ul className="mt-2 list-disc space-y-1.5 pl-4 text-xs leading-5">
                      {platform.suggestions.slice(0, 3).map((suggestion, index) => <li key={index}>{typeof suggestion === "string" ? suggestion : suggestion.summary}</li>)}
                    </ul>
                  </div>}
                </article>;
              })}
            </div>
          </section>
          {scoreResult.keywordMatch && <article className="rounded-lg border p-4">
            <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-semibold">Target-job keyword overlap</h3><p className="mt-1 text-sm text-muted-foreground">A simple word-overlap estimate, not a semantic or employer ATS analysis.</p></div><span className="metric-value text-xl font-bold">{scoreResult.keywordMatch.score}%</span></div>
            {scoreResult.keywordMatch.matched.length > 0 && <div className="mt-4"><h4 className="text-sm font-semibold">Terms found</h4><div className="mt-2 flex flex-wrap gap-2">{scoreResult.keywordMatch.matched.map((term) => <span key={term} className="rounded-full border px-2.5 py-1 text-xs">{term}</span>)}</div></div>}
            {scoreResult.keywordMatch.missing.length > 0 && <div className="mt-4"><h4 className="text-sm font-semibold">Terms to review</h4><p className="mt-1 text-xs text-muted-foreground">Add a term only if it truthfully reflects your skills or experience.</p><div className="mt-2 flex flex-wrap gap-2">{scoreResult.keywordMatch.missing.map((term) => <span key={term} className="rounded-full border border-dashed px-2.5 py-1 text-xs">{term}</span>)}</div></div>}
          </article>}
          <p className="text-xs leading-5 text-muted-foreground">{scoreResult.disclaimer} Your resume and target job description are analyzed in this browser and are not sent to an AI provider by this scoring feature.</p>
        </div>}
      </section>

      <section className="mt-6 rounded-xl border bg-card p-5 md:p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Personalized career prep</p>
        <h2 className="mt-1 text-2xl font-bold">3. Match your resume to practice jobs</h2>
        <p className="mt-2 text-sm text-muted-foreground">Compare your saved resume with fictional practice roles, review possible matches, and identify qualifications to strengthen. Matching runs in this browser.</p>
        <button type="button" onClick={matchResume} disabled={resume.trim().length < 40} className="mt-4 h-11 rounded-md bg-primary px-5 font-semibold text-primary-foreground disabled:opacity-50">Find matching practice jobs</button>
        {matchError && <p role="alert" className="mt-3 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{matchError}</p>}
        {analyzedResume && <div className="mt-6" aria-live="polite">
          <h3 className="text-xl font-bold">Your closest practice matches</h3>
          <p className="mt-1 text-sm text-muted-foreground">Ranked by keyword evidence across required qualifications, preferred qualifications, and role responsibilities.</p>
          <div className="mt-4 space-y-4">
            {matchResults.map((result) => {
              const found = [...result.required, ...result.preferred, ...result.responsibilities].filter((item) => item.found);
              const gaps = [...result.required, ...result.preferred].filter((item) => !item.found);
              return <article key={result.job.id} className="rounded-xl border bg-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Simulated role · not a live vacancy</p><h4 className="mt-1 text-xl font-bold"><Link to="/jobs/$id" params={{ id: result.job.id }} className="hover:text-primary">{result.job.title}</Link></h4><p className="mt-1 text-sm text-muted-foreground">{result.job.employer} · {result.job.industry} · {result.job.location}</p></div>
                  <div className="rounded-lg bg-muted px-4 py-3 text-center"><p className="text-2xl font-bold">{result.score}%</p><p className="text-xs text-muted-foreground">keyword fit</p></div>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: result.score + "%" }} /></div>
                <p className="mt-2 text-sm text-muted-foreground">{result.required.filter((item) => item.found).length} of {result.required.length} required qualifications show possible evidence · {result.matchedCount} of {result.totalCount} criteria matched</p>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div><h5 className="font-semibold">Possible matches</h5>{found.length ? <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{found.slice(0, 6).map((item) => <li key={item.text}>{item.text}</li>)}</ul> : <p className="mt-2 text-sm text-muted-foreground">No clear keyword evidence yet. Add relevant examples you genuinely have.</p>}</div>
                  <div><h5 className="font-semibold">Skills to review</h5>{gaps.length ? <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{gaps.slice(0, 6).map((item) => <li key={item.text}>{item.text}</li>)}</ul> : <p className="mt-2 text-sm text-muted-foreground">Possible evidence found for all listed qualifications. Prepare specific examples.</p>}</div>
                </div>
                <div className="mt-5 flex flex-wrap gap-3"><Link to="/jobs/$id" params={{ id: result.job.id }} className="rounded-md border px-4 py-2 text-sm font-semibold hover:bg-muted">Review role</Link><Link to="/apply/$id" params={{ id: result.job.id }} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">Practice applying</Link></div>
              </article>;
            })}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">These scores are keyword-overlap estimates, not hiring probabilities. A low score can mean your resume does not clearly describe a skill—not necessarily that you lack it. Roles shown are fictional practice listings.</p>
        </div>}
        <div className="mt-6 border-t pt-5">
          <h3 className="font-semibold">Want to match your resume to real job posts?</h3>
          <p className="mt-1 text-sm text-muted-foreground">Yes will search the same live job board used by Search Jobs and show only postings with a resume keyword-match estimate above 80%. Matches depend on the current listings and available job-description details.</p>
          <div className="mt-3 flex flex-wrap gap-3">
            <button type="button" onClick={() => void matchToLiveJobs()} disabled={liveMatchLoading || resume.trim().length < 40} className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50">{liveMatchLoading ? "Matching live jobs…" : "Yes, match real job posts"}</button>
            <button type="button" onClick={() => { setLiveMatchAsked(false); setLiveMatches([]); setLiveMatchTips([]); setLiveMatchError(""); }} className="inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-semibold hover:bg-muted">Not right now</button>
          </div>
          {liveMatchAsked && <div className="mt-5" aria-live="polite">
            {liveMatchLoading && <p role="status" className="text-sm text-muted-foreground">Searching live job-board listings and checking resume keyword overlap…</p>}
            {liveMatchError && <p role={liveMatches.length ? "status" : "alert"} className="mt-3 rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">{liveMatchError}</p>}
            {liveMatches.length > 0 && <div className="space-y-3">
              <h4 className="text-lg font-bold">Your 3 closest live job matches</h4>
              <p className="text-sm text-muted-foreground">These are the closest matches found in the current live listings, ranked from strongest to weakest. A result can appear here even if it does not reach 80%.</p>
              {liveMatches.map(({ job, score, matchedKeywords }) => (
                <article key={job.guid || job.applicationLink || job.title} className="rounded-lg border p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h5 className="font-semibold">{job.title || "Untitled position"}</h5>
                      <p className="mt-1 text-sm text-muted-foreground">{job.companyName || "Company not provided"}{job.location ? ` · ${job.location}` : ""}</p>
                      <p className="mt-2 text-xs text-muted-foreground">{job.source || "Live job board"}{job.isRemote ? " · Remote" : ""}</p>
                    </div>
                    <div className="shrink-0 rounded-md bg-primary/10 px-3 py-2 text-center"><p className="text-xl font-bold">{score}%</p><p className="text-xs text-muted-foreground">keyword match</p></div>
                  </div>
                  {(job.excerpt || job.description) && <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">{(job.excerpt || job.description || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()}</p>}
                  {matchedKeywords.length > 0 && <p className="mt-2 text-xs text-muted-foreground">Matching terms: {matchedKeywords.slice(0, 8).join(", ")}</p>}
                  {job.applicationLink && <a href={job.applicationLink} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90">View live listing &amp; apply <ExternalLinkIcon /></a>}
                </article>
              ))}
              <p className="text-xs text-muted-foreground">The match percentage is an in-app keyword estimate, not an employer ATS score or a hiring prediction. Always review the full posting and confirm you meet its requirements before applying.</p>
              {liveMatchTips.length > 0 && <section className="rounded-lg border bg-muted/30 p-4">
                <h4 className="font-semibold">How to improve your resume toward an 80%+ match</h4>
                <p className="mt-1 text-sm text-muted-foreground">Use these suggestions to strengthen alignment with the real postings above. Never add a skill or qualification you do not have.</p>
                <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6">{liveMatchTips.map((tip, index) => <li key={`${index}-${tip}`}>{tip}</li>)}</ol>
              </section>
            </div>}
          </div>}
        </div>
      </section>
    </div>
  );
}
