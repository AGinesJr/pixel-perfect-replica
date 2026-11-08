import { afterEach, expect, it, vi } from "vitest";
import { registerPwa } from "./pwa";
afterEach(() => vi.unstubAllGlobals());
it("does not register a service worker in development", async () => {
  const register = vi.fn();
  vi.stubGlobal("navigator", { serviceWorker: { register } });
  await registerPwa(false);
  expect(register).not.toHaveBeenCalled();
});
it("registers the network-only worker in production", async () => {
  const register = vi.fn().mockResolvedValue({});
  vi.stubGlobal("navigator", { serviceWorker: { register } });
  await registerPwa(true);
  expect(register).toHaveBeenCalledWith("/sw.js", { scope: "/", updateViaCache: "none" });
});