import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useProgress } from "@/lib/progress";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "My resume — Workforce Prep" },
      { name: "description", content: "Edit and save your resume for career-practice applications." },
      { property: "og:title", content: "My resume — Workforce Prep" },
      { property: "og:description", content: "Edit and save your resume for career-practice applications." },
    ],
  }),
  component: Profile,
});

function Profile() {
  const { state, update, ready } = useProgress();
  const [resume, setResume] = useState("");
  const [saved, setSaved] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (ready) setResume(state.resume);
  }, [ready, state.resume]);

  useEffect(() => {
    const onSyncError = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail;
      setNotice(\`Cloud sync issue: \${detail} Your data remains in this browser.\`);
    };
    window.addEventListener("wp-sync-error", onSyncError);
    return () => window.removeEventListener("wp-sync-error", onSyncError);
  }, []);

  function saveResume(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    update((current) => ({ ...current, resume }));
    setSaved(true);
    setNotice("Your resume was saved in this browser. If signed in, cloud sync is also being attempted.");
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-bold">My resume</h1>
      <p className="mt-2 text-muted-foreground">
        Keep the professional experience, skills, and qualifications you want to use for career-practice applications here.
      </p>

      <section className="mt-6 rounded-lg border bg-card p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold">Personal contact details</h2>
            <p className="mt-1 text-sm text-muted-foreground">Your name, contact information, location, and profile photo are managed separately.</p>
          </div>
          <Link to="/account" className="inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-semibold">Manage account & profile</Link>
        </div>
        {(state.name || state.contactEmail || state.phone || state.city || state.state || state.zipCode) && (
          <div className="mt-4 border-t pt-4 text-sm">
            {state.name && <p className="font-semibold">{state.name}</p>}
            {state.contactEmail && <p>{state.contactEmail}</p>}
            {state.phone && <p>{state.phone}</p>}
            {(state.city || state.state || state.zipCode) && <p>{[state.city, state.state, state.zipCode].filter(Boolean).join(", ")}</p>}
          </div>
        )}
      </section>

      <form onSubmit={saveResume} className="mt-6 space-y-4 rounded-lg border bg-card p-6">
        <label className="block">
          <span className="font-semibold">Resume text</span>
          <span className="mt-1 block text-sm text-muted-foreground">
            Add your work history, education, skills, certifications, and achievements. Avoid including Social Security numbers, account numbers, or other sensitive information.
          </span>
          <textarea
            value={resume}
            maxLength={15000}
            onChange={(event) => { setResume(event.target.value); setSaved(false); }}
            rows={18}
            className="mt-3 w-full rounded-md border bg-background p-3 text-sm"
            placeholder="Paste or write your resume here…"
          />
        </label>
        <p className="text-right text-xs text-muted-foreground">{resume.length.toLocaleString()} / 15,000 characters</p>
        {notice && <p role="status" className="text-sm text-muted-foreground">{notice}</p>}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">Your resume is stored locally and syncs to your account when cloud sync is configured.</p>
          <button disabled={!ready} className="h-11 rounded-md bg-primary px-6 font-semibold text-primary-foreground disabled:opacity-50">{saved ? "Resume saved ✓" : "Save resume"}</button>
        </div>
      </form>
    </div>
  );
}
