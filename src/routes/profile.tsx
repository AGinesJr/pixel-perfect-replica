import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type ChangeEvent } from "react";
import { useProgress, type ProgressState } from "@/lib/progress";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "My profile and resume — Workforce Prep" },
      {
        name: "description",
        content: "Update your contact details, profile photo, and resume for career practice.",
      },
      { property: "og:title", content: "My profile and resume — Workforce Prep" },
      {
        property: "og:description",
        content: "Update your contact details, profile photo, and resume for career practice.",
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

function compressAvatar(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    return Promise.reject(new Error("Choose an image file."));
  }
  if (file.size > 8 * 1024 * 1024) {
    return Promise.reject(new Error("Choose an image smaller than 8 MB."));
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("The image could not be read."));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("The selected file is not a readable image."));
      image.onload = () => {
        const canvas = document.createElement("canvas");
        const size = 256;
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("Your browser could not process this image."));
          return;
        }
        const crop = Math.min(image.width, image.height);
        const left = (image.width - crop) / 2;
        const top = (image.height - crop) / 2;
        context.drawImage(image, left, top, crop, crop, 0, 0, size, size);
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

function Profile() {
  const { state, update, ready } = useProgress();
  const [name, setName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [avatarDataUrl, setAvatarDataUrl] = useState("");
  const [resume, setResume] = useState("");
  const [saved, setSaved] = useState(false);
  const [notice, setNotice] = useState("");
  const [photoBusy, setPhotoBusy] = useState(false);

  useEffect(() => {
    if (ready) {
      setName(state.name);
      setContactEmail(state.contactEmail);
      setPhone(state.phone);
      setCity(state.city);
      setRegion(state.state);
      setZipCode(state.zipCode);
      setAvatarDataUrl(state.avatarDataUrl);
      setResume(state.resume);
    }
  }, [ready, state.name, state.contactEmail, state.phone, state.city, state.state, state.zipCode, state.avatarDataUrl, state.resume]);

  useEffect(() => {
    const onSyncError = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail;
      setNotice(`Cloud sync issue: ${detail} Your data remains in this browser.`);
    };
    window.addEventListener("wp-sync-error", onSyncError);
    return () => window.removeEventListener("wp-sync-error", onSyncError);
  }, []);

  async function onPhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setPhotoBusy(true);
    setNotice("");
    try {
      const compressed = await compressAvatar(file);
      setAvatarDataUrl(compressed);
      setSaved(false);
      setNotice("Photo selected. Save your profile to keep it.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The photo could not be processed.");
    } finally {
      setPhotoBusy(false);
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
    setName("");
    setContactEmail("");
    setPhone("");
    setCity("");
    setRegion("");
    setZipCode("");
    setAvatarDataUrl("");
    setResume("");
    setSaved(false);
    setNotice("Practice data was removed from this browser. If signed in, cloud deletion is being synced.");
  }

  const initials = name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "WP";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-bold">My profile and resume</h1>
      <p className="mt-2 text-muted-foreground">
        Keep your contact details and resume ready for career-practice applications. Your profile stays in this browser and syncs to your private Supabase account when signed in and configured.
      </p>
      <form
        onSubmit={(event) => {
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
            resume,
          }));
          setSaved(true);
          setNotice("Your profile and resume were saved in this browser. If signed in, cloud sync is also being attempted.");
        }}
        className="mt-6 space-y-6 rounded-lg border bg-card p-6"
      >
        <section className="flex flex-col items-center gap-3 border-b pb-6 text-center">
          {avatarDataUrl ? (
            <img src={avatarDataUrl} alt="Your profile" className="h-24 w-24 rounded-full border object-cover" />
          ) : (
            <div aria-label="Profile picture placeholder" className="grid h-24 w-24 place-items-center rounded-full border bg-muted text-2xl font-bold">
              {initials}
            </div>
          )}
          <div>
            <p className="font-semibold">Profile picture</p>
            <p className="mt-1 text-xs text-muted-foreground">Square crop, resized for your profile bubble.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <label className="cursor-pointer rounded-md border px-4 py-2 text-sm font-semibold hover:bg-muted">
              {photoBusy ? "Processing…" : avatarDataUrl ? "Change photo" : "Upload photo"}
              <input type="file" accept="image/*" onChange={onPhotoChange} disabled={photoBusy} className="sr-only" />
            </label>
            {avatarDataUrl && (
              <button type="button" onClick={() => { setAvatarDataUrl(""); setSaved(false); }} className="rounded-md border px-4 py-2 text-sm font-semibold">
                Remove photo
              </button>
            )}
          </div>
        </section>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="font-semibold">Full name</span>
            <input value={name} maxLength={160} autoComplete="name" onChange={(event) => { setName(event.target.value); setSaved(false); }} className="mt-2 h-10 w-full rounded-md border bg-background px-3" />
          </label>
          <label className="block">
            <span className="font-semibold">Contact email</span>
            <input type="email" value={contactEmail} maxLength={254} autoComplete="email" onChange={(event) => { setContactEmail(event.target.value); setSaved(false); }} className="mt-2 h-10 w-full rounded-md border bg-background px-3" />
            <span className="mt-1 block text-xs text-muted-foreground">For your career profile; this does not change your sign-in email.</span>
          </label>
          <label className="block">
            <span className="font-semibold">Phone number</span>
            <input type="tel" value={phone} maxLength={40} autoComplete="tel" onChange={(event) => { setPhone(event.target.value); setSaved(false); }} className="mt-2 h-10 w-full rounded-md border bg-background px-3" />
          </label>
          <label className="block">
            <span className="font-semibold">City</span>
            <input value={city} maxLength={100} autoComplete="address-level2" onChange={(event) => { setCity(event.target.value); setSaved(false); }} className="mt-2 h-10 w-full rounded-md border bg-background px-3" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="font-semibold">State</span>
              <input value={region} maxLength={2} autoComplete="address-level1" placeholder="FL" onChange={(event) => { setRegion(event.target.value.toUpperCase().slice(0, 2)); setSaved(false); }} className="mt-2 h-10 w-full rounded-md border bg-background px-3 uppercase" />
            </label>
            <label className="block">
              <span className="font-semibold">ZIP code</span>
              <input value={zipCode} maxLength={10} autoComplete="postal-code" inputMode="numeric" onChange={(event) => { setZipCode(event.target.value); setSaved(false); }} className="mt-2 h-10 w-full rounded-md border bg-background px-3" />
            </label>
          </div>
        </div>

        <label className="block">
          <span className="font-semibold">Resume text</span>
          <span className="block text-sm text-muted-foreground">
            Avoid including Social Security numbers, account numbers, or other sensitive information.
          </span>
          <textarea value={resume} maxLength={15000} onChange={(event) => { setResume(event.target.value); setSaved(false); }} rows={14} className="mt-2 w-full rounded-md border bg-background p-3 text-sm" />
        </label>
        <p className="text-right text-xs text-muted-foreground">{resume.length.toLocaleString()} / 15,000 characters</p>
        <button disabled={!ready || photoBusy} className="h-11 rounded-md bg-primary px-6 font-semibold text-primary-foreground disabled:opacity-50">
          {saved ? "Saved ✓" : "Save profile and resume"}
        </button>
      </form>

      <section className="mt-6 rounded-lg border bg-card p-6">
        <h2 className="text-lg font-semibold">Your data</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Export a backup before clearing data. The export includes your profile photo, contact details, resume, saved jobs, and practice applications, so keep it somewhere private.
        </p>
        {notice && <p role="status" className="mt-3 text-sm text-muted-foreground">{notice}</p>}
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" onClick={() => { downloadPracticeData(state); setNotice("Your practice data export was prepared."); }} disabled={!ready} className="h-10 rounded-md border px-4 text-sm font-semibold disabled:opacity-50">
            Export practice data
          </button>
          <button type="button" onClick={clearPracticeData} disabled={!ready} className="h-10 rounded-md border border-destructive/40 px-4 text-sm font-semibold text-destructive disabled:opacity-50">
            Delete all practice data
          </button>
        </div>
      </section>
    </div>
  );
}
