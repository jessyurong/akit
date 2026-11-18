import type { IconName } from "../../components/icons";

/**
 * Track list. The first entry is the default soundtrack and always loops.
 * To use your own music, drop the files into `public/audio/` and update the
 * values below — everything else (crossfade, lock-screen controls, volume,
 * visuals) keeps working as-is.
 *
 * Keep each file small (< 2 MB) so the service worker can cache it for
 * offline listening.
 */
export interface Track {
  id: string;
  title: string;
  artist: string;
  src: string;
  mood: string;
  /** CSS gradient for the artwork */
  gradient: [string, string];
  bpm: number;
  icon: IconName;
}

export const DEFAULT_TRACK_ID = "island";

export const TRACKS: Track[] = [
  {
    id: "island",
    title: "Island Song (Come Along with Me)",
    artist: "Ashley Eriksson",
    src: "/audio/island-song.mp3",
    mood: "Comfort",
    gradient: ["#fbbf24", "#38bdf8"],
    bpm: 88,
    icon: "island",
  },
  {
    id: "calm",
    title: "Soft Horizon",
    artist: "Serotonin Studio",
    src: "/audio/calm.wav",
    mood: "Calm",
    gradient: ["#38bdf8", "#a855f7"],
    bpm: 60,
    icon: "waves",
  },
  {
    id: "focus",
    title: "Quiet Engine",
    artist: "Serotonin Studio",
    src: "/audio/focus.wav",
    mood: "Focus",
    gradient: ["#22c55e", "#0ea5e9"],
    bpm: 76,
    icon: "leaf",
  },
  {
    id: "sleep",
    title: "Moon Drift",
    artist: "Serotonin Studio",
    src: "/audio/sleep.wav",
    mood: "Sleep",
    gradient: ["#6366f1", "#db2777"],
    bpm: 48,
    icon: "moon",
  },
  {
    id: "playful",
    title: "Bubble Bounce",
    artist: "Serotonin Studio",
    src: "/audio/playful.wav",
    mood: "Playful",
    gradient: ["#f59e0b", "#ec4899"],
    bpm: 104,
    icon: "bubble",
  },
];

export function getTrack(id: string): Track {
  return TRACKS.find((t) => t.id === id) ?? TRACKS[0];
}

export function trackIndex(id: string): number {
  const i = TRACKS.findIndex((t) => t.id === id);
  return i < 0 ? 0 : i;
}
