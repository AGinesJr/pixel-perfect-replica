/**
 * Apply browser-facing security headers to every response emitted by our
 * TanStack Start server, including error pages.
 *
 * Keep this policy aligned with the app's integrations (Supabase auth, Google
 * Fonts/AdSense, and browser-based voice features). Avoid broad script sources.
 */
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "form-action 'self' https://*.supabase.co",
  "script-src 'self' 'unsafe-inline' https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://accounts.google.com https://apis.google.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.elevenlabs.io wss://api.elevenlabs.io https://livekit.rtc.elevenlabs.io wss://livekit.rtc.elevenlabs.io https://*.googleapis.com https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://*.googlesyndication.com https://*.doubleclick.net https://api.bls.gov https://*.lovable.app",
  "media-src 'self' blob: https://*.elevenlabs.io",
  "frame-src 'self' https://accounts.google.com https://*.supabase.co https://googleads.g.doubleclick.net https://*.doubleclick.net",
  "worker-src 'self' blob:",
  "upgrade-insecure-requests",
].join("; ");

export function withSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);

  headers.set("Content-Security-Policy", CONTENT_SECURITY_POLICY);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("X-Frame-Options", "SAMEORIGIN");
  headers.set("Permissions-Policy", "camera=(), microphone=(self), geolocation=()");
  headers.set("Strict-Transport-Security", "max-age=31536000");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export { CONTENT_SECURITY_POLICY };
