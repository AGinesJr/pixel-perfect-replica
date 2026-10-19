import { describe, expect, it, vi } from "vitest";
import {
  formatLiveStartupError,
  logLiveDiagnostic,
  safeDiagnosticDetails,
} from "./live-interview-diagnostics";

describe("live interview diagnostics", () => {
  it("redacts credentials and URLs from diagnostic messages", () => {
    const details = safeDiagnosticDetails({
      name: "Error",
      message: "Bearer abc123 authorization=secret https://example.test/rtc?token=private",
      cause: { name: "TypeError", message: "api_key=private-value" },
    });

    expect(details.message).not.toContain("abc123");
    expect(details.message).not.toContain("secret");
    expect(details.message).not.toContain("https://");
    expect(details.causeMessage).not.toContain("private-value");
    expect(JSON.stringify(details)).not.toContain("private");
  });

  it("explains microphone permission errors", () => {
    expect(formatLiveStartupError({ name: "NotAllowedError", message: "Permission denied" }, "microphone"))
      .toContain("Microphone access was denied");
  });

  it("distinguishes token failures from connection failures", () => {
    expect(formatLiveStartupError(new Error("token endpoint unavailable"), "token"))
      .toBe("token endpoint unavailable");
    expect(formatLiveStartupError(new Error("Server error: Unknown error"), "connection"))
      .toContain("live audio connection could not be established");
  });

  it("uses a helpful fallback for unknown SDK errors", () => {
    expect(formatLiveStartupError("Server error: Unknown error", "idle"))
      .toContain("unexpected error");
  });

  it("logs only safe, allowlisted diagnostic details", () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => undefined);
    logLiveDiagnostic("sdk-error", {
      message: "Failed https://example.test/rtc?token=private",
      headers: { Authorization: "Bearer secret" },
      conversationToken: "secret-token",
      status: "connecting",
    });

    const logged = JSON.stringify(spy.mock.calls);
    expect(logged).toContain("connecting");
    expect(logged).not.toContain("secret");
    expect(logged).not.toContain("https://");
    spy.mockRestore();
  });
});
