import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useProgress } from "@/lib/progress";
import { scoreResume, type ResumeScoreResult } from "@/lib/resume-ats-scoring";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "My resume — Workforce Prep" },
      { name: "description", content: "Edit and save your resume for career-practice applications." },
      { property: "og:title", content: "My resume — Workforce Prep" },
      { property: "og:description", content: "Edit and save your resume for career-practice applications." },
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

  function saveResume(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    update((current) => ({ ...current, resume }));
    setSaved(true);
    setNotice("Your resume was saved in this browser. If signed in, cloud sync is also being attempted.");
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-bold">My resume</h1>
      <p className="mt-2 text-muted-foreground">
        Keep the professional experience, skills, and qualifications you want to use for career-practice applications here.
      </p>

      <section className="mt-6 rounded-lg border bg-card p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold">Personal contact details</h2>
            <p className="mt-1 text-sm text-muted-foreground">Your name, contact information, location, and profile photo are managed separately.</p>
          </div>
          <Link to="/account" className="inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-semibold">Manage account & profile</Link>
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
        <label className="block">
          <span className="font-semibold">Resume text</span>
          <span className="mt-1 block text-sm text-muted-foreground">
            Add your work history, education, skills, certifications, and achievements. Avoid including Social Security numbers, account numbers, or other sensitive information.
          </span>
          <textarea
            value={resume}
            maxLength={15000}
            onChange={(event) => { setResume(event.target.value); setSaved(false); setScoreResult(null); }}
            rows={18}
            className="mt-3 w-full rounded-md border bg-background p-3 text-sm"
            placeholder="Paste or write your resume here…"
          />
        </label>
        <p className="text-right text-xs text-muted-foreground">{resume.length.toLocaleString()} / 15,000 characters</p>
        {notice && <p role="status" className="text-sm text-muted-foreground">{notice}</p>}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">Your resume is stored locally and syncs to your account when cloud sync is configured.</p>
          <button disabled={!ready} className="h-11 rounded-md bg-primary px-6 font-semibold text-primary-foreground disabled:opacity-50">{saved ? "Resume saved ✓" : "Save resume"}</button>
        </div>
      </form>
      <section className="mt-6 rounded-xl border bg-card p-5 md:p-6">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Resume checkup</p>
          <h2 className="mt-1 text-2xl font-bold">ATS resume score</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Check resume details, qualifications, skills, and evidence of professional traits. For a more targeted estimate, add the job description you plan to apply to.
          </p>
        </div>
        <label className="mt-5 block">
          <span className="font-semibold">Target job description <span className="font-normal text-muted-foreground">(optional)</span></span>
          <span className="mt-1 block text-sm text-muted-foreground">Paste the job requirements to see which relevant terms appear in your resume. Use only skills and qualifications that genuinely apply to you.</span>
          <textarea
            value={jobDescription}
            maxLength={12000}
            onChange={(event) => { setJobDescription(event.target.value); setScoreResult(null); }}
            rows={5}
            className="mt-2 w-full rounded-md border bg-background p-3 text-sm"
            placeholder="Paste the target job description here…"
          />
        </label>
        <button
          type="button"
          onClick={() => setScoreResult(scoreResume(resume, {
            name: state.name,
            email: state.contactEmail,
            phone: state.phone,
            city: state.city,
            state: state.state,
          }, jobDescription))}
          disabled={!ready || resume.trim().length < 40}
          className="mt-4 h-11 rounded-md bg-primary px-5 font-semibold text-primary-foreground disabled:opacity-50"
        >
          Score my resume
        </button>
        {resume.trim().length < 40 && <p className="mt-2 text-sm text-muted-foreground">Add at least 40 characters to your resume to calculate a score.</p>}
        {scoreResult && <div className="mt-6 space-y-5" aria-live="polite">
          <div className="flex flex-col gap-4 rounded-lg border bg-muted/40 p-5 sm:flex-row sm:items-center">
            <div className="grid h-24 w-24 shrink-0 place-items-center rounded-full border-4 border-primary text-center">
              <div><p className="text-3xl font-bold leading-none">{scoreResult.score}</p><p className="mt-1 text-xs text-muted-foreground">out of 100</p></div>
            </div>
            <div>
              <h3 className="text-xl font-bold">{scoreResult.label}</h3>
              <p className="mt-1 text-sm text-muted-foreground">Estimated ATS readiness checklist score</p>
              <p className="mt-2 text-sm">Use the category breakdown below to improve clarity and role relevance—not to game an automated filter.</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {scoreResult.categories.map((item) => <article key={item.name} className="rounded-lg border p-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold">{item.name}</h3>
                <span className="shrink-0 text-lg font-bold">{item.score}%</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: item.score + "%" }} /></div>
              <p className="mt-2 text-sm text-muted-foreground">{item.summary}</p>
              {item.recommendations.length > 0 ? <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">{item.recommendations.map((recommendation) => <li key={recommendation}>{recommendation}</li>)}</ul> : <p className="mt-3 text-sm">No checklist gaps detected in this category. Review for accuracy before applying.</p>}
            </article>)}
          </div>
          {scoreResult.keywordMatch && <article className="rounded-lg border p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><h3 className="font-semibold">Target-job keyword overlap</h3><p className="mt-1 text-sm text-muted-foreground">A simple word-overlap estimate, not a semantic or employer ATS analysis.</p></div>
              <span className="text-xl font-bold">{scoreResult.keywordMatch.score}%</span>
            </div>
            {scoreResult.keywordMatch.matched.length > 0 && <div className="mt-4"><h4 className="text-sm font-semibold">Terms found</h4><div className="mt-2 flex flex-wrap gap-2">{scoreResult.keywordMatch.matched.map((term) => <span key={term} className="rounded-full border px-2.5 py-1 text-xs">{term}</span>)}</div></div>}
            {scoreResult.keywordMatch.missing.length > 0 && <div className="mt-4"><h4 className="text-sm font-semibold">Terms to review</h4><p className="mt-1 text-xs text-muted-foreground">Add a term only if it truthfully reflects your skills or experience.</p><div className="mt-2 flex flex-wrap gap-2">{scoreResult.keywordMatch.missing.map((term) => <span key={term} className="rounded-full border border-dashed px-2.5 py-1 text-xs">{term}</span>)}</div></div>}
          </article>}
          <p className="text-xs leading-5 text-muted-foreground">{scoreResult.disclaimer} Your resume and target job description are analyzed in this browser and are not sent to an AI provider by this scoring feature.</p>
        </div>}
      </section>
    </div>
  );
}
