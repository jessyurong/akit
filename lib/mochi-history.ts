/**
 * Mochi's short-term memory — the last few exchanges, kept on this device.
 *
 * Gemini is stateless, so the recent conversation has to travel with each voice
 * note. This is deliberately a small rolling window: it keeps her replies
 * grounded without inflating every request or keeping old feelings forever.
 */

export const MAX_EXCHANGES = 8;

const KEY = "sr:mochi-history-v1";
export const MAX_EXCHANGE_CHARS = 300;
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export type Exchange = {
  /** What Gemini believes it heard from the user (may be empty). */
  heard: string;
  /** What Mochi answered. */
  reply: string;
  at: number;
};

function clean(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, MAX_EXCHANGE_CHARS);
}

export function loadHistory(): Exchange[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(KEY) ?? "[]") as unknown;
    if (!Array.isArray(parsed)) return [];
    const now = Date.now();
    return parsed
      .filter((item): item is Exchange => {
        if (!item || typeof item !== "object") return false;
        const e = item as Record<string, unknown>;
        return (
          typeof e.heard === "string" &&
          typeof e.reply === "string" &&
          typeof e.at === "number" &&
          Number.isFinite(e.at) &&
          e.at <= now &&
          now - e.at < MAX_AGE_MS
        );
      })
      .slice(-MAX_EXCHANGES)
      .map((e) => ({ heard: clean(e.heard), reply: clean(e.reply), at: e.at }));
  } catch {
    return [];
  }
}

export function appendExchange(heard: string, reply: string) {
  const answer = clean(reply);
  if (!answer) return;
  const next: Exchange[] = [
    ...loadHistory(),
    { heard: clean(heard), reply: answer, at: Date.now() },
  ].slice(-MAX_EXCHANGES);
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage full or blocked — memory just doesn't persist */
  }
}

export function clearHistory() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* nothing to do */
  }
}
