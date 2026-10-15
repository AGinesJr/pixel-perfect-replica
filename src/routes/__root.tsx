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
      { title: "Workforce Prep" },
      { name: "description", content: "Practice the job search with an AI recruiter and interviewer." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Epilogue:wght@400;500;600&family=Urbanist:wght@600;700;800&display=swap" },
      {
        rel: "stylesheet",
        href: appCss,
      },
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
  const [session, setSession] = useState<AuthSession | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const isAccountRoute = pathname === "/account";

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

  return (
    <QueryClientProvider client={queryClient}>
      {hasAccess ? <SiteHeader /> : (
        <header className="border-b bg-card px-4 py-4">
          <div className="mx-auto max-w-6xl font-display text-lg font-bold">Workforce Prep</div>
        </header>
      )}
      <main className="min-h-[70vh]">
        {isAccountRoute ? <Outlet /> : !authChecked ? (
          <div className="mx-auto flex min-h-[50vh] max-w-xl items-center justify-center px-4 text-center">
            <p className="text-sm text-muted-foreground">Checking your sign-in…</p>
          </div>
        ) : hasAccess ? <Outlet /> : (
          <section className="mx-auto flex min-h-[65vh] max-w-2xl flex-col items-center justify-center px-4 py-12 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary">
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="4" y="10" width="16" height="11" rx="2" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              </svg>
            </div>
            <p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-primary">Account required</p>
            <h1 className="mt-2 text-3xl font-bold md:text-4xl">Your career journey starts with an account.</h1>
            <p className="mt-4 max-w-xl text-muted-foreground">Sign in or create a free Workforce Prep account to search practice jobs, use resume tools, practice interviews, and access your career dashboard. Your progress can sync with your account.</p>
            <Link to="/account" className="mt-7 inline-flex h-12 items-center justify-center rounded-md bg-primary px-6 font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
              Sign in or create an account
            </Link>
            <p className="mt-3 text-xs text-muted-foreground">You’ll be able to choose sign-in or account creation on the next screen.</p>
          </section>
        )}
      </main>
      {(hasAccess || isAccountRoute) && <footer className="border-t bg-card py-8 text-center text-xs text-muted-foreground">Workforce Prep · A career practice simulator. Employers and listings are fictional.</footer>}
    </QueryClientProvider>
  );
}
