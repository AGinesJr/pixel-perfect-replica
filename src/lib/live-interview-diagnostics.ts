export type LiveStartupStage = "microphone" | "token" | "connection" | "idle";

function redactDiagnosticText(value: string): string {
  return value
    .replace(/\bBearer\s+\S+/gi, "Bearer [redacted]")
    .replace(/\b(access[_ -]?token|conversation[_ -]?token|api[_ -]?key|authorization|secret|password)\s*[:=]\s*[^\s,;]+/gi, "$1=[redacted]")
    .replace(/https?:\/\/\S+/gi, "[url redacted]");
}

function safeText(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  return redactDiagnosticText(value).slice(0, 300);
}

/** Extract only allowlisted fields; never log raw SDK objects or request headers. */
export function safeDiagnosticDetails(value: unknown): Record<string, string> {
  if (typeof value === "string") return { message: safeText(value) ?? "" };
  if (!value || typeof value !== "object") return { valueType: typeof value };
  const item = value as Record<string, unknown>;
  const details: Record<string, string> = {};
  for (const key of ["name", "message", "code", "status", "type", "reason", "state", "stage", "connectionType", "event", "event_type", "level", "severity", "timestamp", "conversationId", "conversation_id", "context", "error", "source"] as const) {
    const text = safeText(item[key]);
    if (text) details[key] = text;
  }
  const cause = item.cause;
  if (cause && typeof cause === "object") {
    const causeItem = cause as Record<string, unknown>;
    const causeName = safeText(causeItem.name);
    const causeMessage = safeText(causeItem.message);
    if (causeName) details.causeName = causeName;
    if (causeMessage) details.causeMessage = causeMessage;
  } else {
    const causeText = safeText(cause);
    if (causeText) details.cause = causeText;
  }
  if (!Object.keys(details).length) details.valueType = "object";
  return details;
}

export function logLiveDiagnostic(event: string, value?: unknown): void {
  console.info("[Workforce Prep live voice]", event, safeDiagnosticDetails(value));
}

export function formatLiveStartupError(error: unknown, stage: LiveStartupStage): string {
  const details = safeDiagnosticDetails(error);
  const name = details.name ?? "";
  const message = details.message ?? "";
  const combined = (name + " " + message).toLowerCase();

  if (stage === "microphone") {
    if (combined.includes("notallowederror") || combined.includes("permission denied") || combined.includes("not allowed")) {
      return "Microphone access was denied. Allow microphone access for this site in Chrome, then try again.";
    }
    if (combined.includes("notfounderror") || combined.includes("no device")) {
      return "No microphone was found. Connect or enable a microphone, then try again.";
    }
    return "Workforce Prep could not access your microphone. Check browser permissions and try again, or use manual practice.";
  }

  if (stage === "token") {
    if (message && !message.toLowerCase().includes("unknown error")) return message;
    return "The voice session token could not be retrieved. Check that you are signed in, then try again.";
  }

  if (stage === "connection") {
    return "The session token was received, but the live audio connection could not be established. Try Chrome or Edge, check your network or VPN settings, and retry. You can use manual practice meanwhile.";
  }

  if (message && !message.toLowerCase().includes("unknown error")) return message;
  return "The live voice interview encountered an unexpected error. Please retry or use manual practice.";
}
