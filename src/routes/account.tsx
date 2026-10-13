import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useProgress, type ProgressState } from "@/lib/progress";
import { getStoredSession, isSupabaseConfigured, signIn, signOut, signUp } from "@/lib/supabase";

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
  anchor.download = \`workforce-prep-data-\${new Date().toISOString().slice(0, 10)}.json\`;
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
  const navigate = useNavigate();
  const { state, update, ready } = useProgress();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [avatarDataUrl, setAvatarDataUrl] = useState("");
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileNotice, setProfileNotice] = useState("");
  const [photoBusy, setPhotoBusy] = useState(false);

  useEffect(() => {
    setUserEmail(getStoredSession()?.user.email ?? null);
    const updateAuth = () => setUserEmail(getStoredSession()?.user.email ?? null);
    window.addEventListener("wp-auth", updateAuth);
    return () => window.removeEventListener("wp-auth", updateAuth);
  }, []);

  useEffect(() => {
    if (!ready) return;
    setName(state.name);
    setContactEmail(state.contactEmail);
    setPhone(state.phone);
    setCity(state.city);
    setRegion(state.state);
    setZipCode(state.zipCode);
    setAvatarDataUrl(state.avatarDataUrl);
  }, [ready, state.name, state.contactEmail, state.phone, state.city, state.state, state.zipCode, state.avatarDataUrl]);

  useEffect(() => {
    const onSyncError = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail;
      setProfileNotice(\`Cloud sync issue: \${detail} Your data remains in this browser.\`);
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
      if (mode === "signin") {
        await signIn(email.trim(), password);
        setUserEmail(getStoredSession()?.user.email ?? email.trim());
        setMessage("You're signed in. Your cloud practice data is syncing.");
        window.dispatchEvent(new Event("wp-progress"));
      } else {
        const result = await signUp(email.trim(), password);
        if (result.confirmationRequired) {
          setMessage("Account request received. Check your email for a confirmation link, then return here and sign in.");
        } else {
          setUserEmail(getStoredSession()?.user.email ?? email.trim());
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

  async function onPhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setPhotoBusy(true);
    setProfileNotice("");
    try {
      setAvatarDataUrl(await compressAvatar(file));
      setProfileSaved(false);
      setProfileNotice("Photo selected. Save your profile to keep it.");
    } catch (cause) {
      setProfileNotice(cause instanceof Error ? cause.message : "The photo could not be processed.");
    } finally {
      setPhotoBusy(false);
    }
  }

  function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    update((current) => ({
      ...current,
      name: name.trim(),
      contactEmail: contactEmail.trim(),
      phone: phone.trim(),
      city: city.trim(),
      state: region.trim().toUpperCase(),
      zipCode: zipCode.trim(),
      avatarDataUrl,
    }));
    setProfileSaved(true);
    setProfileNotice("Your profile was saved in this browser. If signed in, cloud sync is also being attempted.");
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
    setName("");
    setContactEmail("");
    setPhone("");
    setCity("");
    setRegion("");
    setZipCode("");
    setAvatarDataUrl("");
    setProfileSaved(false);
    setProfileNotice("Practice data was removed from this browser. If signed in, cloud deletion is being synced.");
  }

  const initials = name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "WP";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-bold">Account & profile</h1>
      <p className="mt-2 text-muted-foreground">
        Manage your Workforce Prep sign-in and personal career-profile information here. Your resume has its own separate page.
      </p>

      <section className="mt-6 rounded-lg border bg-card p-6">
        <h2 className="text-xl font-semibold">Account access</h2>
        {!isSupabaseConfigured ? (
          <div className="mt-4 rounded-md border p-4">
            <h3 className="font-semibold">Cloud account configuration needed</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Profile information can still be saved in this browser. To enable account sign-in and cross-device sync, configure VITE_SUPABASE_URL and either VITE_SUPABASE_PUBLISHABLE_KEY or VITE_SUPABASE_ANON_KEY in the hosting environment, then rebuild. Use only the public publishable/anon key, never a service-role or secret key.
            </p>
          </div>
        ) : userEmail ? (
          <div className="mt-4">
            <p className="text-sm text-muted-foreground">Signed in with</p>
            <p className="mt-1 break-all font-semibold">{userEmail}</p>
            <p className="mt-3 text-sm text-muted-foreground">Your authentication email is separate from the career contact email in your profile below.</p>
            {message && <p role="status" className="mt-3 text-sm">{message}</p>}
            {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
            <div className="mt-4 flex flex-wrap gap-3">
              <button type="button" disabled={busy} onClick={logout} className="h-10 rounded-md border px-4 text-sm font-semibold disabled:opacity-50">{busy ? "Please wait…" : "Sign out"}</button>
              <Link to="/profile" className="inline-flex h-10 items-center rounded-md border px-4 text-sm font-semibold">Open resume</Link>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-4 space-y-4">
            <div className="flex gap-2 rounded-md bg-muted p-1">
              <button type="button" onClick={() => { setMode("signin"); setMessage(""); setError(""); }} className={\`flex-1 rounded px-3 py-2 text-sm font-semibold \${mode === "signin" ? "bg-background shadow-sm" : "text-muted-foreground"}\`}>Sign in</button>
              <button type="button" onClick={() => { setMode("signup"); setMessage(""); setError(""); }} className={\`flex-1 rounded px-3 py-2 text-sm font-semibold \${mode === "signup" ? "bg-background shadow-sm" : "text-muted-foreground"}\`}>Create account</button>
            </div>
            <label className="block text-sm font-semibold">Sign-in email
              <input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 h-11 w-full rounded-md border bg-background px-3 font-normal" />
            </label>
            <label className="block text-sm font-semibold">Password
              <input type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 h-11 w-full rounded-md border bg-background px-3 font-normal" />
              {mode === "signup" && <span className="mt-1 block text-xs font-normal text-muted-foreground">Use at least 8 characters. Choose a unique password.</span>}
            </label>
            {message && <p role="status" className="text-sm">{message}</p>}
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <button disabled={busy} className="h-11 w-full rounded-md bg-primary px-5 font-semibold text-primary-foreground disabled:opacity-50">{busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}</button>
          </form>
        )}
      </section>

      <section className="mt-6 rounded-lg border bg-card p-6">
        <h2 className="text-xl font-semibold">Personal profile</h2>
        <p className="mt-1 text-sm text-muted-foreground">These details are for your career profile and are separate from the email and password used to sign in.</p>
        <form onSubmit={saveProfile} className="mt-5 space-y-5">
          <div className="flex flex-col items-center gap-3 border-b pb-5 text-center">
            {avatarDataUrl ? (
              <img src={avatarDataUrl} alt="Your profile" className="h-24 w-24 rounded-full border object-cover" />
            ) : (
              <div aria-label="Profile picture placeholder" className="grid h-24 w-24 place-items-center rounded-full border bg-muted text-2xl font-bold">{initials}</div>
            )}
            <div>
              <p className="font-semibold">Profile picture</p>
              <p className="mt-1 text-xs text-muted-foreground">Square crop, resized for your profile photo.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <label className="cursor-pointer rounded-md border px-4 py-2 text-sm font-semibold hover:bg-muted">
                {photoBusy ? "Processing…" : avatarDataUrl ? "Change photo" : "Upload photo"}
                <input type="file" accept="image/*" onChange={onPhotoChange} disabled={photoBusy} className="sr-only" />
              </label>
              {avatarDataUrl && <button type="button" onClick={() => { setAvatarDataUrl(""); setProfileSaved(false); }} className="rounded-md border px-4 py-2 text-sm font-semibold">Remove photo</button>}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="font-semibold">Full name</span>
              <input value={name} maxLength={160} autoComplete="name" onChange={(event) => { setName(event.target.value); setProfileSaved(false); }} className="mt-2 h-10 w-full rounded-md border bg-background px-3" />
            </label>
            <label className="block">
              <span className="font-semibold">Career contact email</span>
              <input type="email" value={contactEmail} maxLength={254} autoComplete="email" onChange={(event) => { setContactEmail(event.target.value); setProfileSaved(false); }} className="mt-2 h-10 w-full rounded-md border bg-background px-3" />
            </label>
            <label className="block">
              <span className="font-semibold">Phone number</span>
              <input type="tel" value={phone} maxLength={40} autoComplete="tel" onChange={(event) => { setPhone(event.target.value); setProfileSaved(false); }} className="mt-2 h-10 w-full rounded-md border bg-background px-3" />
            </label>
            <label className="block">
              <span className="font-semibold">City</span>
              <input value={city} maxLength={100} autoComplete="address-level2" onChange={(event) => { setCity(event.target.value); setProfileSaved(false); }} className="mt-2 h-10 w-full rounded-md border bg-background px-3" />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="font-semibold">State</span>
                <input value={region} maxLength={2} autoComplete="address-level1" placeholder="FL" onChange={(event) => { setRegion(event.target.value.toUpperCase().slice(0, 2)); setProfileSaved(false); }} className="mt-2 h-10 w-full rounded-md border bg-background px-3 uppercase" />
              </label>
              <label className="block">
                <span className="font-semibold">ZIP code</span>
                <input value={zipCode} maxLength={10} autoComplete="postal-code" inputMode="numeric" onChange={(event) => { setZipCode(event.target.value); setProfileSaved(false); }} className="mt-2 h-10 w-full rounded-md border bg-background px-3" />
              </label>
            </div>
          </div>
          {profileNotice && <p role="status" className="text-sm text-muted-foreground">{profileNotice}</p>}
          <button disabled={!ready || photoBusy} className="h-11 rounded-md bg-primary px-6 font-semibold text-primary-foreground disabled:opacity-50">{profileSaved ? "Profile saved ✓" : "Save profile"}</button>
        </form>
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
