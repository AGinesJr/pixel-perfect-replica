import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { getStoredSession, isSupabaseConfigured, signIn, signOut, signUp } from "@/lib/supabase";

export const Route = createFileRoute("/account")({
  head: () => ({ meta: [{ title: "Account — Workforce Prep" }, { name: "description", content: "Create an account to sync Workforce Prep practice progress." }] }),
  component: Account,
});

function Account() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setUserEmail(getStoredSession()?.user.email ?? null);
    const update = () => setUserEmail(getStoredSession()?.user.email ?? null);
    window.addEventListener("wp-auth", update);
    return () => window.removeEventListener("wp-auth", update);
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (mode === "signin") {
        await signIn(email.trim(), password);
        setMessage("You're signed in. Your cloud practice data is syncing.");
        window.dispatchEvent(new Event("wp-progress"));
      } else {
        const result = await signUp(email.trim(), password);
        if (result.confirmationRequired) {
          setMessage("Account request received. Check your email for a confirmation link, then return here and sign in.");
        } else {
          setMessage("Account created. Your practice data will now sync to this account.");
          window.dispatchEvent(new Event("wp-progress"));
        }
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    setBusy(true);
    setError("");
    try {
      await signOut();
      setMessage("You've signed out. Your local browser copy remains on this device.");
    } catch {
      setError("Signed out locally, but Supabase could not confirm the server logout.");
    } finally {
      setUserEmail(null);
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-3xl font-bold">Your Workforce Prep account</h1>
      <p className="mt-2 text-muted-foreground">Sign in to keep your resume and practice progress available across devices.</p>
      {!isSupabaseConfigured ? (
        <div className="mt-6 rounded-lg border p-5">
          <h2 className="font-semibold">Supabase configuration needed</h2>
          <p className="mt-2 text-sm text-muted-foreground">Add VITE_SUPABASE_URL and either VITE_SUPABASE_PUBLISHABLE_KEY or VITE_SUPABASE_ANON_KEY to the hosting environment, then rebuild the app. Use the Project URL and public publishable/anon key—not a service-role or secret key.</p>
        </div>
      ) : userEmail ? (
        <section className="mt-6 rounded-lg border bg-card p-6">
          <p className="text-sm text-muted-foreground">Signed in as</p>
          <p className="mt-1 break-all font-semibold">{userEmail}</p>
          <p className="mt-3 text-sm text-muted-foreground">Your resume, saved jobs, and practice applications sync when you save or update them. The browser also keeps a local copy.</p>
          {message && <p role="status" className="mt-4 text-sm">{message}</p>}
          {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/profile" className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground">My resume</Link>
            <button type="button" disabled={busy} onClick={logout} className="h-10 rounded-md border px-4 text-sm font-semibold disabled:opacity-50">{busy ? "Please wait…" : "Sign out"}</button>
          </div>
        </section>
      ) : (
        <form onSubmit={submit} className="mt-6 space-y-4 rounded-lg border bg-card p-6">
          <div className="flex gap-2 rounded-md bg-muted p-1">
            <button type="button" onClick={() => { setMode("signin"); setMessage(""); setError(""); }} className={`flex-1 rounded px-3 py-2 text-sm font-semibold ${mode === "signin" ? "bg-background shadow-sm" : "text-muted-foreground"}`}>Sign in</button>
            <button type="button" onClick={() => { setMode("signup"); setMessage(""); setError(""); }} className={`flex-1 rounded px-3 py-2 text-sm font-semibold ${mode === "signup" ? "bg-background shadow-sm" : "text-muted-foreground"}`}>Create account</button>
          </div>
          <label className="block text-sm font-semibold">Email
            <input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 h-11 w-full rounded-md border bg-background px-3 font-normal" />
          </label>
          <label className="block text-sm font-semibold">Password
            <input type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 h-11 w-full rounded-md border bg-background px-3 font-normal" />
            {mode === "signup" && <span className="mt-1 block text-xs font-normal text-muted-foreground">Use at least 8 characters. Choose a unique password.</span>}
          </label>
          {message && <p role="status" className="text-sm">{message}</p>}
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <button disabled={busy} className="h-11 w-full rounded-md bg-primary px-5 font-semibold text-primary-foreground disabled:opacity-50">{busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}</button>
          <p className="text-xs text-muted-foreground">Your account protects cloud records with Supabase authentication and row-level security. Avoid adding sensitive information that isn't needed for career practice.</p>
        </form>
      )}
    </div>
  );
}
