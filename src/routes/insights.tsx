import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Activity, ArrowUpRight, BarChart3, BriefcaseBusiness, Building2, MapPin, RefreshCw, Search, TrendingUp } from "lucide-react";
import { highDemandIndustries, highDemandJobs, outlookPeriod } from "@/data/high-demand-outlook";
import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  getMarketInsights,
  searchInsightLocations,
  type InsightLocation,
  type MarketInsightsDashboard,
} from "@/lib/insights.functions";

export const Route = createFileRoute("/insights")({
  head: () => ({
    meta: [
      { title: "US Labor Market Insights — Workforce Prep" },
      { name: "description", content: "Explore official US labor market statistics by region, state, metro area, city, or county." },
      { property: "og:title", content: "US Labor Market Insights — Workforce Prep" },
      { property: "og:description", content: "Interactive labor-market dashboard powered by official Bureau of Labor Statistics data." },
    ],
  }),
  component: Insights,
});

type Geography = "national" | "region" | "state" | "metro" | "city" | "county";
type Range = "12" | "24" | "60";

function formatRate(metric: { value: number } | null | undefined) {
  return metric ? metric.value.toFixed(1) + "%" : "—";
}

function formatMoney(metric: { value: number } | null | undefined) {
  return metric ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(metric.value) : "—";
}

