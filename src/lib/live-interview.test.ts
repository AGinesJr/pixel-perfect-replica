import { beforeEach, describe, expect, it, vi } from "vitest";
import { LiveInterviewError, requestVoiceToken } from "./live-interview";

const session = {
  access_token: "test-access-token",
  refresh_token: "test-refresh-token",
  user: { id: "user-123" },
};

describe("requestVoiceToken", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("requires a signed-in user before calling the Edge Function", async () => {
    const fetchImpl = vi.fn();

    await expect(requestVoiceToken({
      supabaseUrl: "https://project.supabase.co",
      supabaseKey: "public-key",
      getSession: async () => null,
      fetchImpl: fetchImpl as unknown as typeof fetch,
    })).rejects.toMatchObject({
      name: "LiveInterviewError",
      code: "auth",
    });

    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("requests a token with the user's bearer token and returns the user ID", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ token: "short-lived-token", conversationId: "conversation-1" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const result = await requestVoiceToken({
      supabaseUrl: "https://project.supabase.co/",
      supabaseKey: "public-key",
      getSession: async () => session,
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    expect(result).toEqual({ token: "short-lived-token", userId: "user-123" });
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://project.supabase.co/functions/v1/elevenlabs-session",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-access-token",
          apikey: "public-key",
          "Content-Type": "application/json",
        }),
        body: "{}",
      }),
    );
  });

  it("preserves a safe server error message for troubleshooting", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: "ElevenLabs could not start a session.", code: "ELEVENLABS_TOKEN_REQUEST_FAILED" }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(requestVoiceToken({
      supabaseUrl: "https://project.supabase.co",
      supabaseKey: "public-key",
      getSession: async () => session,
      fetchImpl: fetchImpl as unknown as typeof fetch,
    })).rejects.toMatchObject({
      name: "LiveInterviewError",
      message: "ElevenLabs could not start a session.",
      code: "server",
    });
  });

  it("reports a network error separately from server failures", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(requestVoiceToken({
      supabaseUrl: "https://project.supabase.co",
      supabaseKey: "public-key",
      getSession: async () => session,
      fetchImpl: fetchImpl as unknown as typeof fetch,
    })).rejects.toBeInstanceOf(LiveInterviewError);
  });
});
