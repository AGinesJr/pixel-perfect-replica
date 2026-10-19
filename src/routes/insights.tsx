import { createFileRoute } from "@tanstack/react-router";
import { insights, SIMULATED_NOTICE } from "@/lib/data";
import { SimBadge } from "@/components/SiteHeader";

export const Route = createFileRoute("/insights")({
  head: () => ({
    meta: [
      { title: "Labor market insights — Workforce Prep" },
      { name: "description", content: "Explore in-demand skills, growing industries and career paths (sample data)." },
      { property: "og:title", content: "Labor market insights — Workforce Prep" },
      { property: "og:description", content: "In-demand skills, industries and career paths." },
    ],
  }),
  component: Insights,
});

function Insights() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-bold">Market insights</h1>
      <div className="mt-3 max-w-xl"><SimBadge>{SIMULATED_NOTICE}</SimBadge></div>
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <section className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold">Most requested skills</h2>
          <div className="mt-4 space-y-3">
            {insights.skills.map((s) => (
              <div key={s.skill}>
                <div className="flex justify-between text-sm"><span>{s.skill}</span><span className="text-muted-foreground">{s.demand}% of listings</span></div>
                <div className="mt-1 h-2 rounded bg-muted"><div className="h-2 rounded bg-primary" style={{ width: `${s.demand}%` }} /></div>
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold">Industries</h2>
          <table className="mt-4 w-full text-sm">
            <thead className="text-left text-muted-foreground"><tr><th className="pb-2">Industry</th><th className="pb-2">Openings</th><th className="pb-2">Growth</th></tr></thead>
            <tbody>{insights.industries.map((i) => <tr key={i.name} className="border-t"><td className="py-2">{i.name}</td><td>{i.openings}</td><td className="text-success">+{i.growth}%</td></tr>)}</tbody>
          </table>
        </section>
      </div>
      <h2 className="mt-10 text-xl font-semibold">Career paths</h2>
      <div className="mt-3 grid gap-4 md:grid-cols-2">
        {insights.paths.map((p) => (
          <div key={p.from} className="rounded-lg border bg-card p-5">
            <p className="font-semibold">{p.from}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              {p.to.map((t, i) => <span key={t} className="flex items-center gap-2">{i > 0 && <span className="text-muted-foreground">→</span>}<span className="rounded bg-accent px-2 py-1 text-accent-foreground">{t}</span></span>)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
