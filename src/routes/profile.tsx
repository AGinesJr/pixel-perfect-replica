import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useProgress } from "@/lib/progress";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "My resume — Workforce Prep" },
      { name: "description", content: "Save your resume to reuse across practice applications." },
      { property: "og:title", content: "My resume — Workforce Prep" },
      { property: "og:description", content: "Save your resume to reuse across practice applications." },
    ],
  }),
  component: Profile,
});

function Profile() {
  const { state, update, ready } = useProgress();
  const [name, setName] = useState("");
  const [resume, setResume] = useState("");
  const [saved, setSaved] = useState(false);
  useEffect(() => { if (ready) { setName(state.name); setResume(state.resume); } }, [ready]); // eslint-disable-line
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-bold">My resume</h1>
      <p className="text-muted-foreground">Stored privately in this browser and pre-filled on every application.</p>
      <form onSubmit={(e) => { e.preventDefault(); update((s) => ({ ...s, name, resume })); setSaved(true); }} className="mt-6 space-y-4 rounded-lg border bg-card p-6">
        <label className="block"><span className="font-semibold">Name</span><input value={name} onChange={(e) => { setName(e.target.value); setSaved(false); }} className="mt-2 h-10 w-full rounded-md border bg-background px-3" /></label>
        <label className="block"><span className="font-semibold">Resume text</span><textarea value={resume} onChange={(e) => { setResume(e.target.value); setSaved(false); }} rows={16} className="mt-2 w-full rounded-md border bg-background p-3 text-sm" /></label>
        <button className="h-11 rounded-md bg-primary px-6 font-semibold text-primary-foreground">{saved ? "Saved ✓" : "Save resume"}</button>
      </form>
    </div>
  );
}
