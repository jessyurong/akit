import type { IconName } from "../components/icons";

export type ThemeName = "auto" | "matcha" | "midnight" | "sakura";
export type ResolvedTheme = Exclude<ThemeName, "auto">;

export const THEME_COLORS: Record<ResolvedTheme, string> = {
  matcha: "#f5f2e6",
  midnight: "#0d1020",
  sakura: "#fff1f0",
};

export const THEME_LABELS: Record<ThemeName, string> = {
  auto: "Auto",
  matcha: "Matcha & Cream",
  midnight: "Midnight Lofi",
  sakura: "Sakura Sunset",
};

export const THEME_ICON: Record<ThemeName, IconName> = {
  auto: "theme",
  matcha: "leaf",
  midnight: "moon",
  sakura: "sunset",
};

/** Theme options in menu order. */
export const THEME_ORDER: ThemeName[] = ["auto", "matcha", "midnight", "sakura"];

/**
 * Auto follows the rhythm of the day: sleepy nights, earthy mornings,
 * and a warm sakura glow around golden hour.
 */
export function resolveTheme(theme: ThemeName, now = new Date()): ResolvedTheme {
  if (theme !== "auto") return theme;
  const h = now.getHours();
  if (h < 6) return "midnight";
  if (h < 17) return "matcha";
  if (h < 20) return "sakura";
  return "midnight";
}

/** Maps theme names saved by older versions of the app onto the new palettes. */
export function normalizeTheme(value: unknown): ThemeName {
  if (value === "auto" || value === "matcha" || value === "midnight" || value === "sakura") {
    return value;
  }
  if (value === "night" || value === "dusk") return "midnight";
  if (value === "dawn" || value === "day") return "matcha";
  return "auto";
}
