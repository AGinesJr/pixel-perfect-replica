import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useProgress, type ProgressState } from "@/lib/progress";
import { completeOAuthCallback, getStoredSession, isSupabaseConfigured, signIn, signOut, startOAuth, type OAuthProvider } from "@/lib/supabase";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "Account & profile — Workforce Prep" },
      { name: "description", content: "Manage your account, contact details, profile photo, and cloud-sync settings." },
    ],
  }),
  component: Account,
});

function downloadPracticeData(data: ProgressState) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `workforce-prep-data-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function compressAvatar(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) return Promise.reject(new Error("Choose an image file."));
  if (file.size > 8 * 1024 * 1024) return Promise.reject(new Error("Choose an image smaller than 8 MB."));
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("The image could not be read."));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("The selected file is not a readable image."));
      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 256;
        canvas.height = 256;
        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("Your browser could not process this image."));
          return;
        }
        const crop = Math.min(image.width, image.height);
        context.drawImage(image, (image.width - crop) / 2, (image.height - crop) / 2, crop, crop, 0, 0, 256, 256);
        let quality = 0.78;
        let dataUrl = canvas.toDataURL("image/jpeg", quality);
        while (dataUrl.length > 240_000 && quality > 0.38) {
          quality -= 0.1;
          dataUrl = canvas.toDataURL("image/jpeg", quality);
        }
        if (dataUrl.length > 400_000) {
          reject(new Error("That image could not be compressed enough. Try another photo."));
          return;
        }
        resolve(dataUrl);
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

function Account() {
  const { state, update, ready } = useProgress();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [suffix, setSuffix] = useState("");
  const [mode, setMode] = useState<"choice" | "signin" | "signup">("choice");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [profileNotice, setProfileNotice] = useState("");

  useEffect(() => {
    let active = true;
    const updateAuth = () => setUserEmail(getStoredSession()?.user.email ?? null);
    setUserEmail(getStoredSession()?.user.email ?? null);
    void completeOAuthCallback().then((session) => {
      if (!active || !session) return;
      setUserEmail(session.user.email ?? null);
      setMessage("You're signed in. Your cloud practice data is syncing.");
      window.dispatchEvent(new Event("wp-progress"));
    }).catch((cause) => {
      if (active) setError(cause instanceof Error ? cause.message : "Provider sign-in could not be completed.");
    });
    window.addEventListener("wp-auth", updateAuth);
    return () => {
      active = false;
      window.removeEventListener("wp-auth", updateAuth);
    };
  }, []);

  useEffect(() => {
    const onSyncError = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail;
      setProfileNotice(`Cloud sync issue: ${detail} Your data remains in this browser.`);
    };
    window.addEventListener("wp-sync-error", onSyncError);
    return () => window.removeEventListener("wp-sync-error", onSyncError);
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await signIn(email.trim(), password);
      setUserEmail(getStoredSession()?.user.email ?? email.trim());
      setMessage("You're signed in. Your cloud practice data is syncing.");
      window.dispatchEvent(new Event("wp-progress"));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function providerName(): string {
    return [firstName.trim(), middleName.trim(), lastName.trim(), suffix].filter(Boolean).join(" ");
  }

  function handleProvider(provider: OAuthProvider | "indeed") {
    setError("");
    setMessage("");
    if (mode === "signup") {
      if (!firstName.trim() || !lastName.trim()) {
        setError("Enter your first and last name before creating an account.");
        return;
      }
      const fullName = providerName();
      setName(fullName);
      update((current) => ({ ...current, name: fullName }));
    }
    if (provider === "indeed") {
      setMessage("Indeed sign-in isn't a built-in Supabase identity provider. This button needs a separate Indeed-approved OAuth integration before it can authenticate users.");
      return;
    }
    try {
      setBusy(true);
      startOAuth(provider);
    } catch (cause) {
      setBusy(false);
      setError(cause instanceof Error ? cause.message : "Could not start provider sign-in.");
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

  function clearPracticeData() {
    const confirmed = window.confirm(
      "Delete all Workforce Prep practice data saved in this browser? This removes your profile, photo, resume, saved jobs, applications, and interview feedback from this browser and, if signed in, syncs the deletion to your cloud account. This cannot be undone unless you exported a backup.",
    );
    if (!confirmed) return;
    update(() => ({
      name: "",
      resume: "",
      contactEmail: "",
      phone: "",
      city: "",
      state: "",
      zipCode: "",
      avatarDataUrl: "",
      saved: [],
      applications: [],
    }));
    setProfileNotice("Practice data was removed from this browser. If signed in, cloud deletion is being synced.");
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-bold">Account</h1>
      <p className="mt-2 text-muted-foreground">
        Manage your sign-in, account access, and Workforce Prep practice data here. Personal contact details and your profile photo are managed on My Profile.
      </p>

      <section className="mt-6 rounded-lg border bg-card p-6">
        <h2 className="text-xl font-semibold">Account access</h2>
        {!isSupabaseConfigured && !userEmail && mode !== "choice" && (
          <div className="mt-4 rounded-md border p-4">
            <h3 className="font-semibold">Cloud account configuration needed</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Practice data can still be saved in this browser. To enable account sign-in and cross-device sync, configure VITE_SUPABASE_URL and either VITE_SUPABASE_PUBLISHABLE_KEY or VITE_SUPABASE_ANON_KEY in the hosting environment, then rebuild. Use only the public publishable/anon key, never a service-role or secret key.
            </p>
          </div>
        )}
        {userEmail ? (
          <div className="mt-4">
            <p className="text-sm text-muted-foreground">Signed in with</p>
            <p className="mt-1 break-all font-semibold">{userEmail}</p>
            <p className="mt-3 text-sm text-muted-foreground">Your sign-in email is separate from the career contact email saved on My Profile.</p>
            {message && <p role="status" className="mt-3 text-sm">{message}</p>}
            {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
            <div className="mt-4 flex flex-wrap gap-3">
              <button type="button" disabled={busy} onClick={logout} className="h-10 rounded-md border px-4 text-sm font-semibold disabled:opacity-50">{busy ? "Please wait…" : "Sign out"}</button>
              <Link to="/my-profile" className="inline-flex h-10 items-center rounded-md border px-4 text-sm font-semibold">Open My Profile</Link>
            </div>
          </div>
        ) : mode === "choice" ? (
          <div className="mt-5 rounded-xl border bg-background p-6 text-center sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Your next step starts here</p>
            <h3 className="mt-3 text-2xl font-bold">Welcome to Workforce Prep</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">Sign in to continue your career journey, or create an account to keep your progress available across devices.</p>
            <div className="mx-auto mt-6 grid max-w-sm gap-3">
              <button type="button" onClick={() => { setError(""); setMessage(""); setMode("signin"); }} className="h-12 rounded-md bg-primary px-5 font-semibold text-primary-foreground">Sign in</button>
              <button type="button" onClick={() => { setError(""); setMessage(""); setMode("signup"); }} className="h-12 rounded-md border px-5 font-semibold hover:bg-muted">Create an account</button>
            </div>
          </div>
        ) : mode === "signin" ? (
            <div className="mt-4 space-y-4">
              <button type="button" onClick={() => { setError(""); setMessage(""); setMode("choice"); }} className="text-sm font-semibold text-muted-foreground hover:text-foreground">← Back to account options</button>
              <form onSubmit={submit} className="space-y-4">
                <label className="block text-sm font-semibold">Email
                  <input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 h-11 w-full rounded-md border bg-background px-3 font-normal" />
                </label>
                <label className="block text-sm font-semibold">Password
                  <input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 h-11 w-full rounded-md border bg-background px-3 font-normal" />
                </label>
                <button disabled={busy} className="h-11 w-full rounded-md bg-primary px-5 font-semibold text-primary-foreground disabled:opacity-50">{busy ? "Please wait…" : "Sign in"}</button>
              </form>
              <div className="flex items-center gap-3 py-1 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" /><span>OR SIGN IN WITH</span><span className="h-px flex-1 bg-border" /></div>
              <div className="grid gap-2">
                <button type="button" disabled={busy} onClick={() => handleProvider("google")} className="h-11 w-full rounded-md border px-4 text-sm font-semibold hover:bg-muted disabled:opacity-50">Sign in with Google</button>
                <button type="button" disabled={busy} onClick={() => handleProvider("azure")} className="h-11 w-full rounded-md border px-4 text-sm font-semibold hover:bg-muted disabled:opacity-50">Sign in with Outlook</button>
                <button type="button" disabled={busy} onClick={() => handleProvider("apple")} className="h-11 w-full rounded-md border px-4 text-sm font-semibold hover:bg-muted disabled:opacity-50">Sign in with iCloud</button>
                <button type="button" disabled={busy} onClick={() => handleProvider("linkedin_oidc")} className="h-11 w-full rounded-md border px-4 text-sm font-semibold hover:bg-muted disabled:opacity-50">Sign in with LinkedIn</button>
                <button type="button" disabled={busy} onClick={() => handleProvider("indeed")} className="h-11 w-full rounded-md border px-4 text-sm font-semibold hover:bg-muted disabled:opacity-50">Sign in with Indeed</button>
              </div>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <button type="button" onClick={() => { setError(""); setMessage(""); setMode("choice"); }} className="text-sm font-semibold text-muted-foreground hover:text-foreground">← Back to account options</button>
              <p className="text-sm text-muted-foreground">Enter your name, then choose a provider to create your account.</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-semibold">First Name
                  <input required maxLength={80} autoComplete="given-name" value={firstName} onChange={(event) => setFirstName(event.target.value)} className="mt-2 h-11 w-full rounded-md border bg-background px-3 font-normal" />
                </label>
                <label className="block text-sm font-semibold">Middle (optional)
                  <input maxLength={80} autoComplete="additional-name" value={middleName} onChange={(event) => setMiddleName(event.target.value)} className="mt-2 h-11 w-full rounded-md border bg-background px-3 font-normal" />
                </label>
                <label className="block text-sm font-semibold">Last Name
                  <input required maxLength={80} autoComplete="family-name" value={lastName} onChange={(event) => setLastName(event.target.value)} className="mt-2 h-11 w-full rounded-md border bg-background px-3 font-normal" />
                </label>
                <label className="block text-sm font-semibold">Suffix (optional)
                  <select value={suffix} onChange={(event) => setSuffix(event.target.value)} className="mt-2 h-11 w-full rounded-md border bg-background px-3 font-normal">
                    <option value="">No suffix</option><option value="Jr.">Jr.</option><option value="Sr.">Sr.</option><option value="II">II</option><option value="III">III</option><option value="IV">IV</option><option value="V">V</option><option value="Esq.">Esq.</option>
                  </select>
                </label>
              </div>
              <div className="flex items-center gap-3 py-1 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" /><span>CREATE WITH</span><span className="h-px flex-1 bg-border" /></div>
              <div className="grid gap-2">
                <button type="button" disabled={busy} onClick={() => handleProvider("google")} className="h-11 w-full rounded-md border px-4 text-sm font-semibold hover:bg-muted disabled:opacity-50">Create with Google</button>
                <button type="button" disabled={busy} onClick={() => handleProvider("azure")} className="h-11 w-full rounded-md border px-4 text-sm font-semibold hover:bg-muted disabled:opacity-50">Create with Outlook</button>
                <button type="button" disabled={busy} onClick={() => handleProvider("apple")} className="h-11 w-full rounded-md border px-4 text-sm font-semibold hover:bg-muted disabled:opacity-50">Create with iCloud</button>
                <button type="button" disabled={busy} onClick={() => handleProvider("linkedin_oidc")} className="h-11 w-full rounded-md border px-4 text-sm font-semibold hover:bg-muted disabled:opacity-50">Create with LinkedIn</button>
                <button type="button" disabled={busy} onClick={() => handleProvider("indeed")} className="h-11 w-full rounded-md border px-4 text-sm font-semibold hover:bg-muted disabled:opacity-50">Create with Indeed</button>
              </div>
            </div>
        )}
        {message && <p role="status" className="mt-3 text-sm text-muted-foreground">{message}</p>}
        {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
      </section>

      <section className="mt-6 rounded-lg border bg-card p-6">
        <h2 className="text-lg font-semibold">Your data</h2>
        <p className="mt-1 text-sm text-muted-foreground">Export a private backup before clearing data. It includes your profile photo, contact details, resume, saved jobs, and practice applications.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" onClick={() => { downloadPracticeData(state); setProfileNotice("Your practice data export was prepared."); }} disabled={!ready} className="h-10 rounded-md border px-4 text-sm font-semibold disabled:opacity-50">Export practice data</button>
          <button type="button" onClick={clearPracticeData} disabled={!ready} className="h-10 rounded-md border border-destructive/40 px-4 text-sm font-semibold text-destructive disabled:opacity-50">Delete all practice data</button>
        </div>
      </section>
    </div>
  );
}
