import { describe, expect, it } from "vitest";
import { CONTENT_SECURITY_POLICY, withSecurityHeaders } from "./security-headers";

describe("security response headers", () => {
  it("sets a CSP and common browser security headers", async () => {
    const response = withSecurityHeaders(new Response("ok", { status: 200 }));

    expect(response.headers.get("content-security-policy")).toContain("default-src 'self'");
    expect(response.headers.get("content-security-policy")).toContain("object-src 'none'");
    expect(response.headers.get("content-security-policy")).toContain("frame-ancestors 'self'");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("referrer-policy")).toBe("strict-origin-when-cross-origin");
    expect(response.headers.get("x-frame-options")).toBe("SAMEORIGIN");
    expect(response.headers.get("strict-transport-security")).toContain("max-age=31536000");
    expect(response.headers.get("permissions-policy")).toContain("microphone=(self)");
    expect(await response.text()).toBe("ok");
  });

  it("allows the narrowly scoped ElevenLabs LiveKit voice signaling endpoints", () => {
    expect(CONTENT_SECURITY_POLICY).toContain("https://livekit.rtc.elevenlabs.io");
    expect(CONTENT_SECURITY_POLICY).toContain("wss://livekit.rtc.elevenlabs.io");
  });

  it("does not allow plugin objects or arbitrary remote scripts", () => {
    expect(CONTENT_SECURITY_POLICY).toContain("object-src 'none'");
    expect(CONTENT_SECURITY_POLICY).toContain("script-src 'self' 'unsafe-inline'");
    expect(CONTENT_SECURITY_POLICY).not.toContain("script-src https:");
  });

  it("preserves the original response status and headers", () => {
    const response = withSecurityHeaders(
      new Response("missing", {
        status: 404,
        headers: { "content-type": "text/plain", "x-existing": "kept" },
      }),
    );

    expect(response.status).toBe(404);
    expect(response.headers.get("content-type")).toBe("text/plain");
    expect(response.headers.get("x-existing")).toBe("kept");
  });
});
