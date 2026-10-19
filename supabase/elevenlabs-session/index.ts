
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders,
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  try {
    const authorization = req.headers.get("Authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Sign in to start a voice interview." }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey =
      Deno.env.get("SUPABASE_ANON_KEY") ??
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY");

    const elevenLabsKey = Deno.env.get("ELEVENLABS_API_KEY");
    const agentId = Deno.env.get("ELEVENLABS_AGENT_ID");

    if (!supabaseUrl || !supabaseKey) {
      console.error("Supabase URL or public key is missing.");
      return jsonResponse({ error: "Voice interviews are not configured." }, 500);
    }

    if (!elevenLabsKey || !agentId) {
      console.error("ElevenLabs secrets are missing.");
      return jsonResponse({ error: "Voice interviews are not configured." }, 500);
    }

    // Validate the caller's Supabase access token.
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authorization } },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      return jsonResponse({ error: "Your session is invalid. Please sign in again." }, 401);
    }

    // Request a short-lived WebRTC token. Never send the API key to the browser.
    const tokenUrl = new URL(
      "https://api.elevenlabs.io/v1/convai/conversation/token",
    );
    tokenUrl.searchParams.set("agent_id", agentId);
    tokenUrl.searchParams.set("participant_name", data.user.id);

    const elevenLabsResponse = await fetch(tokenUrl, {
      method: "GET",
      headers: { "xi-api-key": elevenLabsKey },
    });

    if (!elevenLabsResponse.ok) {
      // Do not return upstream details that could reveal configuration.
      console.error("ElevenLabs token request failed:", elevenLabsResponse.status);
      return jsonResponse(
        { error: "ElevenLabs could not start a session. Check your agent configuration." },
        502,
      );
    }

    const result = await elevenLabsResponse.json();

    if (typeof result.token !== "string" || !result.token) {
      console.error("ElevenLabs returned no session token.");
      return jsonResponse({ error: "No voice session token was returned." }, 502);
    }

    return jsonResponse({
      token: result.token,
      conversationId: result.conversation_id ?? null,
    });
  } catch (error) {
    console.error(
      "elevenlabs-session failed:",
      error instanceof Error ? error.message : "Unknown error",
    );
    return jsonResponse({ error: "Unable to start the voice interview right now." }, 500);
  }
});
