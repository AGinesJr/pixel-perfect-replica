import { Link } from "@tanstack/react-router";
import {
  Briefcase,
  ChartNoAxesCombined,
  ChevronDown,
  FileText,
  Gauge,
  MessageSquare,
  Monitor,
  Search,
  UserRound,
} from "lucide-react";
import { useState } from "react";

const primaryNav = [
  { to: "/dashboard", label: "Dashboard", icon: Gauge },
] as const;

const desktopNav = [
  ...primaryNav,
  { to: "/insights", label: "Market insights", icon: ChartNoAxesCombined },
] as const;

const practiceTools = [
  { to: "/jobs", label: "Job Market Simulator", icon: Briefcase, description: "Explore practice roles and hiring scenarios" },
  { to: "/profile", label: "Resume Match", icon: FileText, description: "Review resume fit and ATS-style scoring" },
  { to: "/dashboard", label: "Interview Prep", icon: MessageSquare, description: "Open an application from your dashboard to practice its interview" },
] as const;

const profileMenu = [
  { to: "/account", label: "My Profile & account" },
  { to: "/profile", label: "Resume" },
] as const;

export function SiteHeader() {
  const [practiceOpen, setPracticeOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const closeMenus = () => {
    setPracticeOpen(false);
    setProfileOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border/80 bg-card/95 shadow-sm shadow-black/10 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-2 px-2 sm:gap-4 sm:px-6">
          <Link to="/" onClick={closeMenus} className="flex shrink-0 items-center gap-2 rounded-md font-display text-sm font-bold tracking-tight sm:gap-2.5 sm:text-lg text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary sm:h-9 sm:w-9 text-primary-foreground shadow-sm">
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

          <div className="relative flex shrink-0 items-center gap-1 sm:gap-2">
            <Link to="/jobs" onClick={closeMenus} aria-label="Practice listings" className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border px-2 text-sm font-semibold text-foreground transition-colors hover:border-primary/60 hover:bg-muted sm:px-3">
              <Search className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Practice listings</span>
            </Link>

            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setPracticeOpen((open) => !open);
                  setProfileOpen(false);
                }}
                aria-expanded={practiceOpen}
                aria-haspopup="menu"
                aria-label="Practice Tools"
                className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 px-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary/70 hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:gap-2 sm:px-3"
              >
                <Monitor className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only sm:not-sr-only">Practice Tools</span>
                <ChevronDown className={`hidden h-4 w-4 transition-transform sm:block ${practiceOpen ? "rotate-180" : ""}`} aria-hidden="true" />
              </button>
              {practiceOpen && (
                <div role="menu" aria-label="Practice Tools" className="absolute right-0 top-full z-50 mt-2 w-72 max-w-[calc(100vw-1.5rem)] rounded-xl border border-border bg-card p-1.5 shadow-xl shadow-black/20">
                  <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Build your career skills</p>
                  {practiceTools.map(({ to, label, icon: Icon, description }) => (
                    <Link key={to} role="menuitem" to={to} onClick={closeMenus} className="flex items-start gap-3 rounded-lg px-3 py-3 text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold">{label}</span>
                        <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">{description}</span>
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setProfileOpen((open) => !open);
                  setPracticeOpen(false);
                }}
                aria-expanded={profileOpen}
                aria-haspopup="menu"
                aria-label="Open My Profile menu"
                className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-border px-2 text-sm font-semibold text-foreground transition-colors hover:border-primary/60 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:gap-2 sm:px-3"
              >
                <UserRound className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">My Profile</span>
                <ChevronDown className={`hidden h-4 w-4 transition-transform sm:block ${profileOpen ? "rotate-180" : ""}`} aria-hidden="true" />
              </button>
              {profileOpen && (
                <div role="menu" aria-label="My Profile" className="absolute right-0 top-full z-50 mt-2 min-w-52 rounded-xl border border-border bg-card p-1.5 shadow-xl shadow-black/20">
                  <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your profile</p>
                  {profileMenu.map((item) => (
                    <Link key={item.to} role="menuitem" to={item.to} onClick={closeMenus} className="block rounded-lg px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <nav aria-label="Explore career tools" className="flex items-center gap-2 overflow-x-auto border-t border-border/70 px-4 py-2 text-sm xl:hidden">
          <Link to="/insights" onClick={closeMenus} className="shrink-0 rounded-md px-3 py-1.5 font-medium text-muted-foreground hover:bg-muted hover:text-foreground" activeProps={{ className: "shrink-0 rounded-md bg-primary/10 px-3 py-1.5 font-semibold text-foreground" }}>Market insights</Link>
          <Link to="/search-jobs" onClick={closeMenus} className="shrink-0 rounded-md px-3 py-1.5 font-medium text-muted-foreground hover:bg-muted hover:text-foreground" activeProps={{ className: "shrink-0 rounded-md bg-primary/10 px-3 py-1.5 font-semibold text-foreground" }}>Practice listings</Link>
        </nav>
      </header>
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
