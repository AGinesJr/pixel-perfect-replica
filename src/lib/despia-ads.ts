type DespiaCommand = (command: string) => Promise<unknown> | unknown;

const DESPIA_SDK_URL = "https://cdn.jsdelivr.net/npm/despia-native/+esm";

export function isDespiaRuntime(): boolean {
  return typeof navigator !== "undefined" && navigator.userAgent.toLowerCase().includes("despia");
}

/**
 * Load Despia's SDK only when a user explicitly requests a rewarded ad.
 * This keeps the ordinary website independent of the native runtime.
 */
export async function showDespiaRewardedAd(): Promise<void> {
  if (!isDespiaRuntime()) {
    throw new Error("Rewarded ads are only available in the Workforce Prep mobile app.");
  }

  const sdk = (await import(/* @vite-ignore */ DESPIA_SDK_URL)) as {
    default: DespiaCommand;
  };

  await sdk.default("displayrewardedad://");
}
