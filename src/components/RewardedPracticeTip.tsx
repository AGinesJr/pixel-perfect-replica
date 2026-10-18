import { useEffect, useState } from "react";
import { Award, PlayCircle, Sparkles } from "lucide-react";
import { isDespiaRuntime, showDespiaRewardedAd } from "@/lib/despia-ads";

declare global {
  interface Window {
    updateRewardedStatus?: (status: string) => void;
  }
}

const DAILY_LIMIT = 5;
const STORAGE_KEY = "workforce-prep-rewarded-tips-v1";
const TIPS = [
  "Use the STAR method: briefly set the Situation, explain your Task, describe your Actions, and finish with a measurable Result.",
  "Make your example specific. Include what you personally did, the tools you used, and how you knew the result worked.",
  "When asked about a weakness, choose a real skill you are actively improving and explain the concrete steps you are taking.",
  "For behavioral questions, prepare one example of solving a problem, one of collaborating, and one of adapting to change.",
  "Close your answer by connecting the example to the role's needs instead of simply repeating the question.",
];

type RewardState = { date: string; count: number; tipIndex: number };

function localDateKey() {
  const date = new Date();
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function readRewardState(): RewardState {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") as RewardState | null;
    if (parsed?.date === localDateKey()) {
      return {
        date: parsed.date,
        count: Math.max(0, Math.min(DAILY_LIMIT, Number(parsed.count) || 0)),
        tipIndex: Number.isInteger(parsed.tipIndex) ? parsed.tipIndex : -1,
      };
    }
  } catch {
    // Treat invalid local state as a fresh day.
  }
  return { date: localDateKey(), count: 0, tipIndex: -1 };
}

export function RewardedPracticeTip() {
  const [isNativeApp, setIsNativeApp] = useState(false);
  const [reward, setReward] = useState<RewardState>({ date: "", count: 0, tipIndex: -1 });
  const [isRequesting, setIsRequesting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const native = isDespiaRuntime();
    setIsNativeApp(native);
    if (!native) return;

    setReward(readRewardState());
    window.updateRewardedStatus = (status: string) => {
      if (!isDespiaRuntime() || status !== "true") {
        setIsRequesting(false);
        setMessage("No reward was added. The ad must finish to unlock a tip.");
        return;
      }

      const current = readRewardState();
      if (current.count >= DAILY_LIMIT) {
        setReward(current);
        setIsRequesting(false);
        setMessage("You've reached today's rewarded-ad limit.");
        return;
      }

      const next: RewardState = {
        date: localDateKey(),
        count: current.count + 1,
        tipIndex: current.count % TIPS.length,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setReward(next);
      setIsRequesting(false);
      setMessage("Tip unlocked. Keep it handy for your next practice interview.");
    };

    return () => {
      delete window.updateRewardedStatus;
    };
  }, []);

  const watchAd = async () => {
    if (!isNativeApp || isRequesting || reward.count >= DAILY_LIMIT) return;
    setIsRequesting(true);
    setMessage("");
    try {
      await showDespiaRewardedAd();
      setMessage("Your ad is starting. Finish it to unlock the tip.");
    } catch {
      setIsRequesting(false);
      setMessage("The ad couldn't be started. Please try again later.");
    }
  };

  if (!isNativeApp) return null;

  return (
    <section aria-labelledby="rewarded-tip-heading" className="mt-8 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <Sparkles className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Optional reward</p>
          <h2 id="rewarded-tip-heading" className="mt-1 text-lg font-bold">Unlock a bonus interview tip</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Choose to watch a short ad to reveal an extra practical interview tip. Skipping or closing the ad does not unlock a reward.
          </p>
        </div>
      </div>

      {reward.tipIndex >= 0 && (
        <div className="mt-4 flex gap-3 rounded-xl border border-success/30 bg-success/5 p-4">
          <Award className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold">Your bonus tip</p>
            <p className="mt-1 text-sm leading-6 text-foreground">{TIPS[reward.tipIndex]}</p>
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">{Math.max(0, DAILY_LIMIT - reward.count)} rewarded ads remaining today</p>
        <button
          type="button"
          onClick={() => void watchAd()}
          disabled={isRequesting || reward.count >= DAILY_LIMIT}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <PlayCircle className="h-4 w-4" aria-hidden="true" />
          {isRequesting ? "Starting ad…" : reward.count >= DAILY_LIMIT ? "Daily limit reached" : "Watch ad for a tip"}
        </button>
      </div>
      {message && <p role="status" className="mt-3 text-sm text-muted-foreground">{message}</p>}
    </section>
  );
}
