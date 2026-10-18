import { useEffect, useState } from "react";
import { isDespiaRuntime } from "@/lib/despia-ads";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export function WebsiteAdSlot() {
  const client = import.meta.env.VITE_ADSENSE_CLIENT_ID?.trim();
  const slot = import.meta.env.VITE_ADSENSE_SLOT_ID?.trim();
  const [readyForWeb, setReadyForWeb] = useState(false);

  useEffect(() => {
    setReadyForWeb(!isDespiaRuntime());
  }, []);

  useEffect(() => {
    if (!readyForWeb || !client || !slot) return;

    let script = document.getElementById("google-adsense-script") as HTMLScriptElement | null;
    const requestAd = () => {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch {
        // AdSense can decline to fill an unapproved or not-yet-configured placement.
      }
    };

    if (!script) {
      script = document.createElement("script");
      script.id = "google-adsense-script";
      script.async = true;
      script.crossOrigin = "anonymous";
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client)}`;
      script.addEventListener("load", () => {
        script!.dataset.loaded = "true";
        requestAd();
      }, { once: true });
      document.head.appendChild(script);
    } else if (script.dataset.loaded === "true") {
      requestAd();
    } else {
      script.addEventListener("load", requestAd, { once: true });
    }

    return () => {
      script?.removeEventListener("load", requestAd);
    };
  }, [client, readyForWeb, slot]);

  if (!readyForWeb || !client || !slot) return null;

  return (
    <aside aria-label="Sponsored content" className="mx-auto my-6 w-full max-w-7xl px-4">
      <div className="overflow-hidden rounded-xl border border-border bg-card p-3 sm:p-4">
        <p className="mb-2 text-center text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Advertisement</p>
        <ins
          className="adsbygoogle block min-h-[90px] w-full"
          style={{ display: "block" }}
          data-ad-client={client}
          data-ad-slot={slot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    </aside>
  );
}