function formatCount(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function metricPeriod(metric: { periodName: string; year: string } | null | undefined) {
  return metric ? metric.periodName + " " + metric.year : "No recent value";
}

function Insights() {
  const getDashboard = useServerFn(getMarketInsights);
  const findLocations = useServerFn(searchInsightLocations);
  const [dashboard, setDashboard] = useState<MarketInsightsDashboard | null>(null);
  const [geography, setGeography] = useState<Geography>("national");
  const [locationQuery, setLocationQuery] = useState("");
  const [locationOptions, setLocationOptions] = useState<InsightLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<InsightLocation | null>(null);
  const [range, setRange] = useState<Range>("24");
  const [loading, setLoading] = useState(false);
  const [searchingLocations, setSearchingLocations] = useState(false);
  const [error, setError] = useState("");
  const [locationSearchError, setLocationSearchError] = useState("");

  async function loadDashboard(areaCode = "") {
    setLoading(true);
    setError("");
    try {
      const result = await getDashboard({ data: { areaCode } });
      setDashboard(result);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We couldn't load the latest labor market data.");
    } finally {
      setLoading(false);
    }
  }

  async function submitLocationSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (geography === "national") return;
    if (locationQuery.trim().length < 2) {
      setLocationSearchError("Enter at least two letters to search official BLS locations.");
      return;
    }
    setSearchingLocations(true);
    setLocationSearchError("");
    setLocationOptions([]);
    try {
      const results = await findLocations({
        data: {
          query: locationQuery.trim(),
          type: geography as "region" | "state" | "metro" | "city" | "county",
        },
      });
      setLocationOptions(results);
      if (results.length === 0) setLocationSearchError("No matching locations found. Try a broader search or another location type.");
    } catch (cause) {
      setLocationSearchError(cause instanceof Error ? cause.message : "We couldn't search the BLS location directory.");
    } finally {
      setSearchingLocations(false);
    }
  }

  function changeGeography(next: Geography) {
    setGeography(next);
    setLocationOptions([]);
    setSelectedLocation(null);
    setDashboard(null);
    setError("");
    setLocationSearchError("");
    setLocationQuery("");
    if (next === "national") void loadDashboard("");
  }

  function chooseLocation(location: InsightLocation) {
    setSelectedLocation(location);
    setDashboard(null);
    setError("");
    setGeography(location.areaTypeCode === "M" || location.areaTypeCode === "N"
      ? "region"
      : location.areaTypeCode === "A"
        ? "state"
        : location.areaTypeCode === "B" || location.areaTypeCode === "C"
          ? "metro"
          : location.areaTypeCode === "G"
            ? "city"
            : "county");
    setLocationOptions([]);
    setLocationQuery(location.name);
    void loadDashboard(location.areaCode);
  }

  useEffect(() => {
    void loadDashboard("");
    // Initial load only; subsequent refreshes are user-triggered.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visibleUnemployment = dashboard?.trends.unemployment.slice(-Number(range)) ?? [];
  const visiblePayrolls = dashboard?.trends.payrollEmployment.slice(-Number(range)) ?? [];
  const visibleWages = dashboard?.trends.averageHourlyEarnings.slice(-Number(range)) ?? [];
  const visibleEmployment = dashboard?.trends.localEmployment.slice(-Number(range)) ?? [];
  const selectedLabel = selectedLocation?.name ?? "United States";
  const latestNationalEmployment = dashboard?.national.employment ? dashboard.national.employment.value * 1000 : null;
  const latestNationalUnemployed = dashboard?.national.unemployed ? dashboard.national.unemployed.value * 1000 : null;
  const latestPayrollEmployment = dashboard?.national.payrollEmployment ? dashboard.national.payrollEmployment.value * 1000 : null;
  const local = dashboard?.local;

  const cards = local ? [
    { label: "Unemployment rate", value: formatRate(local.unemploymentRate), note: metricPeriod(local.unemploymentRate), icon: Activity },
    { label: "People employed", value: formatCount(local.employed?.value), note: metricPeriod(local.employed), icon: TrendingUp },
    { label: "People unemployed", value: formatCount(local.unemployed?.value), note: metricPeriod(local.unemployed), icon: Activity },
    { label: "Civilian labor force", value: formatCount(local.laborForce?.value), note: metricPeriod(local.laborForce), icon: BarChart3 },
    { label: "Labor force participation", value: formatRate(local.laborForceParticipation), note: metricPeriod(local.laborForceParticipation), icon: TrendingUp },
    { label: "US average hourly earnings", value: formatMoney(dashboard?.national.averageHourlyEarnings), note: metricPeriod(dashboard?.national.averageHourlyEarnings), icon: BarChart3 },
  ] : [
    { label: "US unemployment rate", value: formatRate(dashboard?.national.unemploymentRate), note: metricPeriod(dashboard?.national.unemploymentRate), icon: Activity },
    { label: "People employed", value: formatCount(latestNationalEmployment), note: metricPeriod(dashboard?.national.employment), icon: TrendingUp },
    { label: "People unemployed", value: formatCount(latestNationalUnemployed), note: metricPeriod(dashboard?.national.unemployed), icon: Activity },
    { label: "Labor force participation", value: formatRate(dashboard?.national.laborForceParticipation), note: metricPeriod(dashboard?.national.laborForceParticipation), icon: BarChart3 },
    { label: "Nonfarm payroll jobs", value: formatCount(latestPayrollEmployment), note: metricPeriod(dashboard?.national.payrollEmployment), icon: TrendingUp },
    { label: "Average hourly earnings", value: formatMoney(dashboard?.national.averageHourlyEarnings), note: metricPeriod(dashboard?.national.averageHourlyEarnings), icon: BarChart3 },
  ];

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 md:py-10">
      <section className="relative isolate overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-card to-muted/40 p-5 shadow-sm md:p-8">
        <div className="pointer-events-none absolute -right-16 -top-20 -z-10 h-64 w-64 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-primary shadow-sm">
              <Activity className="h-3.5 w-3.5" aria-hidden="true" />
              Official labor-market data
            </div>
            <h1 className="mt-4 font-display text-3xl font-bold tracking-tight md:text-5xl">US Market Insights</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">Make your next career move with confidence. Explore labor-market trends, compare local areas with national benchmarks, and discover where employment demand is projected to grow.</p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs font-medium text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 rounded-full border bg-background/70 px-3 py-1.5"><Activity className="h-3.5 w-3.5 text-primary" aria-hidden="true" /> Employment & wages</span>
              <span className="inline-flex items-center gap-1.5 rounded-full border bg-background/70 px-3 py-1.5"><MapPin className="h-3.5 w-3.5 text-primary" aria-hidden="true" /> Local comparisons</span>
              <span className="inline-flex items-center gap-1.5 rounded-full border bg-background/70 px-3 py-1.5"><TrendingUp className="h-3.5 w-3.5 text-primary" aria-hidden="true" /> Future demand</span>
            </div>
          </div>
          <button type="button" onClick={() => void loadDashboard(selectedLocation?.areaCode ?? "")} disabled={loading} className="inline-flex h-11 shrink-0 items-center justify-center gap-2 self-start rounded-lg border bg-background/80 px-4 text-sm font-semibold shadow-sm transition-all hover:bg-background hover:shadow-md disabled:opacity-60 sm:self-auto">
            <RefreshCw className={"h-4 w-4 " + (loading ? "animate-spin" : "")} aria-hidden="true" />
            {loading ? "Updating…" : "Refresh data"}
          </button>
        </div>
      </section>

      <section className="mt-7" aria-labelledby="demand-outlook-heading">
        <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Plan for what's next</p>
            <h2 id="demand-outlook-heading" className="mt-1 font-display text-2xl font-semibold tracking-tight md:text-3xl">Where opportunity is growing</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Explore the fastest-growing occupations and the industries expected to add the most jobs nationwide.</p>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground"><span className="h-2 w-2 rounded-full bg-primary" /> BLS outlook · {outlookPeriod}</span>
        </div>
        <div className="grid gap-5 xl:grid-cols-2" aria-label="High-demand jobs and industries">
          <section className="min-w-0 rounded-2xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md md:p-6" aria-labelledby="high-demand-jobs-title">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Ranked by growth rate</p>
                <h3 id="high-demand-jobs-title" className="mt-1 text-xl font-bold">High-Demand Jobs</h3>
                <p className="mt-1 text-sm leading-5 text-muted-foreground">Occupations projected to grow fastest in the US.</p>
              </div>
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border bg-primary/10 text-primary"><BriefcaseBusiness className="h-5 w-5" aria-hidden="true" /></span>
            </div>
            <div className="mt-6 space-y-4">
              {highDemandJobs.map((job, index) => (
                <article key={job.title} className="group/job">
                  <div className="flex items-start gap-3">
                    <span className={"grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-bold tabular-nums " + (index === 0 ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground")}>{String(index + 1).padStart(2, "0")}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                        <h4 className="text-sm font-semibold leading-5">{job.title}</h4>
                        <span className="text-sm font-bold tabular-nums text-primary">+{job.growthPercent.toFixed(1)}%</span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted" role="img" aria-label={job.title + ": " + job.growthPercent.toFixed(1) + " percent projected growth"}>
                        <div className="h-full rounded-full bg-primary transition-[width] duration-700 ease-out" style={{ width: (job.growthPercent / highDemandJobs[0].growthPercent * 100) + "%" }} />
                      </div>
                      <p className="mt-1.5 text-xs text-muted-foreground">{job.category} <span className="mx-1.5">·</span> {formatCount(job.jobsAdded)} projected additional jobs</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <div className="mt-6 flex flex-col justify-between gap-3 rounded-xl border bg-background/70 p-3 sm:flex-row sm:items-center">
              <p className="text-xs leading-5 text-muted-foreground">Bars compare projected employment growth rates over the decade.</p>
              <Link to="/search-jobs" className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90">
                Find openings <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </section>

          <section className="min-w-0 rounded-2xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md md:p-6" aria-labelledby="high-demand-industries-title">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Ranked by projected job gains</p>
                <h3 id="high-demand-industries-title" className="mt-1 text-xl font-bold">High-Demand Industries</h3>
                <p className="mt-1 text-sm leading-5 text-muted-foreground">Sectors expected to create the most additional jobs.</p>
              </div>
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border bg-primary/10 text-primary"><Building2 className="h-5 w-5" aria-hidden="true" /></span>
            </div>
            <div className="mt-6 space-y-4">
              {highDemandIndustries.map((industry, index) => (
                <article key={industry.title} className="group/industry">
                  <div className="flex items-start gap-3">
                    <span className={"grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-bold tabular-nums " + (index === 0 ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground")}>{String(index + 1).padStart(2, "0")}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                        <h4 className="text-sm font-semibold leading-5">{industry.title}</h4>
                        <span className="text-sm font-bold tabular-nums text-primary">{formatCount(industry.jobsAdded)}</span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted" role="img" aria-label={industry.title + ": " + industry.jobsAdded.toLocaleString("en-US") + " projected additional jobs"}>
                        <div className="h-full rounded-full bg-success transition-[width] duration-700 ease-out" style={{ width: (industry.jobsAdded / highDemandIndustries[0].jobsAdded * 100) + "%" }} />
                      </div>
                      <p className="mt-1.5 text-xs text-muted-foreground">Projected growth <span className="font-semibold text-foreground">+{industry.growthPercent.toFixed(1)}%</span> <span className="mx-1.5">·</span> 2024–2034</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <div className="mt-6 flex flex-col justify-between gap-3 rounded-xl border bg-background/70 p-3 sm:flex-row sm:items-center">
              <p className="text-xs leading-5 text-muted-foreground">Bars compare total projected jobs added by industry.</p>
              <Link to="/search-jobs" className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90">
                Explore job listings <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </section>
        </div>
        <p className="mt-3 rounded-xl border bg-muted/30 px-4 py-3 text-xs leading-5 text-muted-foreground">These are national employment projections, not current vacancies or hiring guarantees. Job rankings compare growth rates; industry rankings compare total jobs added. Figures may differ from the selected local area. <a href="https://www.bls.gov/opub/mlr/2026/article/industry-and-occupational-employment-projections-overview.htm" target="_blank" rel="noreferrer" className="font-semibold text-primary underline underline-offset-4">Source: US Bureau of Labor Statistics</a></p>
      </section>

      <section className="mt-8 rounded-2xl border bg-card p-4 shadow-sm md:p-6" aria-labelledby="geography-filters-title">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" aria-hidden="true" />
          <div><h2 id="geography-filters-title" className="text-lg font-bold">Explore your local market</h2><p className="mt-0.5 text-sm text-muted-foreground">Compare local labor-force conditions with the national picture.</p></div>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-[minmax(190px,0.7fr)_minmax(0,1.5fr)]">
          <label className="text-sm font-medium">
            <span className="mb-2 block">Geographic level</span>
            <select value={geography} onChange={(event) => changeGeography(event.target.value as Geography)} className="h-11 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring">
              <option value="national">United States</option>
              <option value="region">Census region or division</option>
              <option value="state">State or District of Columbia</option>
              <option value="metro">Metro area</option>
              <option value="city">City</option>
              <option value="county">County</option>
            </select>
          </label>
          {geography !== "national" ? (
            <form onSubmit={submitLocationSearch}>
              <label htmlFor="insights-location-search" className="mb-2 block text-sm font-medium">Search official BLS locations</label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input id="insights-location-search" value={locationQuery} onChange={(event) => setLocationQuery(event.target.value)} maxLength={80} placeholder={geography === "region" ? "e.g. South or Pacific" : geography === "state" ? "e.g. Florida" : geography === "metro" ? "e.g. Orlando or Miami" : geography === "city" ? "e.g. Sanford or New York" : "e.g. Orange County"} className="h-11 min-w-0 flex-1 rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
                <button type="submit" disabled={searchingLocations || locationQuery.trim().length < 2} className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60">
                  <Search className="h-4 w-4" aria-hidden="true" /> {searchingLocations ? "Searching…" : "Find locations"}
                </button>
              </div>
            </form>
          ) : (
            <div className="flex items-center rounded-lg bg-muted/50 px-4 py-3 text-sm text-muted-foreground">National indicators are shown for the United States. Choose another geographic level to explore local labor-force statistics.</div>
          )}
        </div>

        {locationSearchError && <p role="status" className="mt-3 text-sm text-muted-foreground">{locationSearchError}</p>}
        {locationOptions.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-sm font-semibold">{locationOptions.length} matching locations (showing up to 20)</p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {locationOptions.map((location) => (
                <button key={location.areaCode} type="button" onClick={() => chooseLocation(location)} className="flex min-h-16 items-start justify-between gap-3 rounded-lg border p-3 text-left transition-colors hover:border-primary hover:bg-accent/50">
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{location.name}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">{location.areaType}</span>
                  </span>
                  <span className="pt-1 text-xs font-semibold text-primary">View</span>
                </button>
              ))}
            </div>
          </div>
        )}
        {selectedLocation && <p className="mt-3 text-sm text-muted-foreground">Selected: <span className="font-semibold text-foreground">{selectedLocation.name}</span>. Local employment and unemployment measures are reported for this area; wage and payroll benchmarks remain national.</p>}
      </section>

      {dashboard?.apiKeyConfigured === false && (
        <div className="mt-5 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-sm leading-6">
          <p className="font-semibold">Set up the free BLS API key before public launch</p>
          <p className="mt-1 text-muted-foreground">This preview can use the public BLS endpoint without a key, but unregistered access is limited to 25 requests per day. Register for a free key and add it as the server-side secret <code className="rounded bg-muted px-1 py-0.5">BLS_API_KEY</code> in Lovable to support more reliable public use. Never expose it in browser code.</p>
        </div>
      )}

      {error && (
        <div role="alert" className="mt-5 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <p className="font-semibold">The latest statistics couldn't be loaded</p>
          <p className="mt-1 text-sm text-muted-foreground">{error}</p>
          <button type="button" onClick={() => void loadDashboard(selectedLocation?.areaCode ?? "")} className="mt-3 rounded-md border px-3 py-2 text-sm font-semibold hover:bg-accent">Try again</button>
        </div>
      )}

      {loading && !dashboard && <div className="mt-8 rounded-xl border p-10 text-center text-sm text-muted-foreground">Loading official BLS statistics…</div>}

      {dashboard && !error && (
        <>
          <div className="mt-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">{selectedLocation ? selectedLabel : "United States"} overview</h2>
              <p className="mt-1 text-sm text-muted-foreground">Latest available BLS release: {dashboard.latestPeriod}. Data is released monthly and can be revised.</p>
            </div>
            <label className="flex items-center gap-2 text-sm font-medium">
              <span>Chart range</span>
              <select value={range} onChange={(event) => setRange(event.target.value as Range)} className="h-10 rounded-md border bg-background px-3">
                <option value="12">12 months</option>
                <option value="24">24 months</option>
                <option value="60">5 years</option>
              </select>
            </label>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((card) => {
              const Icon = card.icon;
              return (
                <section key={card.label} className="group relative overflow-hidden rounded-xl border bg-card p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md md:p-5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
                    <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                  </div>
                  <p className="mt-3 text-3xl font-extrabold tracking-tight tabular-nums">{card.value}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{card.note}</p>
                </section>
              );
            })}
          </div>

          <div className="mt-6 grid gap-5 xl:grid-cols-2">
            <section className="min-w-0 rounded-2xl border bg-card p-4 shadow-sm md:p-6">
              <div className="mb-4">
                <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary"><Activity className="h-4 w-4" aria-hidden="true" /></span><h3 className="font-semibold">Unemployment rate over time</h3></div>
                <p className="mt-1 text-sm text-muted-foreground">{selectedLocation ? "Selected area compared with the US rate" : "Seasonally adjusted US unemployment rate"}</p>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={visibleUnemployment} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.12} />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} minTickGap={20} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(value: number) => value + "%"} width={46} />
                    <Tooltip formatter={(value) => typeof value === "number" ? value.toFixed(1) + "%" : "—"} />
                    <Legend />
                    <Line type="monotone" dataKey="national" name="United States" stroke="var(--muted-foreground)" strokeWidth={2} dot={false} connectNulls />
                    {selectedLocation && <Line type="monotone" dataKey="selected" name={selectedLocation.name} stroke="var(--primary)" strokeWidth={2.5} dot={false} connectNulls />}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="min-w-0 rounded-xl border bg-card p-4 md:p-6">
              <div className="mb-4">
                <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary"><BarChart3 className="h-4 w-4" aria-hidden="true" /></span><h3 className="font-semibold">Nonfarm payroll employment</h3></div>
                <p className="mt-1 text-sm text-muted-foreground">US payroll jobs, in millions</p>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={visiblePayrolls} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.12} />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} minTickGap={20} />
                    <YAxis tick={{ fontSize: 11 }} width={54} />
                    <Tooltip formatter={(value) => typeof value === "number" ? value.toFixed(1) + " million" : "—"} />
                    <Line type="monotone" dataKey="value" name="Payroll jobs" stroke="var(--primary)" strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="min-w-0 rounded-xl border bg-card p-4 md:p-6">
              <div className="mb-4">
                <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary"><TrendingUp className="h-4 w-4" aria-hidden="true" /></span><h3 className="font-semibold">Average hourly earnings</h3></div>
                <p className="mt-1 text-sm text-muted-foreground">US private-sector employees, dollars per hour</p>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={visibleWages} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.12} />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} minTickGap={20} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(value: number) => "$" + value} width={54} />
                    <Tooltip formatter={(value) => typeof value === "number" ? "$" + value.toFixed(2) : "—"} />
                    <Line type="monotone" dataKey="value" name="Average hourly earnings" stroke="var(--success)" strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="min-w-0 rounded-xl border bg-card p-4 md:p-6">
              <div className="mb-4">
                <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary"><Activity className="h-4 w-4" aria-hidden="true" /></span><h3 className="font-semibold">{selectedLocation ? selectedLocation.name + " employment" : "US employment"}</h3></div>
                <p className="mt-1 text-sm text-muted-foreground">People employed, in millions</p>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={visibleEmployment} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.12} />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} minTickGap={20} />
                    <YAxis tick={{ fontSize: 11 }} width={54} />
                    <Tooltip formatter={(value) => typeof value === "number" ? value.toFixed(2) + " million" : "—"} />
                    <Line type="monotone" dataKey="value" name="People employed" stroke="var(--chart-3)" strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>

          <section className="mt-6 rounded-xl border bg-card p-4 md:p-6">
            <h3 className="font-semibold">How to read these statistics</h3>
            <div className="mt-3 grid gap-4 text-sm leading-6 text-muted-foreground md:grid-cols-2">
              <p>Local unemployment, employment, and labor-force measures come from BLS Local Area Unemployment Statistics (LAUS). Local data is reported by place of residence and may have a different release schedule from national indicators. {selectedLocation ? (dashboard.localSeasonalAdjustment === "U" ? "This location does not provide a seasonally adjusted unemployment series, so the trend compares unadjusted local and national estimates." : "Seasonally adjusted local estimates are used where BLS publishes them.") : "National indicators use the seasonal-adjustment definitions published for each BLS series."}</p>
              <p>National unemployment and labor-force participation use the Current Population Survey. Payroll employment and hourly earnings use the Current Employment Statistics survey. These are different measures and should not be treated as interchangeable.</p>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4 text-xs text-muted-foreground">
              <p>Retrieved {new Date(dashboard.refreshedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })} · Latest data period: {dashboard.latestPeriod}</p>
              <a href="https://www.bls.gov/" target="_blank" rel="noreferrer" className="font-semibold text-primary underline underline-offset-4">Source: US Bureau of Labor Statistics</a>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
