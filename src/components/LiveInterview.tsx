import { useEffect, useRef, useState } from "react";
import { ConversationProvider, useConversation } from "@elevenlabs/react";
import {
  appendTranscript, buildInterviewPrompt, hasEnoughTranscript,
  requestVoiceToken, toTranscriptMsg, type InterviewMsg, type VoiceJob,
} from "@/lib/live-interview";
import { logLiveDiagnostic } from "@/lib/live-interview-diagnostics";

type Props = {
  job: VoiceJob;
  scoring: boolean;
  onFinish: (transcript: InterviewMsg[]) => void;
  onSwitchToManual: () => void;
  voiceOnly?: boolean;
};

export default function LiveInterview(props: Props) {
  return (
    <ConversationProvider>
      <LiveInner {...props} />
    </ConversationProvider>
  );
}

type Phase = "ready" | "connecting" | "live" | "finished" | "error";

function LiveInner({ job, scoring, onFinish, onSwitchToManual, voiceOnly = false }: Props) {
  const [phase, setPhase] = useState<Phase>("ready");
  const [error, setError] = useState("");
  const [transcript, setTranscript] = useState<InterviewMsg[]>([]);
  const [typed, setTyped] = useState("");
  const [muted, setMuted] = useState(false);
  const transcriptRef = useRef<InterviewMsg[]>([]);
  const userEnded = useRef(false);

  const conversation = useConversation({
    micMuted: muted,
    onMessage: (m) => {
      const next = appendTranscript(transcriptRef.current, toTranscriptMsg(m));
      transcriptRef.current = next;
      setTranscript(next);
    },
    onError: (message) => {
      logLiveDiagnostic("sdk-error", message);
      setError(message || "The voice connection had a problem.");
      setPhase("error");
    },
    onDisconnect: (details) => {
      logLiveDiagnostic("sdk-disconnect", details);
      if (userEnded.current) return;
      if (details.reason === "error") {
        setError(details.message || "The voice connection was lost.");
        setPhase("error");
      } else if (transcriptRef.current.length === 0) {
        // A connection that closes before the interviewer speaks is not a
        // completed interview. Keep the retry action visible and explain this.
        setError("The voice session disconnected before the interviewer could begin. Please retry. If it repeats, check the ElevenLabs agent's first message and conversation settings.");
        setPhase("error");
      } else {
        setPhase("finished");
      }
    },
  });

  const convRef = useRef(conversation);
  convRef.current = conversation;
  useEffect(() => () => {
    // End any active voice session when leaving the page.
    try { if (convRef.current.status !== "disconnected") convRef.current.endSession(); } catch { /* ignore */ }
  }, []);

  async function start() {
    setError("");
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia || typeof RTCPeerConnection === "undefined") {
      setError("This browser doesn't support live voice. Try the latest Chrome, Edge, Safari or Firefox, or use the manual interview.");
      setPhase("error");
      return;
    }
    setPhase("connecting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
    } catch {
      setError("Microphone access was denied. Allow microphone access in your browser settings, then try again.");
      setPhase("error");
      return;
    }
    try {
      const { token, userId } = await requestVoiceToken();
      userEnded.current = false;
      transcriptRef.current = [];
      setTranscript([]);
      logLiveDiagnostic("session-start-requested", { connectionType: "webrtc" });
      // startSession is asynchronous. Await it so SDK startup failures are
      // caught here instead of becoming unhandled promise rejections.
      await conversation.startSession({
        conversationToken: token,
        connectionType: "webrtc",
        userId,
        overrides: {
          // Free ElevenLabs plans may not permit first-message overrides.
          // Use the agent dashboard greeting; keep only enabled prompt/language overrides.
          agent: { prompt: { prompt: buildInterviewPrompt(job) }, language: "en" },
        },
      });
      logLiveDiagnostic("session-start-resolved", { status: conversation.status });
      setPhase("live");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't start the live interview.");
      setPhase("error");
    }
  }

  function end() {
    userEnded.current = true;
    try { conversation.endSession(); } catch { /* already closed */ }
    setPhase("finished");
  }

  function sendTyped() {
    const text = typed.trim();
    if (!text || conversation.status !== "connected") return;
    conversation.sendUserMessage(text);
    const next = appendTranscript(transcriptRef.current, { role: "candidate", text });
    transcriptRef.current = next;
    setTranscript(next);
    setTyped("");
  }

  const connected = conversation.status === "connected";
  const label =
    phase === "error" ? "Error"
    : phase === "finished" ? "Finished"
    : phase === "connecting" || (phase === "live" && conversation.status === "connecting") ? "Connecting"
    : phase === "live" && connected ? (muted ? "Muted" : conversation.isSpeaking ? "Recruiter speaking" : "Listening")
    : "Ready";
  const enough = hasEnoughTranscript(transcript);

  return (
    <div className="mt-6 space-y-4">
      <div className="rounded-lg border bg-card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold" role="status" aria-live="polite">{label}</span>
          {(phase === "ready" || phase === "error") && (
            <button type="button" onClick={start} className="h-10 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground">
              {phase === "error" ? "Try again" : "Start live interview"}
            </button>
          )}
          {phase === "live" && (
            <>
              <button type="button" onClick={() => setMuted((m) => !m)} disabled={!connected} aria-pressed={muted}
                className="h-10 rounded-md border px-4 text-sm font-semibold disabled:opacity-50">
                {muted ? "Unmute microphone" : "Mute microphone"}
              </button>
              <button type="button" onClick={end} className="h-10 rounded-md bg-destructive px-4 text-sm font-semibold text-destructive-foreground">
                End interview
              </button>
            </>
          )}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          This is an AI voice practice interview, not a real employer. Your speech is processed by ElevenLabs to run the conversation; this app does not store audio recordings. Only the job details (not your resume) are shared with the voice service.
        </p>
        {error && <p role="alert" className="mt-3 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      </div>

      {transcript.length > 0 && (
        <div className="space-y-3">
          {transcript.map((m, i) => (
            <div key={i} className={m.role === "candidate" ? "ml-auto max-w-[85%] rounded-lg bg-ink px-4 py-3 text-ink-foreground" : "max-w-[85%] rounded-lg border bg-card px-4 py-3"}>
              <p className="mb-1 text-xs font-semibold opacity-70">{m.role === "candidate" ? "You" : "AI interviewer"}</p>
              <p className="whitespace-pre-wrap text-sm">{m.text}</p>
            </div>
          ))}
        </div>
      )}

      {!voiceOnly && phase === "live" && connected && (
        <div className="rounded-lg border bg-card p-3">
          <label htmlFor="live-typed" className="text-xs font-medium text-muted-foreground">Prefer to type? Send an answer as text</label>
          <div className="mt-1 flex gap-2">
            <input id="live-typed" value={typed} onChange={(e) => setTyped(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") sendTyped(); }}
              className="h-10 flex-1 rounded-md border bg-transparent px-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
            <button type="button" onClick={sendTyped} disabled={!typed.trim()} className="h-10 rounded-md border px-4 text-sm font-semibold disabled:opacity-50">Send</button>
          </div>
        </div>
      )}

      {phase === "finished" && (
        <div className="rounded-lg border bg-card p-4">
          {enough ? (
            <button type="button" onClick={() => onFinish(transcriptRef.current)} disabled={scoring}
              className="h-11 w-full rounded-md bg-primary font-semibold text-primary-foreground disabled:opacity-60">
              {scoring ? "Scoring your interview…" : "Get my feedback"}
            </button>
          ) : (
            <div className="space-y-3 text-sm">
              <p>{voiceOnly ? "There is not enough conversation to score yet — we need at least two spoken answers. Retry the live interview to continue." : "There is not enough conversation to score yet — we need at least two spoken answers. You can retry or continue in manual mode."}</p>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setPhase("ready")} className="h-10 rounded-md bg-primary px-4 font-semibold text-primary-foreground">Retry live interview</button>
                {!voiceOnly && <button type="button" onClick={onSwitchToManual} className="h-10 rounded-md border px-4 font-semibold">Use manual mode</button>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
