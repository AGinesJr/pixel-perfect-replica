// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [VitePWA({
    strategies: "generateSW",
    outDir: "dist/client",
    injectRegister: null,
    registerType: "autoUpdate",
    manifest: false,
    devOptions: { enabled: false },
    workbox: {
      globDirectory: "dist/client",
      globPatterns: ["assets/**/*.{css,woff,woff2,png,jpg,jpeg,webp,avif}"],
      manifestTransforms: [async (entries) => ({
        manifest: entries.filter(entry => /^assets\/[^/]+-[A-Za-z0-9_-]{8,}\.(css|woff2?|png|jpe?g|webp|avif)$/.test(entry.url)),
        warnings: [],
      })],
      navigateFallback: null,
      // No document, JS, API, or runtime response caching. Cloud features remain online-only.
      runtimeCaching: [],
      cleanupOutdatedCaches: true,
    },
  })],
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
