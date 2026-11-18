import type { IconName } from "../components/icons";

export type ThemeName = "auto" | "dawn" | "day" | "dusk" | "night";
export type ResolvedTheme = Exclude<ThemeName, "auto">;

export const THEME_COLORS: Record<ResolvedTheme, string> = {
  dawn: "#fff6ef",
  day: "#f3f5ff",
  dusk: "#241a3d",
  night: "#0a0e1a",
};

export const THEME_LABELS: Record<ThemeName, string> = {
  auto: "Auto",
  dawn: "Dawn",
  day: "Day",
  dusk: "Dusk",
  night: "Night",
};

export const THEME_ICON: Record<ThemeName, IconName> = {
  auto: "theme",
  dawn: "sunrise",
  day: "sun",
  dusk: "sunset",
  night: "moon",
};

export function resolveTheme(theme: ThemeName, now = new Date()): ResolvedTheme {
  if (theme !== "auto") return theme;
  const h = now.getHours();
  if (h < 6) return "night";
  if (h < 11) return "dawn";
  if (h < 17) return "day";
  if (h < 20) return "dusk";
  return "night";
}
