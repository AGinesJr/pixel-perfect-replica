import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { jobs } from "@/lib/data";
import { useProgress } from "@/lib/progress";
import { interviewTurn, interviewFeedback } from "@/lib/ai.functions";
import { jobPayload } from "@/lib/job-payload";
import { ScoreBar } from "./applications.$id";

export const Route = createFileRoute("/interview/$id")({
  head: () => ({
    meta: [
      { title: "AI interview — Workforce Prep" },
      { name: "description", content: "Practice a realistic interview with an AI hiring manager." },
      { property: "og:title", content: "AI interview — Workforce Prep" },
      { property: "og:description", content: "Practice a realistic interview with an AI hiring manager." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Interview,
});

type Msg = { role: "interviewer" | "candidate"; text: string };

type RecognitionResultLike = { 0: { transcript: string }; isFinal: boolean };
type RecognitionEventLike = { results: ArrayLike<RecognitionResultLike> };
type RecognitionErrorLike = { error: string };
type RecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: RecognitionEventLike) => void) | null;
  onerror: ((event: RecognitionErrorLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};
type SpeechWindow = Window & {
  SpeechRecognition?: new () => RecognitionLike;
  webkitSpeechRecognition?: new () => RecognitionLike;
};

function Interview() {
  const { id } = Route.useParams();
  const { state, update, ready } = useProgress();
  const app = state.applications.find((a) => a.id === id);
  const job = app && jobs.find((j) => j.id === app.jobId);
  const [history, setHistory] = useState<Msg[]>([]);
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  const [voiceError, setVoiceError] = useState("");
  const [listening, setListening] = useState(false);
  const [voiceOutput, setVoiceOutput] = useState(true);
  const [speechOutputSupported, setSpeechOutputSupported] = useState(false);
  const turn = useServerFn(interviewTurn);
  const feedback = useServerFn(interviewFeedback);
  const started = useRef(false);
  const end = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<RecognitionLike | null>(null);

  async function next(h: Msg[]) {
    if (!job || !app) return;
    setBusy(true); setErr("");
    try {
      const r = await turn({ data: { job: jobPayload(job), resume: app.resume, history: h } });
      setHistory([...h, { role: "interviewer", text: r.question }]);
      if (r.done) setDone(true);
    } catch (e) { setErr(e instanceof Error ? e.message : "Error"); }
    finally { setBusy(false); }
  }

  useEffect(() => {
    if (ready && app && !app.interview && !started.current) { started.current = true; next([]); }
  }, [ready, app]); // eslint-disable-line
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [history, busy]);

  useEffect(() => {
    setSpeechOutputSupported(typeof window !== "undefined" && "speechSynthesis" in window);
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
      recognitionRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!voiceOutput || !speechOutputSupported || !history.length || typeof window === "undefined") return;
    const latest = history[history.length - 1];
    if (latest.role !== "interviewer") return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(latest.text);
    utterance.lang = "en-US";
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
    return () => window.speechSynthesis.cancel();
  }, [history, voiceOutput, speechOutputSupported]);

  function startListening() {
    if (typeof window === "undefined") return;
    const speechWindow = window as SpeechWindow;
    const Recognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!Recognition) {
      setVoiceError("Speech recognition is not supported in this browser. Try the latest Chrome or Microsoft Edge, or type your answer below.");
      return;
    }
    setVoiceError("");
    setErr("");
    const recognition = new Recognition();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      const words: string[] = [];
      for (let i = 0; i < event.results.length; i += 1) {
        const transcript = event.results[i]?.[0]?.transcript;
        if (transcript) words.push(transcript);
      }
      setAnswer(words.join(" ").trim());
    };
    recognition.onerror = (event) => {
      const message = event.error === "not-allowed"
        ? "Microphone permission was denied. Allow microphone access in your browser settings, then try again."
        : event.error === "no-speech"
          ? "No speech was detected. Try again and speak clearly."
          : `Voice recognition stopped (${event.error}). You can retry or type your answer.`;
      setVoiceError(message);
      setListening(false);
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    try {
      recognition.start();
      setListening(true);
    } catch {
      setVoiceError("The microphone could not start. Please try again or type your answer.");
      setListening(false);
    }
  }

  function stopListening() {
    recognitionRef.current?.stop();
    setListening(false);
  }

  function submitAnswer() {
    if (!answer.trim() || busy) return;
    if (listening) stopListening();
    const h: Msg[] = [...history, { role: "candidate", text: answer.trim() }];
    setHistory(h);
    setAnswer("");
    setVoiceError("");
    next(h);
  }

  async function finish() {
    if (!job || !app) return;
    setBusy(true); setErr("");
    try {
      const r = await feedback({ data: { job: jobPayload(job), history } });
      update((s) => ({ ...s, applications: s.applications.map((a) => (a.id === id ? { ...a, interview: r } : a)) }));
    } catch (e) { setErr(e instanceof Error ? e.message : "Error"); }
    finally { setBusy(false); }
  }

  if (!ready) return <div className="p-10 text-center text-muted-foreground">Loading…</div>;
  if (!app || !job) return <div className="p-10 text-center">Interview not found. <Link to="/dashboard" className="text-primary">Dashboard</Link></div>;

  if (app.interview) {
    const r = app.interview;
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <p className="text-sm text-muted-foreground">Interview feedback</p>
        <h1 className="text-3xl font-bold">{job.title} · {job.employer}</h1>
        <div className="mt-6 rounded-lg bg-hero p-6 text-ink-foreground">
          <p className="font-display text-5xl font-bold">{r.overall}<span className="text-xl">/100</span></p>
          <p className="mt-2 text-ink-foreground/85">{r.summary}</p>
        </div>
        <div className="mt-6 space-y-3">
          {r.scores.map((s) => (
            <div key={s.name} className="rounded-lg border bg-card p-4">
              <div className="flex justify-between text-sm font-semibold"><span>{s.name}</span><span>{s.score}</span></div>
              <div className="mt-2"><ScoreBar score={s.score} /></div>
              <p className="mt-2 text-sm text-muted-foreground">{s.evidence}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 rounded-lg border bg-card p-5">
          <h2 className="font-semibold">Your practice plan</h2>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">{r.improvements.map((i) => <li key={i}>{i}</li>)}</ol>
        </div>
        <Link to="/jobs" className="mt-6 inline-block font-semibold text-primary">Apply to another role →</Link>
      </div>
    );
  }

  const latestQuestion = [...history].reverse().find((message) => message.role === "interviewer");

  return (
    <div className="mx-auto flex max-w-3xl flex-col px-4 py-8">
      <h1 className="text-2xl font-bold">Interview: {job.title}</h1>
      <p className="text-sm text-muted-foreground">Hiring manager, {job.employer} · about 5 questions · practice simulation</p>

      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border bg-card p-3">
        <span className="text-sm font-medium">Voice interview</span>
        <button
          type="button"
          onClick={() => setVoiceOutput((enabled) => !enabled)}
          className="h-9 rounded-md border px-3 text-sm font-medium"
          aria-pressed={voiceOutput}
        >
          {voiceOutput ? "Turn voice off" : "Read questions aloud"}
        </button>
        <span className="text-xs text-muted-foreground">
          {speechOutputSupported ? "Spoken questions enabled" : "Spoken questions may not be available in this browser"}
        </span>
      </div>

      <div className="mt-6 space-y-4">
        {history.map((m, i) => (
          <div key={i} className={m.role === "candidate" ? "ml-auto max-w-[85%] rounded-lg bg-ink px-4 py-3 text-ink-foreground" : "max-w-[85%] rounded-lg border bg-card px-4 py-3"}>
            <p className="mb-1 text-xs font-semibold opacity-70">{m.role === "candidate" ? "You" : "Hiring manager"}</p>
            <p className="whitespace-pre-wrap text-sm">{m.text}</p>
            {m.role === "interviewer" && speechOutputSupported && (
              <button
                type="button"
                onClick={() => {
                  window.speechSynthesis.cancel();
                  const utterance = new SpeechSynthesisUtterance(m.text);
                  utterance.lang = "en-US";
                  window.speechSynthesis.speak(utterance);
                }}
                className="mt-2 text-xs font-semibold text-primary underline"
              >
                Play question again
              </button>
            )}
          </div>
        ))}
        {busy && <p className="text-sm text-muted-foreground">Thinking…</p>}
        {err && <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{err}</p>}
        <div ref={end} />
      </div>

      {done ? (
        <button onClick={finish} disabled={busy} className="mt-6 h-11 rounded-md bg-primary font-semibold text-primary-foreground disabled:opacity-60">{busy ? "Scoring your interview…" : "Get my feedback"}</button>
      ) : (
        <div className="sticky bottom-4 mt-6 rounded-lg border bg-card p-3 shadow-lg">
          <p className="mb-2 text-sm font-semibold">{listening ? "Listening — speak your answer" : "Answer out loud"}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={listening ? stopListening : startListening}
              disabled={busy || history.length === 0}
              className={`h-10 rounded-md px-4 text-sm font-semibold disabled:opacity-50 ${listening ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground"}`}
            >
              {listening ? "Stop microphone" : "Start microphone"}
            </button>
            <button
              type="button"
              onClick={submitAnswer}
              disabled={busy || !answer.trim() || history.length === 0}
              className="h-10 rounded-md border px-4 text-sm font-semibold disabled:opacity-50"
            >
              Send answer
            </button>
          </div>
          {voiceError && <p role="status" className="mt-2 text-sm text-destructive">{voiceError}</p>}
          <label htmlFor="interview-answer" className="mt-4 block text-xs font-medium text-muted-foreground">
            Transcript / optional typed answer
          </label>
          <textarea
            id="interview-answer"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={3}
            placeholder="Your spoken answer will appear here. You can also type instead."
            className="mt-1 w-full resize-y rounded-md border bg-transparent p-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            disabled={busy || history.length === 0}
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Microphone speech recognition may be processed by your browser provider. This prototype does not save an audio recording.
          </p>
          {latestQuestion && <p className="mt-2 text-xs text-muted-foreground">Tip: use Situation, Task, Action, Result (STAR) to structure your answer.</p>}
        </div>
      )}
    </div>
  );
}
