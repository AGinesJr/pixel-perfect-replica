/** No network or private data is cached by the service worker. */
export async function registerPwa(production = import.meta.env.PROD): Promise<void> {
  if (!production || typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  try {
    await navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
  } catch {
    console.warn("Workforce Prep installation support could not be enabled.");
  }
}