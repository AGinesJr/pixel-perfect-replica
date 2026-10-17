import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, CheckCircle2, FileCheck, MessagesSquare, Search, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";
import { fmtSalary, jobs } from "@/lib/data";
import heroImg from "@/assets/hero.jpg";

const faqs = [
  {
    question: "What is Workforce Prep?",
    answer:
      "Workforce Prep is a career practice simulator where job seekers can rehearse applications, receive explainable screening feedback, improve resume alignment, and practice job-specific interviews in a low-stakes environment.",
  },
  {
    question: "Are the jobs on Workforce Prep real vacancies?",
    answer:
      "No. Practice roles and employers in the simulator are fictional and are designed for rehearsal. They are not live vacancies and do not represent active hiring by real employers.",
  },
  {
    question: "Can Workforce Prep guarantee that I will get hired?",
    answer:
      "No. Scores and feedback are practice aids, not hiring predictions or guarantees. Real employers use different requirements and evaluation processes.",
  },
  {
    question: "What can I practice on the platform?",
    answer:
      "You can rehearse job applications, review explainable screening feedback, practice interview questions, track your progress, and explore labor-market insights where available.",
  },
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Workforce Prep | AI Interview Practice, Resume Feedback & Job Search Simulator" },
      {
        name: "description",
        content:
          "Practice the job search before it counts. Rehearse applications, improve resume alignment, practice AI interviews, and build career confidence with explainable feedback.",
      },
      { name: "robots", content: "index,follow,max-image-preview:large" },
      { property: "og:title", content: "Workforce Prep | Career Practice & Interview Simulator" },
      {
        property: "og:description",
        content:
          "A low-stakes career simulator to practice applications, improve your resume, and build interview confidence.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Home,
});

