import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  useRouterState,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Moon, Sun } from "lucide-react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { SiteHeader } from "../components/SiteHeader";
import { registerPwa } from "../lib/pwa";
import { getValidSession } from "../lib/supabase";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Workforce Prep" },
      { name: "description", content: "Practice the job search with an AI recruiter and interviewer." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "theme-color", content: "#0f1b3d" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-title", content: "Workforce Prep" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Epilogue:wght@400;500;600&family=Urbanist:wght@600;700;800&display=swap" },
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/icons/icon-180.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const dark = window.localStorage.getItem("workforce-prep-theme") === "dark";
    setIsDark(dark);
    document.documentElement.classList.toggle("dark", dark);
    document.documentElement.style.colorScheme = dark ? "dark" : "light";
  }, []);

  const toggleTheme = () => {
    const nextIsDark = !isDark;
    setIsDark(nextIsDark);
    document.documentElement.classList.toggle("dark", nextIsDark);
    document.documentElement.style.colorScheme = nextIsDark ? "dark" : "light";
    window.localStorage.setItem("workforce-prep-theme", nextIsDark ? "dark" : "light");
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      onClick={toggleTheme}
      className="group inline-flex min-h-10 items-center gap-2 rounded-full border border-border bg-background px-2.5 py-1.5 text-foreground shadow-sm transition-colors hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Sun className={`h-4 w-4 transition-colors ${isDark ? "text-muted-foreground" : "text-amber-500"}`} aria-hidden="true" />
      <span className={`relative h-6 w-11 rounded-full p-0.5 transition-colors ${isDark ? "bg-primary" : "bg-slate-300"}`}>
        <span className={`block h-5 w-5 rounded-full bg-white shadow-md transition-transform ${isDark ? "translate-x-5" : "translate-x-0"}`} />
      </span>
      <Moon className={`h-4 w-4 transition-colors ${isDark ? "text-primary" : "text-muted-foreground"}`} aria-hidden="true" />
      <span className="sr-only">{isDark ? "Dark theme enabled" : "Light theme enabled"}</span>
    </button>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isPublicRoute = pathname === "/" || pathname === "/account";
  const [authCheck, setAuthCheck] = useState<{ pathname: string; allowed: boolean } | null>(null);

  useEffect(() => { void registerPwa().catch(() => { /* Installation must not block the app. */ }); }, []);

  useEffect(() => {
    let active = true;
    if (isPublicRoute) {
      setAuthCheck({ pathname, allowed: true });
      return () => { active = false; };
    }

    setAuthCheck(null);
    void getValidSession().then((session) => {
      if (!active) return;
      if (!session) {
        window.location.replace("/account");
        return;
      }
      setAuthCheck({ pathname, allowed: true });
    }).catch(() => {
      if (active) window.location.replace("/account");
    });

    return () => { active = false; };
  }, [pathname, isPublicRoute]);

  const routeAllowed = isPublicRoute || (authCheck?.pathname === pathname && authCheck.allowed);

  return (
    <QueryClientProvider client={queryClient}>
      <SiteHeader />
      <main className="min-h-[70vh]">
        {routeAllowed ? <Outlet /> : (
          <div className="mx-auto flex min-h-[50vh] max-w-xl items-center justify-center px-4 text-center text-sm text-muted-foreground" role="status" aria-live="polite">
            Checking your account…
          </div>
        )}
      </main>
      <footer className="border-t bg-card px-4 py-5 text-xs text-muted-foreground">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="max-w-3xl text-center sm:text-left">Workforce Prep · A career practice simulator. Practice employers and listings are fictional.</p>
          <div className="flex shrink-0 items-center gap-3">
            <span className="font-medium text-foreground">Theme</span>
            <ThemeToggle />
          </div>
        </div>
      </footer>
    </QueryClientProvider>
  );
}
