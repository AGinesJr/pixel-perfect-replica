import { Link } from "@tanstack/react-router";
import { Briefcase } from "lucide-react";

const nav = [
  { to: "/jobs", label: "Find jobs" },
  { to: "/dashboard", label: "My career" },
  { to: "/insights", label: "Market insights" },
  { to: "/profile", label: "Resume" },
  { to: "/account", label: "Account / Profile" },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-card/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-8 px-4">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold text-foreground">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-ink text-ink-foreground"><Briefcase className="h-4 w-4" /></span>
          Workforce Prep
        </Link>
        <nav className="hidden gap-6 text-sm md:flex">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} className="text-muted-foreground hover:text-foreground" activeProps={{ className: "text-foreground font-semibold" }}>{n.label}</Link>
          ))}
        </nav>
      </div>
      <nav className="flex gap-4 overflow-x-auto border-t px-4 py-2 text-sm md:hidden">
        {nav.map((n) => <Link key={n.to} to={n.to} className="whitespace-nowrap text-muted-foreground" activeProps={{ className: "text-foreground font-semibold" }}>{n.label}</Link>)}
      </nav>
    </header>
  );
}

export function SimBadge({ children }: { children: React.ReactNode }) {
  return <p className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-foreground">{children}</p>;
}
