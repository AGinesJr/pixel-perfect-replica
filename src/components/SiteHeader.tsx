import { Link } from "@tanstack/react-router";
import { Briefcase, ChevronDown } from "lucide-react";
import { useState } from "react";

const nav = [
  { to: "/jobs", label: "Find jobs" },
  { to: "/insights", label: "Market insights" },
  { to: "/job-prep", label: "Interview Prep" },
] as const;

const profileMenu = [
  { to: "/account", label: "Account" },
  { to: "/dashboard", label: "My Career" },
  { to: "/profile", label: "Resume" },
] as const;

export function SiteHeader() {
  const [mobileProfileOpen, setMobileProfileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b bg-card/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-8 px-4">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold text-foreground">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-ink text-ink-foreground"><Briefcase className="h-4 w-4" /></span>
          Workforce Prep
        </Link>
        <nav aria-label="Main navigation" className="hidden items-center gap-6 text-sm md:flex">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} className="text-muted-foreground hover:text-foreground" activeProps={{ className: "text-foreground font-semibold" }}>{n.label}</Link>
          ))}
          <div className="group relative">
            <Link
              to="/my-profile"
              className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
              activeProps={{ className: "text-foreground font-semibold" }}
              aria-haspopup="true"
            >
              My Profile <ChevronDown className="h-4 w-4" aria-hidden="true" />
            </Link>
            <div className="invisible absolute right-0 top-full z-50 min-w-44 translate-y-1 rounded-md border bg-card p-1 opacity-0 shadow-lg transition-all group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
              {profileMenu.map((item) => (
                <Link key={item.to} to={item.to} className="block rounded-sm px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground" activeProps={{ className: "bg-muted font-semibold text-foreground" }}>{item.label}</Link>
              ))}
            </div>
          </div>
        </nav>
      </div>
      <nav aria-label="Mobile navigation" className="flex flex-wrap items-center gap-4 border-t px-4 py-2 text-sm md:hidden">
        {nav.map((n) => <Link key={n.to} to={n.to} className="whitespace-nowrap text-muted-foreground" activeProps={{ className: "text-foreground font-semibold" }}>{n.label}</Link>)}
        <Link to="/my-profile" className="whitespace-nowrap text-muted-foreground" activeProps={{ className: "text-foreground font-semibold" }}>My Profile</Link>
        <button
          type="button"
          onClick={() => setMobileProfileOpen((open) => !open)}
          aria-expanded={mobileProfileOpen}
          aria-label="Toggle My Profile menu"
          className="inline-flex items-center gap-1 rounded-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${mobileProfileOpen ? "rotate-180" : ""}`} aria-hidden="true" />
        </button>
        {mobileProfileOpen && (
          <div className="flex w-full flex-wrap gap-4 border-t pt-2">
            {profileMenu.map((item) => (
              <Link key={item.to} to={item.to} onClick={() => setMobileProfileOpen(false)} className="whitespace-nowrap text-muted-foreground hover:text-foreground" activeProps={{ className: "font-semibold text-foreground" }}>{item.label}</Link>
            ))}
          </div>
        )}
      </nav>
    </header>
  );
}

export function SimBadge({ children }: { children: React.ReactNode }) {
  return <p className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-foreground">{children}</p>;
}
