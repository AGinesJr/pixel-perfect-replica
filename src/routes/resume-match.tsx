import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { jobs } from "@/lib/data";
import { rankJobsForResume } from "@/lib/resume-job-matching";
import { useProgress } from "@/lib/progress";

export const Route = createFileRoute("/resume-match")({
  head: () => ({ meta: [{ title: "Resume-to-job match — Workforce Prep" }, { name: "description", content: "Find simulated practice roles that align with your resume and identify qualifications to strengthen." }] }),
  component: ResumeMatchPage,
});

function ResumeMatchPage() {
  const { state, ready } = useProgress();
  const [resume, setResume] = useState("");
  const [analyzed, setAnalyzed] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (ready && state.resume && !resume) setResume(state.resume);
  }, [ready, state.resume, resume]);

  const results = useMemo(() => analyzed ? rankJobsForResume(analyzed, jobs, 10) : [], [analyzed]);

  function analyze() {
    if (resume.trim().length < 40) {
      setError("Add a little more resume detail before matching.");
      return;
    }
    setError("");
    setAnalyzed(resume.trim());
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Personalized career prep</p>
        <h1 className="mt-2 text-3xl font-bold md:text-4xl">Find practice jobs that fit your experience</h1>
        <p className="mt-3 text-muted-foreground">Compare your resume with simulated job descriptions, see where your experience appears to match, and identify qualifications to strengthen before practicing an application.</p>
      </div>
      <section className="mt-7 rounded-xl border bg-card p-5 md:p-7">
        <label htmlFor="resume-match-text" className="block font-semibold">Your resume text</label>
        <p className="mt-1 text-sm text-muted-foreground">Paste your resume here. If it is in a PDF or Word document, copy its text first.</p>
        <textarea id="resume-match-text" value={resume} onChange={(event) => setResume(event.target.value)} rows={12} maxLength={30000} placeholder="Experience, responsibilities, skills, certifications, education…" className="mt-3 w-full rounded-md border bg-background p-3 text-sm leading-6" />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">{resume.length.toLocaleString()} / 30,000 characters</span>
          <button type="button" onClick={() => { setResume(""); setAnalyzed(""); setError(""); }} className="rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted">Clear resume</button>
        </div>
        {error && <p role="alert" className="mt-3 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
        <button type="button" onClick={analyze} disabled={resume.trim().length < 40} className="mt-4 h-11 rounded-md bg-primary px-5 font-semibold text-primary-foreground disabled:opacity-50">Match my resume</button>
        <p className="mt-4 text-xs text-muted-foreground">Privacy: matching runs in this browser. This feature does not send your resume to an AI provider or save it. Your text remains in the form until you leave or clear it.</p>
      </section>
      {analyzed && <section className="mt-8" aria-live="polite">
        <h2 className="text-2xl font-bold">Your closest practice matches</h2>
        <p className="mt-1 text-sm text-muted-foreground">Ranked by keyword evidence across required qualifications, preferred qualifications, and role responsibilities.</p>
        <div className="mt-4 space-y-4">
          {results.map((result) => {
            const found = [...result.required, ...result.preferred, ...result.responsibilities].filter((item) => item.found);
            const gaps = [...result.required, ...result.preferred].filter((item) => !item.found);
            return <article key={result.job.id} className="rounded-xl border bg-card p-5 md:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Simulated role · not a live vacancy</p>
                  <h3 className="mt-1 text-xl font-bold"><Link to="/jobs/$id" params={{ id: result.job.id }} className="hover:text-primary">{result.job.title}</Link></h3>
                  <p className="mt-1 text-sm text-muted-foreground">{result.job.employer} · {result.job.industry} · {result.job.location}</p>
                </div>
                <div className="rounded-lg bg-muted px-4 py-3 text-center"><p className="text-2xl font-bold">{result.score}%</p><p className="text-xs text-muted-foreground">keyword fit</p></div>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: result.score + "%" }} /></div>
              <p className="mt-2 text-sm text-muted-foreground">{result.required.filter((item) => item.found).length} of {result.required.length} required qualifications show possible evidence · {result.matchedCount} of {result.totalCount} criteria matched</p>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div><h4 className="font-semibold">Possible matches</h4>{found.length ? <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{found.slice(0, 6).map((item) => <li key={item.text}>{item.text}</li>)}</ul> : <p className="mt-2 text-sm text-muted-foreground">No clear keyword evidence yet. Add relevant examples you genuinely have.</p>}</div>
                <div><h4 className="font-semibold">Skills to review</h4>{gaps.length ? <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{gaps.slice(0, 6).map((item) => <li key={item.text}>{item.text}</li>)}</ul> : <p className="mt-2 text-sm text-muted-foreground">Possible evidence found for all listed qualifications. Prepare specific examples.</p>}</div>
              </div>
              <div className="mt-5 flex flex-wrap gap-3"><Link to="/jobs/$id" params={{ id: result.job.id }} className="rounded-md border px-4 py-2 text-sm font-semibold hover:bg-muted">Review role</Link><Link to="/apply/$id" params={{ id: result.job.id }} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">Practice applying</Link></div>
            </article>;
          })}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">These scores are keyword-overlap estimates, not hiring probabilities. A low score can mean your resume does not clearly describe a skill—not necessarily that you lack it. Roles shown are fictional practice listings.</p>
      </section>}
    </div>
  );
}
