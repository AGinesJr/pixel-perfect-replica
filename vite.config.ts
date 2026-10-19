// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    VitePWA({
      strategies: "generateSW",
      outDir: ".output/public",
      injectRegister: null,
      registerType: "autoUpdate",
      manifest: false,
      devOptions: { enabled: false },
      workbox: {
        globDirectory: ".output/public",
        // Precache only public, non-personal static assets. Keep documents, JS, API
        // responses, auth state, resumes, applications, and AI sessions out of cache.
        globPatterns: ["assets/**/*.{css,woff,woff2,png,jpg,jpeg,webp,avif}"],
        navigateFallback: null,
        runtimeCaching: [],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
