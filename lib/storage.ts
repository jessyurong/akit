const KEY = "sr:v1";

export function loadState<T>(fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return merge(fallback as unknown, parsed) as T;
  } catch {
    return fallback;
  }
}

export function saveState(value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    /* storage full or blocked — the app still works, it just forgets */
  }
}

/** Shallow-ish merge that keeps unknown saved keys and fills in new defaults. */
function merge<T>(base: T, patch: unknown): T {
  if (Array.isArray(base) || Array.isArray(patch)) return (patch ?? base) as T;
  if (typeof base !== "object" || base === null || typeof patch !== "object" || patch === null) {
    return (patch === undefined ? base : patch) as T;
  }
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [k, v] of Object.entries(patch as Record<string, unknown>)) {
    const current = out[k];
    out[k] =
      typeof current === "object" && current !== null && !Array.isArray(current)
        ? merge(current, v)
        : v;
  }
  return out as T;
}

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}
