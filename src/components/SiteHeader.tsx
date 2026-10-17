import { Link } from "@tanstack/react-router";
import {
  Briefcase,
  ChartNoAxesCombined,
  ChevronDown,
  FileText,
  Gauge,
  MessageSquare,
  Search,
  UserRound,
} from "lucide-react";
import { useState } from "react";

const primaryNav = [
  { to: "/dashboard", label: "Dashboard", icon: Gauge },
  { to: "/jobs", label: "Find jobs", icon: Briefcase },
  { to: "/profile", label: "Resume Studio", icon: FileText },
  { to: "/job-prep", label: "Interview simulator", icon: MessageSquare },
] as const;

const desktopNav = [
  ...primaryNav,
  { to: "/insights", label: "Market insights", icon: ChartNoAxesCombined },
] as const;

const profileMenu = [
  { to: "/my-profile", label: "Career profile" },
  { to: "/search-jobs", label: "Live job listings" },
  { to: "/account", label: "Account settings" },
] as const;

export function SiteHeader() {
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border/80 bg-card/95 shadow-sm shadow-black/10 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link to="/dashboard" className="flex shrink-0 items-center gap-2.5 rounded-md font-display text-lg font-bold tracking-tight text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <Briefcase className="h-4 w-4" aria-hidden="true" />
            </span>
            <span>Workforce <span className="text-primary">Prep</span></span>
          </Link>

          <nav aria-label="Main navigation" className="hidden items-center gap-1 xl:flex">
            {desktopNav.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                activeOptions={{ exact: true }}
                className="inline-flex min-h-10 items-center gap-2 rounded-lg border-b-2 border-transparent px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                activeProps={{ className: "inline-flex min-h-10 items-center gap-2 rounded-lg border-b-2 border-primary bg-primary/10 px-3 text-sm font-semibold text-foreground" }}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </Link>
            ))}
          </nav>

          <div className="relative flex shrink-0 items-center gap-2">
            <Link to="/search-jobs" className="hidden min-h-10 items-center gap-2 rounded-lg border border-border px-3 text-sm font-semibold text-foreground transition-colors hover:border-primary/60 hover:bg-muted sm:inline-flex">
              <Search className="h-4 w-4" aria-hidden="true" />
              Live listings
            </Link>
            <button
              type="button"
              onClick={() => setProfileOpen((open) => !open)}
              aria-expanded={profileOpen}
              aria-haspopup="menu"
              aria-label="Open account menu"
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border px-3 text-sm font-semibold text-foreground transition-colors hover:border-primary/60 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <UserRound className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">My account</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${profileOpen ? "rotate-180" : ""}`} aria-hidden="true" />
            </button>
            {profileOpen && (
              <div role="menu" className="absolute right-0 top-full z-50 mt-2 min-w-52 rounded-xl border border-border bg-card p-1.5 shadow-xl shadow-black/20">
                <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your workspace</p>
                {profileMenu.map((item) => (
                  <Link key={item.to} role="menuitem" to={item.to} onClick={() => setProfileOpen(false)} className="block rounded-lg px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <nav aria-label="Explore career tools" className="flex items-center gap-2 overflow-x-auto border-t border-border/70 px-4 py-2 text-sm xl:hidden">
          <Link to="/insights" className="shrink-0 rounded-md px-3 py-1.5 font-medium text-muted-foreground hover:bg-muted hover:text-foreground" activeProps={{ className: "shrink-0 rounded-md bg-primary/10 px-3 py-1.5 font-semibold text-foreground" }}>Market insights</Link>
          <Link to="/search-jobs" className="shrink-0 rounded-md px-3 py-1.5 font-medium text-muted-foreground hover:bg-muted hover:text-foreground" activeProps={{ className: "shrink-0 rounded-md bg-primary/10 px-3 py-1.5 font-semibold text-foreground" }}>Live job listings</Link>
        </nav>
      </header>

      <nav aria-label="Quick navigation" className="mobile-bottom-nav fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-border bg-card/95 px-2 pt-2 shadow-[0_-8px_28px_rgba(0,0,0,0.18)] backdrop-blur xl:hidden">
        {primaryNav.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact: true }}
            className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-lg px-1 pb-1 text-[11px] font-medium leading-tight text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            activeProps={{ className: "flex min-h-12 flex-col items-center justify-center gap-1 rounded-lg border border-primary/20 bg-primary/10 px-1 pb-1 text-[11px] font-semibold leading-tight text-foreground" }}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            <span>{label === "Interview simulator" ? "Practice" : label === "Resume Studio" ? "Resume" : label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}

export function SimBadge({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-xs leading-5 text-foreground">
      {children}
    </p>
  );
}