function Home() {
  const [q, setQ] = useState("");
  const [loc, setLoc] = useState("");
  const nav = useNavigate();

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: "Workforce Prep",
        description:
          "A career practice simulator for rehearsing job applications, improving resume alignment, and practicing interviews.",
      },
      {
        "@type": "SoftwareApplication",
        name: "Workforce Prep",
        applicationCategory: "EducationalApplication",
        operatingSystem: "Web",
        description:
          "Practice job applications, receive explainable screening feedback, rehearse AI interviews, and explore labor-market insights. Practice employers and roles are fictional.",
        featureList: [
          "Job application practice",
          "Resume match analysis",
          "AI interview practice",
          "Career progress tracking",
          "Labor-market insights",
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: faqs.map(({ question, answer }) => ({
          "@type": "Question",
          name: question,
          acceptedAnswer: { "@type": "Answer", text: answer },
        })),
      },
    ],
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <section className="relative isolate overflow-hidden bg-hero text-ink-foreground">
        <img
          src={heroImg}
          alt=""
          width={1600}
          height={900}
          fetchPriority="high"
          className="absolute inset-0 -z-10 h-full w-full object-cover opacity-20 mix-blend-luminosity"
        />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-background/95 via-background/80 to-background/45" />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:py-20 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:py-28">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Career practice platform
            </p>
            <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Turn your potential into your next opportunity.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-foreground/85 sm:text-lg sm:leading-8">
              Rehearse the whole job search before it counts. Practice applications, strengthen your resume,
              and build interview confidence with clear, actionable feedback.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/account"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-primary px-6 font-semibold text-primary-foreground shadow-lg shadow-cyan-950/20 transition-transform duration-200 hover:-translate-y-0.5 hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                Start building career confidence <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex min-h-12 items-center justify-center rounded-lg border border-white/25 px-6 font-semibold text-white transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                Explore the platform
              </a>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Low-stakes practice. Transparent feedback. No promise of hiring outcomes.
            </p>
          </div>

          <div className="rounded-2xl border border-white/15 bg-card/90 p-5 shadow-2xl shadow-black/20 backdrop-blur sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Your career toolkit</p>
                <h2 className="mt-2 text-xl font-semibold text-white">Practice with a plan</h2>
              </div>
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <TrendingUp className="h-5 w-5" aria-hidden="true" />
              </span>
            </div>
            <div className="mt-5 space-y-3">
              {[
                { icon: Search, title: "Job search rehearsal", detail: "Explore practice roles and application steps" },
                { icon: FileCheck, title: "Resume match analysis", detail: "See strengths, gaps, and improvement ideas" },
                { icon: MessagesSquare, title: "Interview simulator", detail: "Practice role-specific questions and follow-ups" },
                { icon: CheckCircle2, title: "Progress tracking", detail: "Review milestones and practice history" },
              ].map(({ icon: Icon, title, detail }) => (
                <div key={title} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                  <div>
                    <h3 className="text-sm font-semibold text-white">{title}</h3>
                    <p className="mt-1 text-sm leading-5 text-muted-foreground">{detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="career-start-heading" className="mx-auto max-w-6xl px-4 py-10 sm:py-12">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-lg shadow-black/10 sm:p-7">
          <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">Start where you are</p>
              <h2 id="career-start-heading" className="mt-2 text-2xl font-bold sm:text-3xl">What are you working toward?</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Choose a target role or location to find a practice scenario that fits your next step.</p>
            </div>
            <form onSubmit={(event) => { event.preventDefault(); void nav({ to: "/jobs", search: { q: q.trim() || undefined, loc: loc.trim() || undefined } }); }} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              <div>
                <label htmlFor="career-target-role" className="mb-1.5 block text-sm font-semibold">Target role or skill</label>
                <input id="career-target-role" value={q} onChange={(event) => setQ(event.target.value)} placeholder="e.g. project coordinator" className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
              </div>
              <div>
                <label htmlFor="career-target-location" className="mb-1.5 block text-sm font-semibold">Location</label>
                <input id="career-target-location" value={loc} onChange={(event) => setLoc(event.target.value)} placeholder="City, state, or remote" className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
              </div>
              <button type="submit" className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                Explore roles <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </form>
          </div>
          <p className="mt-4 text-xs leading-5 text-muted-foreground">Practice roles are fictional training scenarios, not live vacancies. For current openings, visit <Link to="/search-jobs" className="font-semibold text-primary hover:underline">Live job listings</Link>.</p>
        </div>
      </section>

      <section aria-labelledby="featured-practice-heading" className="mx-auto max-w-6xl px-4 pb-12 sm:pb-16">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><p className="text-xs font-semibold uppercase tracking-wide text-primary">Try the simulator</p><h2 id="featured-practice-heading" className="mt-2 text-2xl font-bold sm:text-3xl">Featured practice scenarios</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Explore sample roles, compare requirements, and rehearse an application before pursuing a real opening.</p></div>
          <Link to="/jobs" className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border px-4 text-sm font-semibold hover:border-primary/50 hover:bg-muted">View all practice roles <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {jobs.slice(0, 3).map((job) => (
            <article key={job.id} className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/50">
              <span className="inline-flex rounded-full border border-warning/35 bg-warning/10 px-2.5 py-1 text-xs font-medium text-warning">Practice scenario</span>
              <h3 className="mt-3 font-display text-lg font-semibold leading-snug"><Link to="/jobs/$id" params={{ id: job.id }} className="hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{job.title}</Link></h3>
              <p className="mt-1 text-sm text-muted-foreground">{job.employer}</p>
              <p className="mt-3 text-sm font-semibold tabular-nums text-foreground">{job.salary ? `Salary example: ${fmtSalary(job.salary)}` : "Salary information not listed"}</p>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{job.summary}</p>
              <Link to="/jobs/$id" params={{ id: job.id }} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">Explore scenario <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
            </article>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">One connected journey</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Prepare smarter. Practice with purpose.</h2>
          <p className="mt-4 leading-7 text-muted-foreground">
            Workforce Prep combines career practice tools in one place, so each session can lead to a clear next step.
          </p>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            {
              icon: Search,
              title: "Explore opportunities",
              detail: "Practice searching and evaluating sample roles while learning to compare requirements with your current experience.",
              action: "Explore job practice",
              to: "/jobs" as const,
            },
            {
              icon: FileCheck,
              title: "Strengthen your resume",
              detail: "Review role alignment, skills, qualifications, and clarity with feedback that explains what to improve.",
              action: "Review resume tools",
              to: "/resume-match" as const,
            },
            {
              icon: MessagesSquare,
              title: "Rehearse interviews",
              detail: "Practice job-specific questions, build clearer examples, and use feedback to refine your next answer.",
              action: "Practice interviews",
              to: "/job-prep" as const,
            },
          ].map(({ icon: Icon, title, detail, action, to }) => (
            <article key={title} className="group rounded-2xl border bg-card p-6 transition-all duration-200 hover:-translate-y-1 hover:border-primary/50 hover:shadow-xl hover:shadow-black/5">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-5 text-xl font-semibold">{title}</h3>
              <p className="mt-2 min-h-[5rem] text-sm leading-6 text-muted-foreground">{detail}</p>
              <Link to={to} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
                {action} <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-card">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 md:grid-cols-[0.8fr_1.2fr] md:items-center sm:py-16">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Insight with context</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">Understand the labor market—not just the job listing.</h2>
          </div>
          <div>
            <p className="leading-7 text-muted-foreground">
              Explore labor-market indicators, employment trends, and high-demand occupations with clear definitions and source context.
              Use market information as one input to your career decisions, not as a guarantee of future openings.
            </p>
            <Link to="/insights" className="mt-5 inline-flex items-center gap-2 font-semibold text-primary hover:underline">
              Explore Market Insights <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Built around useful feedback</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Know what to improve—and why.</h2>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {[
            { title: "Explainable screening", detail: "Understand which practice criteria were met, which need more evidence, and how a simulated decision was reached." },
            { title: "Actionable interview feedback", detail: "Use clear criteria to improve relevance, structure, and specificity instead of receiving a score without explanation." },
            { title: "Progress you can review", detail: "Track practice milestones and review past results to see where your preparation is changing over time." },
            { title: "Honest by design", detail: "Practice scores are learning aids, not employer ATS results, hiring predictions, or guarantees of employment." },
          ].map((item) => (
            <article key={item.title} className="flex items-start gap-3 rounded-xl border bg-card p-5">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-hidden="true" />
              <div>
                <h3 className="font-semibold">{item.title}</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.detail}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 pb-16 sm:pb-20">
        <div className="rounded-2xl border bg-card p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Frequently asked questions</p>
          <h2 className="mt-3 text-2xl font-bold sm:text-3xl">What to know before you start</h2>
          <div className="mt-6 divide-y">
            {faqs.map(({ question, answer }) => (
              <details key={question} className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold marker:hidden">
                  {question}
                  <span aria-hidden="true" className="text-primary transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-16 sm:pb-20">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-2xl bg-hero px-6 py-10 text-ink-foreground sm:px-10 sm:py-14">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Your next opportunity starts with preparation.</h2>
              <p className="mt-3 leading-7 text-ink-foreground/80">Choose a goal, practice at your pace, and turn feedback into your next step.</p>
            </div>
            <Link to="/account" className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-6 font-semibold text-primary-foreground transition-transform duration-200 hover:-translate-y-0.5 hover:brightness-105">
              Get started <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
