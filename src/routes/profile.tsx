import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useProgress, type ProgressState } from "@/lib/progress";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "My resume — Workforce Prep" },
      {
        name: "description",
        content: "Save your resume to reuse across practice applications.",
      },
      { property: "og:title", content: "My resume — Workforce Prep" },
      {
        property: "og:description",
        content: "Save your resume to reuse across practice applications.",
      },
    ],
  }),
  component: Profile,
});

function downloadPracticeData(data: ProgressState) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `workforce-prep-data-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function Profile() {
  const { state, update, ready } = useProgress();
  const [name, setName] = useState("");
  const [resume, setResume] = useState("");
  const [saved, setSaved] = useState(false);
  const [notice, setNotice] = useState("");

  // Hydrate form fields from browser-local state after mount.
  useEffect(() => {
    if (ready) {
      setName(state.name);
      setResume(state.resume);
    }
  }, [ready, state.name, state.resume]);

  useEffect(() => {
    const onSyncError = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail;
      setNotice(`Cloud sync issue: ${detail} Your data remains in this browser.`);
    };
    window.addEventListener("wp-sync-error", onSyncError);
    return () => window.removeEventListener("wp-sync-error", onSyncError);
  }, []);

  function clearPracticeData() {
    const confirmed = window.confirm(
      "Delete all Workforce Prep practice data saved in this browser? This removes your resume, saved jobs, applications, and interview feedback from this browser and, if signed in, syncs the deletion to your cloud account. This cannot be undone unless you exported a backup.",
    );
    if (!confirmed) return;

    update(() => ({ name: "", resume: "", saved: [], applications: [] }));
    setName("");
    setResume("");
    setSaved(false);
    setNotice("Practice data was removed from this browser. If signed in, cloud deletion is being synced.");
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-bold">My resume</h1>
      <p className="text-muted-foreground">
        Your practice data is always kept in this browser. When you sign in, Workforce Prep also syncs your resume, saved jobs, and practice applications to your private Supabase account.
      </p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          update((current) => ({ ...current, name, resume }));
          setSaved(true);
          setNotice("Your resume was saved in this browser. If you are signed in, cloud sync is also being attempted.");
        }}
        className="mt-6 space-y-4 rounded-lg border bg-card p-6"
      >
        <label className="block">
          <span className="font-semibold">Name</span>
          <input
            value={name}
            maxLength={160}
            onChange={(event) => {
              setName(event.target.value);
              setSaved(false);
            }}
            className="mt-2 h-10 w-full rounded-md border bg-background px-3"
          />
        </label>
        <label className="block">
          <span className="font-semibold">Resume text</span>
          <span className="block text-sm text-muted-foreground">
            Avoid including sensitive information such as Social Security
            numbers, account numbers, or full home addresses.
          </span>
          <textarea
            value={resume}
            maxLength={15000}
            onChange={(event) => {
              setResume(event.target.value);
              setSaved(false);
            }}
            rows={16}
            className="mt-2 w-full rounded-md border bg-background p-3 text-sm"
          />
        </label>
        <p className="text-right text-xs text-muted-foreground">
          {resume.length.toLocaleString()} / 15,000 characters
        </p>
        <button className="h-11 rounded-md bg-primary px-6 font-semibold text-primary-foreground">
          {saved ? "Saved ✓" : "Save resume"}
        </button>
      </form>
      <section className="mt-6 rounded-lg border bg-card p-6">
        <h2 className="text-lg font-semibold">Your data</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Export a backup before clearing data. The export includes your saved
          resume and practice applications, so keep it somewhere private.
        </p>
        {notice && (
          <p role="status" className="mt-3 text-sm text-muted-foreground">
            {notice}
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              downloadPracticeData(state);
              setNotice("Your practice data export was prepared.");
            }}
            disabled={!ready}
            className="h-10 rounded-md border px-4 text-sm font-semibold disabled:opacity-50"
          >
            Export practice data
          </button>
          <button
            type="button"
            onClick={clearPracticeData}
            disabled={!ready}
            className="h-10 rounded-md border border-destructive/40 px-4 text-sm font-semibold text-destructive disabled:opacity-50"
          >
            Delete all practice data
          </button>
        </div>
      </section>
    </div>
  );
}
