import type { ProgressState } from "@/lib/progress";

const URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/$/, "");
const KEY = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY) as string | undefined;
const SESSION_KEY = "workforce-prep-auth-v1";

export type AuthUser = { id: string; email?: string };
export type AuthSession = {
  access_token: string;
  refresh_token: string;
  expires_at?: number | undefined;
  user: AuthUser;
};

type AuthResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  user?: AuthUser;
  message?: string;
  msg?: string;
  error_description?: string;
  error?: string;
};

type CloudProfileRow = { display_name: string; resume_text: string };
type CloudPracticeRow = { saved_jobs: string[]; applications: ProgressState["applications"] };

export const isSupabaseConfigured = Boolean(URL && KEY && URL.startsWith("https://"));

function config() {
  if (!URL || !KEY || !URL.startsWith("https://")) {
    throw new Error("Supabase is not configured. Add VITE_SUPABASE_URL and either VITE_SUPABASE_PUBLISHABLE_KEY or VITE_SUPABASE_ANON_KEY to the app's hosting environment, then rebuild it.");
  }
  return { url: URL, key: KEY };
}

function emitAuthChange() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event("wp-auth"));
}

export function getStoredSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as AuthSession;
    if (!session.access_token || !session.refresh_token || !session.user?.id) return null;
    return session;
  } catch {
    return null;
  }
}

function storeSession(session: AuthSession | null) {
  if (typeof window === "undefined") return;
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else localStorage.removeItem(SESSION_KEY);
  emitAuthChange();
}

async function authRequest(path: string, body?: unknown): Promise<AuthResponse> {
  const { url, key } = config();
  const response = await fetch(`${url}/auth/v1/${path}`, {
    method: "POST",
    headers: { apikey: key, "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  const data = (await response.json().catch(() => ({}))) as AuthResponse;
  if (!response.ok) {
    throw new Error(data.message || data.msg || data.error_description || data.error || "Authentication failed. Please try again.");
  }
  return data;
}

function toSession(data: AuthResponse): AuthSession {
  if (!data.access_token || !data.refresh_token || !data.user?.id) {
    throw new Error("Your account was created, but no session was returned. Check your email for a confirmation link, then sign in.");
  }
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_in ? Math.floor(Date.now() / 1000) + data.expires_in : undefined,
    user: data.user,
  };
}

export async function signIn(email: string, password: string) {
  const data = await authRequest("token?grant_type=password", { email, password });
  const session = toSession(data);
  storeSession(session);
  return session;
}

export async function signUp(email: string, password: string) {
  const data = await authRequest("signup", { email, password });
  if (data.access_token && data.refresh_token && data.user?.id) {
    const session = toSession(data);
    storeSession(session);
    return { session, confirmationRequired: false };
  }
  return { session: null, confirmationRequired: true };
}

export async function signOut() {
  const session = getStoredSession();
  try {
    if (session && URL && KEY) {
      await fetch(`${URL}/auth/v1/logout`, {
        method: "POST",
        headers: { apikey: KEY, Authorization: `Bearer ${session.access_token}` },
      });
    }
  } finally {
    storeSession(null);
  }
}

export async function getValidSession(): Promise<AuthSession | null> {
  const session = getStoredSession();
  if (!session) return null;
  if (!session.expires_at || session.expires_at > Math.floor(Date.now() / 1000) + 60) return session;

  try {
    const data = await authRequest("token?grant_type=refresh_token", { refresh_token: session.refresh_token });
    const refreshed = toSession(data);
    storeSession(refreshed);
    return refreshed;
  } catch {
    storeSession(null);
    return null;
  }
}

/**
 * Merge cloud records independently. If either cloud row is absent, retain
 * that section from local storage so a partial cloud account cannot erase it.
 */
export function reconcileCloudProgress(
  local: ProgressState,
  profiles: CloudProfileRow[],
  rows: CloudPracticeRow[],
): { progress: ProgressState; needsRepair: boolean } | null {
  if (!profiles.length && !rows.length) return null;

  const profile = profiles[0];
  const practice = rows[0];
  return {
    progress: {
      name: profile ? profile.display_name : local.name,
      resume: profile ? profile.resume_text : local.resume,
      saved: practice ? practice.saved_jobs : local.saved,
      applications: practice ? practice.applications : local.applications,
    },
    needsRepair: !profile || !practice,
  };
}

async function restRequest<T>(
  table: "profiles" | "practice_data",
  session: AuthSession,
  method: "GET" | "POST",
  body?: Record<string, unknown>,
): Promise<T> {
  const { url, key } = config();
  const query = method === "GET" ? `?user_id=eq.${encodeURIComponent(session.user.id)}&select=*` : "?on_conflict=user_id";
  const response = await fetch(`${url}/rest/v1/${table}${query}`, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
      Prefer: method === "POST" ? "resolution=merge-duplicates,return=minimal" : "return=representation",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { message?: string; details?: string };
    throw new Error(data.message || data.details || `Supabase could not access ${table}.`);
  }
  if (response.status === 204) return [] as T;
  return (await response.json().catch(() => [])) as T;
}

export async function loadCloudProgress(
  localFallback: ProgressState,
): Promise<{ progress: ProgressState; needsRepair: boolean } | null> {
  const session = await getValidSession();
  if (!session) return null;
  const [profiles, rows] = await Promise.all([
    restRequest<CloudProfileRow[]>("profiles", session, "GET"),
    restRequest<CloudPracticeRow[]>("practice_data", session, "GET"),
  ]);
  return reconcileCloudProgress(localFallback, profiles, rows);
}

export async function saveCloudProgress(progress: ProgressState): Promise<void> {
  const session = await getValidSession();
  if (!session) return;
  await Promise.all([
    restRequest("profiles", session, "POST", {
      user_id: session.user.id,
      display_name: progress.name.slice(0, 160),
      resume_text: progress.resume.slice(0, 15000),
    }),
    restRequest("practice_data", session, "POST", {
      user_id: session.user.id,
      saved_jobs: progress.saved,
      applications: progress.applications,
    }),
  ]);
}
