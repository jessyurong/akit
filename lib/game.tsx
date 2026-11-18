"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { audio } from "./audio/engine";
import { haptics } from "./audio/sfx";
import { ambient } from "./audio/ambient";
import { loadState, saveState, clamp } from "./storage";
import { DEFAULT_TRACK_ID } from "./music/tracks";
import type { IconName } from "../components/icons";
import {
  resolveTheme,
  THEME_COLORS,
  type ResolvedTheme,
  type ThemeName,
} from "./theme";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type ToyId =
  | "bubbles"
  | "popit"
  | "balloons"
  | "squishy"
  | "spinner"
  | "frog"
  | "dice"
  | "sparkles"
  | "breathing"
  | "ambient"
  | "canvas"
  | "synth"
  | "drums"
  | "koi"
  | "rocks"
  | "mochi";

export interface Settings {
  soundOn: boolean;
  musicOn: boolean;
  hapticsOn: boolean;
  theme: ThemeName;
  musicVolume: number;
  sfxVolume: number;
  ambientVolume: number;
  trackId: string;
}

export interface Stats {
  score: number;
  plays: Record<string, number>;
  breaths: number;
  doodles: number;
  visits: number;
  lastVisit: string;
}

export interface Toast {
  id: number;
  icon: IconName;
  text: string;
}

export type Mood = "sleepy" | "chill" | "happy" | "blissful";

interface GameContextValue {
  settings: Settings;
  stats: Stats;
  message: string;
  say: (text: string) => void;
  toasts: Toast[];
  pushToast: (text: string, icon?: IconName) => void;
  addScore: (points: number, toy?: ToyId) => void;
  bump: (key: "breaths" | "doodles") => void;
  updateSettings: (patch: Partial<Settings>) => void;
  happiness: number;
  mood: Mood;
  moodLabel: string;
  calm: boolean;
  setCalm: (value: boolean) => void;
  shareOpen: boolean;
  setShareOpen: (value: boolean) => void;
  resetToken: number;
  resetAll: () => void;
  resolvedTheme: ResolvedTheme;
  hydrated: boolean;
}

/* ------------------------------------------------------------------ */
/* Defaults                                                            */
/* ------------------------------------------------------------------ */

const DEFAULT_SETTINGS: Settings = {
  soundOn: true,
  musicOn: false,
  hapticsOn: true,
  theme: "auto",
  musicVolume: 0.55,
  sfxVolume: 0.9,
  ambientVolume: 0.85,
  trackId: DEFAULT_TRACK_ID,
};

const DEFAULT_STATS: Stats = {
  score: 0,
  plays: {},
  breaths: 0,
  doodles: 0,
  visits: 0,
  lastVisit: "",
};

const WELCOME = "Click anything. Your brain deserves a playful break.";

const GameContext = createContext<GameContextValue | null>(null);

/* ------------------------------------------------------------------ */
/* Provider                                                            */
/* ------------------------------------------------------------------ */

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [stats, setStats] = useState<Stats>(DEFAULT_STATS);
  const [message, setMessage] = useState(WELCOME);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [calm, setCalm] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("night");
  const [resetToken, setResetToken] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const toastId = useRef(0);

  /* --- hydrate once from localStorage (avoids SSR mismatch) --- */
  useEffect(() => {
    const saved = loadState({ settings: DEFAULT_SETTINGS, stats: DEFAULT_STATS });
    setSettings(saved.settings);
    setStats({
      ...saved.stats,
      visits: (saved.stats.visits || 0) + 1,
      lastVisit: new Date().toISOString(),
    });
    setHydrated(true);
    audio.arm();
  }, []);

  /* --- persist --- */
  useEffect(() => {
    if (!hydrated) return;
    saveState({ settings, stats });
  }, [settings, stats, hydrated]);

  /* --- theme --- */
  useEffect(() => {
    const apply = () => {
      const next = resolveTheme(settings.theme);
      setResolvedTheme(next);
      document.documentElement.dataset.theme = next;
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute("content", THEME_COLORS[next]);
    };
    apply();
    const id = window.setInterval(apply, 5 * 60 * 1000);
    return () => window.clearInterval(id);
  }, [settings.theme]);

  /* --- audio settings --- */
  useEffect(() => {
    audio.setEnabled(settings.soundOn);
    audio.setBusVolume("sfx", settings.sfxVolume);
    audio.setBusVolume("ambient", settings.ambientVolume);
  }, [settings.soundOn, settings.sfxVolume, settings.ambientVolume]);

  useEffect(() => {
    haptics.enabled = settings.hapticsOn;
  }, [settings.hapticsOn]);

  /* --- actions --- */
  const say = useCallback((text: string) => setMessage(text), []);

  const pushToast = useCallback((text: string, icon: IconName = "sparkle") => {
    const id = ++toastId.current;
    setToasts((prev) => [...prev.slice(-2), { id, icon, text }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2600);
  }, []);

  const addScore = useCallback((points: number, toy?: ToyId) => {
    setStats((prev) => {
      const plays = toy ? { ...prev.plays, [toy]: (prev.plays[toy] || 0) + 1 } : prev.plays;
      return { ...prev, score: prev.score + points, plays };
    });
  }, []);

  const bump = useCallback((key: "breaths" | "doodles") => {
    setStats((prev) => ({ ...prev, [key]: prev[key] + 1 }));
  }, []);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const resetAll = useCallback(() => {
    setStats((prev) => ({ ...DEFAULT_STATS, visits: prev.visits, lastVisit: prev.lastVisit }));
    ambient.stopAll();
    setCalm(false);
    setResetToken((n) => n + 1);
    setMessage("Fresh start! Everything reset to peaceful harmony.");
  }, []);

  const happiness = useMemo(
    () =>
      Math.round(
        clamp(
          55 + Math.sqrt(stats.score) * 2.4 + Math.min(20, stats.breaths * 2) + Math.min(10, stats.doodles),
          0,
          100,
        ),
      ),
    [stats.score, stats.breaths, stats.doodles],
  );

  const mood: Mood = happiness >= 80 ? "blissful" : happiness >= 55 ? "happy" : happiness >= 32 ? "chill" : "sleepy";

  const moodLabel =
    mood === "blissful" ? "Blissful" : mood === "happy" ? "Happy" : mood === "chill" ? "Chill" : "Sleepy";

  const value: GameContextValue = {
    settings,
    stats,
    message,
    say,
    toasts,
    pushToast,
    addScore,
    bump,
    updateSettings,
    happiness,
    mood,
    moodLabel,
    calm,
    setCalm,
    shareOpen,
    setShareOpen,
    resetToken,
    resetAll,
    resolvedTheme,
    hydrated,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used inside <GameProvider>");
  return ctx;
}
