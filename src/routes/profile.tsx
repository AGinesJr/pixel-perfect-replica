import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { FileText, UploadCloud } from "lucide-react";
import { extractResumeText } from "@/lib/resume-file-parser";
import { useProgress } from "@/lib/progress";
import { scoreResume, type ResumeScoreResult } from "@/lib/resume-ats-scoring";
import { jobs } from "@/lib/data";
import { rankJobsForResume } from "@/lib/resume-job-matching";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Resume — Workforce Prep" },
      { name: "description", content: "Edit, score, and match your resume to career-practice jobs in one workspace." },
      { property: "og:title", content: "Resume — Workforce Prep" },
      { property: "og:description", content: "Edit, score, and match your resume to career-practice jobs in one workspace." },
    ],
  }),
  component: Profile,
});

function Profile() {
  const { state, update, ready } = useProgress();
  const [resume, setResume] = useState("");
  const [saved, setSaved] = useState(false);
  const [notice, setNotice] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [scoreResult, setScoreResult] = useState<ResumeScoreResult | null>(null);
  const [analyzedResume, setAnalyzedResume] = useState("");
  const [matchError, setMatchError] = useState("");
  const [uploadBusy, setUploadBusy] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [selectedFileName, setSelectedFileName] = useState("");
  const resumeFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ready) setResume(state.resume);
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
      const extracted = await extractResumeText(file);
      const normalized = extracted
        .split(String.fromCharCode(0)).join("")
        .replace(/\r/g, "\n")
        .replace(/[ \t]+\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

      if (normalized.length < 40) {
        throw new Error(
          "We couldn't find enough selectable text in this file. If it's a scanned PDF, run OCR on it first or paste the resume text below.",
        );
      }

      setResume(normalized.slice(0, 15000));
      setSelectedFileName(file.name);
      setSaved(false);
      setScoreResult(null);
      setAnalyzedResume("");
      setMatchError("");
      setNotice(
        normalized.length > 15000
          ? "Resume imported. Only the first 15,000 characters were added; review and trim the text below."
          : "Resume imported from your file. Review the extracted text below before scoring or saving.",
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
    () => analyzedResume ? rankJobsForResume(analyzedResume, jobs, 10) : [],
    [analyzedResume],
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Career tools</p>
        <h1 className="mt-2 text-3xl font-bold md:text-4xl">Resume workspace</h1>
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
          <h2 className="font-semibold">1. Edit your resume</h2>
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
        <label className="block">
          <span className="sr-only">Resume text</span>
          <textarea
            value={resume}
            maxLength={15000}
            onChange={(event) => { setResume(event.target.value); setSaved(false); setScoreResult(null); setAnalyzedResume(""); setMatchError(""); }}
            rows={18}
            className="w-full rounded-md border bg-background p-3 text-sm"
            placeholder="Your extracted resume text will appear here. You can edit it before review…"
          />
        </label>
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
          <h2 className="mt-1 text-2xl font-bold">2. ATS readiness score</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Check resume details, qualifications, skills, and evidence of professional traits. For a more targeted estimate, add the job description you plan to apply to.
          </p>
        </div>
        <label className="mt-5 block">
          <span className="font-semibold">Target job description <span className="font-normal text-muted-foreground">(optional)</span></span>
          <span className="mt-1 block text-sm text-muted-foreground">Paste the job requirements to see which relevant terms appear in your resume. Use only skills and qualifications that genuinely apply to you.</span>
          <textarea value={jobDescription} maxLength={12000} onChange={(event) => { setJobDescription(event.target.value); setScoreResult(null); }} rows={5} className="mt-2 w-full rounded-md border bg-background p-3 text-sm" placeholder="Paste the target job description here…" />
        </label>
        <button type="button" onClick={() => setScoreResult(scoreResume(resume, { name: state.name, email: state.contactEmail, phone: state.phone, city: state.city, state: state.state }, jobDescription))} disabled={!ready || resume.trim().length < 40} className="mt-4 h-11 rounded-md bg-primary px-5 font-semibold text-primary-foreground disabled:opacity-50">
          Score my resume
        </button>
        {resume.trim().length < 40 && <p className="mt-2 text-sm text-muted-foreground">Add at least 40 characters to your resume to calculate a score.</p>}
        {scoreResult && <div className="mt-6 space-y-5" aria-live="polite">
          <div className="flex flex-col gap-4 rounded-lg border bg-muted/40 p-5 sm:flex-row sm:items-center">
            <div className="grid h-24 w-24 shrink-0 place-items-center rounded-full border-4 border-primary text-center">
              <div><p className="text-3xl font-bold leading-none">{scoreResult.score}</p><p className="mt-1 text-xs text-muted-foreground">out of 100</p></div>
            </div>
            <div><h3 className="text-xl font-bold">{scoreResult.label}</h3><p className="mt-1 text-sm text-muted-foreground">Estimated ATS readiness checklist score</p><p className="mt-2 text-sm">Use the category breakdown below to improve clarity and role relevance—not to game an automated filter.</p></div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {scoreResult.categories.map((item) => <article key={item.name} className="rounded-lg border p-4">
              <div className="flex items-start justify-between gap-3"><h3 className="font-semibold">{item.name}</h3><span className="shrink-0 text-lg font-bold">{item.score}%</span></div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: item.score + "%" }} /></div>
              <p className="mt-2 text-sm text-muted-foreground">{item.summary}</p>
              {item.recommendations.length > 0 ? <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">{item.recommendations.map((recommendation) => <li key={recommendation}>{recommendation}</li>)}</ul> : <p className="mt-3 text-sm">No checklist gaps detected in this category. Review for accuracy before applying.</p>}
            </article>)}
          </div>
          {scoreResult.keywordMatch && <article className="rounded-lg border p-4">
            <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-semibold">Target-job keyword overlap</h3><p className="mt-1 text-sm text-muted-foreground">A simple word-overlap estimate, not a semantic or employer ATS analysis.</p></div><span className="text-xl font-bold">{scoreResult.keywordMatch.score}%</span></div>
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
      </section>
    </div>
  );
}
