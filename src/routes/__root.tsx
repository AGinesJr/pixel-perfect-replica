import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { SiteHeader } from "../components/SiteHeader";
import { getStoredSession, getValidSession, type AuthSession } from "../lib/supabase";

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
      { name: "theme-color", content: "#0B1220" },
      { title: "Workforce Prep | Career Practice & Interview Simulator" },
      {
        name: "description",
        content:
          "Prepare for your next opportunity with a career practice simulator. Rehearse job applications, improve your resume, practice interviews, and explore labor-market insights.",
      },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Workforce Prep" },
      { property: "og:title", content: "Workforce Prep | Career Practice & Interview Simulator" },
      {
        property: "og:description",
        content:
          "Practice the job search, strengthen your resume, and build interview confidence with explainable feedback.",
      },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Workforce Prep | Career Practice & Interview Simulator" },
      {
        name: "twitter:description",
        content:
          "Practice the job search, strengthen your resume, and build interview confidence with explainable feedback.",
      },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap",
      },
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
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

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (router) => router.location.pathname });
  const locationHref = useRouterState({ select: (router) => router.location.href });
  const [session, setSession] = useState<AuthSession | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const isAccountRoute = pathname === "/account";
  // Keep the marketing homepage crawlable; product tools still require authentication.
  const isPublicMarketingRoute = pathname === "/";

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [locationHref]);

  useEffect(() => {
    const scrollToTopForNextAction = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const control = target.closest("button, a, [role='button'], input[type='button'], input[type='submit']");
      if (!control) return;
      const label = [
        control.getAttribute("aria-label"),
        control.getAttribute("title"),
        control.textContent,
        control instanceof HTMLInputElement ? control.value : "",
      ].filter(Boolean).join(" ").trim();
      if (!/^next(?:\b|$)/i.test(label) && !/\bnext page\b/i.test(label)) return;
      window.requestAnimationFrame(() => window.scrollTo(0, 0));
    };
    document.addEventListener("click", scrollToTopForNextAction);
    return () => document.removeEventListener("click", scrollToTopForNextAction);
  }, []);

  useEffect(() => {
    let active = true;
    const checkSession = async () => {
      const valid = await getValidSession();
      if (!active) return;
      setSession(valid);
      setAuthChecked(true);
    };
    void checkSession();

    const onAuthChange = () => {
      setSession(getStoredSession());
      setAuthChecked(true);
    };
    window.addEventListener("wp-auth", onAuthChange);
    return () => {
      active = false;
      window.removeEventListener("wp-auth", onAuthChange);
    };
  }, []);

  const hasAccess = Boolean(session);
  const canViewWithoutSession = isAccountRoute || isPublicMarketingRoute;

  return (
    <QueryClientProvider client={queryClient}>
      {hasAccess ? (
        <SiteHeader />
      ) : (
        <header className="border-b border-white/10 bg-[#0B1220] px-4 py-4 text-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
            <Link to="/" className="font-display text-lg font-bold tracking-tight text-white">
              Workforce <span className="text-[#24D7E8]">Prep</span>
            </Link>
            <Link
              to="/account"
              className="inline-flex min-h-10 items-center justify-center rounded-lg border border-white/20 px-4 text-sm font-semibold text-white transition-colors hover:border-[#24D7E8] hover:text-[#24D7E8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#24D7E8]"
            >
              Sign in
            </Link>
          </div>
        </header>
      )}
      <main className="min-h-[70vh]">
        {canViewWithoutSession ? (
          <Outlet />
        ) : !authChecked ? (
          <div className="mx-auto flex min-h-[50vh] max-w-xl items-center justify-center px-4 text-center">
            <p className="text-sm text-muted-foreground">Checking your sign-in…</p>
          </div>
        ) : hasAccess ? (
          <Outlet />
        ) : (
          <section className="mx-auto flex min-h-[65vh] max-w-2xl flex-col items-center justify-center px-4 py-12 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary">
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="4" y="10" width="16" height="11" rx="2" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              </svg>
            </div>
            <p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-primary">Account required</p>
            <h1 className="mt-2 text-3xl font-bold md:text-4xl">Your career journey starts with an account.</h1>
            <p className="mt-4 max-w-xl text-muted-foreground">
              Sign in or create a free Workforce Prep account to search practice jobs, use resume tools,
              practice interviews, and access your career dashboard. Your progress can sync with your account.
            </p>
            <Link
              to="/account"
              className="mt-7 inline-flex h-12 items-center justify-center rounded-lg bg-primary px-6 font-semibold text-primary-foreground transition-colors hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Sign in or create an account
            </Link>
            <p className="mt-3 text-xs text-muted-foreground">You’ll be able to choose sign-in or account creation on the next screen.</p>
          </section>
        )}
      </main>
      {(hasAccess || isAccountRoute || isPublicMarketingRoute) && (
        <footer className="border-t border-white/10 bg-[#0B1220] px-4 py-8 text-center text-xs text-slate-400">
          Workforce Prep · Career practice and job-search tools. Simulator roles are fictional; live listings are sourced separately and may change.
        </footer>
      )}
    </QueryClientProvider>
  );
}
