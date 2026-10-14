import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Search, FileCheck, MessagesSquare, TrendingUp } from "lucide-react";
import { jobs } from "@/lib/data";
import { JobCard } from "@/components/JobCard";
import heroImg from "@/assets/hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Workforce Prep — Practice the job hunt with an AI recruiter" },
      { name: "description", content: "Browse realistic jobs, apply, get screened by an AI recruiter, and practice interviews with transparent feedback." },
      { property: "og:title", content: "Workforce Prep — Practice the job hunt" },
      { property: "og:description", content: "Realistic job search simulator with AI recruiter screening and interview practice." },
    ],
  }),
  component: Home,
});

function Home() {
  const [q, setQ] = useState("");
  const [loc, setLoc] = useState("");
  const nav = useNavigate();
  return (
    <div>
      <section className="relative overflow-hidden bg-hero text-ink-foreground">
        <img src={heroImg} alt="" width={1600} height={900} className="absolute inset-0 h-full w-full object-cover opacity-25 mix-blend-luminosity" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 md:py-28">
          <p className="text-sm font-medium uppercase tracking-widest text-ink-foreground/70">Career practice platform</p>
          <h1 className="mt-3 max-w-2xl text-4xl font-bold md:text-6xl">Rehearse the whole job search before it counts.</h1>
          <p className="mt-4 max-w-xl text-lg text-ink-foreground/80">Apply to realistic roles, get screened by an AI recruiter, and practice interviews with honest, explained feedback.</p>
          <form
            onSubmit={(e) => { e.preventDefault(); nav({ to: "/jobs", search: { q, loc } }); }}
            className="mt-8 flex max-w-3xl flex-col gap-2 rounded-lg bg-card p-2 shadow-xl md:flex-row"
          >
            <label className="flex flex-1 items-center gap-2 px-3 text-foreground"><Search className="h-4 w-4 text-muted-foreground" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Job title, skill, or company" className="h-11 w-full bg-transparent outline-none" /></label>
            <input value={loc} onChange={(e) => setLoc(e.target.value)} placeholder="City or remote" className="h-11 flex-1 border-t px-3 text-foreground outline-none md:border-l md:border-t-0" />
            <button className="h-11 rounded-md bg-primary px-6 font-semibold text-primary-foreground hover:bg-primary/90">Search jobs</button>
          </form>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-14 md:grid-cols-3">
        {[
          { icon: FileCheck, t: "Explainable screening", d: "See exactly which criteria passed, and why you got an interview, a request for more info, or a rejection." },
          { icon: MessagesSquare, t: "Live AI interviews", d: "A hiring manager asks role-specific questions and follows up like a real person would." },
          { icon: TrendingUp, t: "Measured progress", d: "Track scores, earn levels and achievements, and follow a practice plan built from your feedback." },
        ].map(({ icon: I, t, d }) => (
          <div key={t} className="rounded-lg border bg-card p-6">
            <I className="h-6 w-6 text-primary" />
            <h3 className="mt-4 text-lg font-semibold">{t}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{d}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="mb-6 flex items-end justify-between">
          <div><h2 className="text-2xl font-bold">Practice roles</h2><p className="mt-1 text-sm text-muted-foreground">Sample listings for rehearsal — not live vacancies.</p></div>
          <Link to="/jobs" className="text-sm font-semibold text-primary">View all jobs →</Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">{jobs.slice(0, 6).map((j) => <JobCard key={j.id} job={j} />)}</div>
      </section>
    </div>
  );
}
