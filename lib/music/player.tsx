"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useGame } from "../game";
import { TRACKS, DEFAULT_TRACK_ID, getTrack, trackIndex, type Track } from "./tracks";

interface MusicContextValue {
  playing: boolean;
  track: Track;
  progress: number;
  duration: number;
  error: string | null;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  select: (id: string) => void;
  seek: (ratio: number) => void;
  volume: number;
  setVolume: (v: number) => void;
}

const MusicContext = createContext<MusicContextValue | null>(null);

/**
 * Two <audio> elements so tracks can crossfade into each other.
 *
 * Using media elements (not Web Audio) is deliberate: iOS suspends Web Audio
 * in the background, while <audio> + Media Session keeps playing on the lock
 * screen. Trade-off: no real analyser node, so the equalizer and Mochi's
 * dancing are driven by each track's BPM instead.
 */
export function MusicProvider({ children }: { children: React.ReactNode }) {
  const { settings, updateSettings, hydrated } = useGame();

  const aRef = useRef<HTMLAudioElement | null>(null);
  const bRef = useRef<HTMLAudioElement | null>(null);
  const active = useRef(0);
  const loadedId = useRef<string | null>(null);
  const fadeToken = useRef<[number, number]>([0, 0]);
  const volumeRef = useRef(settings.musicVolume);
  const playingRef = useRef(false);
  const trackIdRef = useRef(settings.trackId);
  const startedRef = useRef(false);

  const [playing, setPlaying] = useState(false);
  const [trackId, setTrackId] = useState(settings.trackId);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const track = getTrack(trackId);

  useEffect(() => {
    volumeRef.current = settings.musicVolume;
  }, [settings.musicVolume]);

  useEffect(() => {
    trackIdRef.current = settings.trackId;
    setTrackId(settings.trackId);
  }, [settings.trackId]);

  // One-time migration: "calm" used to be the default. Visitors who never
  // picked a track get the new default soundtrack; later choices are kept.
  useEffect(() => {
    if (!hydrated) return;
    try {
      const flag = "sr:default-track-v2";
      if (window.localStorage.getItem(flag)) return;
      window.localStorage.setItem(flag, "1");
      if (settings.trackId === "calm") updateSettings({ trackId: DEFAULT_TRACK_ID });
    } catch {
      /* storage blocked — nothing to migrate */
    }
  }, [hydrated, settings.trackId, updateSettings]);

  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  /* ---------------- element helpers ---------------- */

  const element = useCallback((index: number) => (index === 0 ? aRef.current : bRef.current), []);

  const fade = useCallback((el: HTMLAudioElement, index: number, to: number, ms: number) => {
    const token = ++fadeToken.current[index];
    const from = el.volume;
    const start = performance.now();
    const step = (t: number) => {
      if (fadeToken.current[index] !== token) return;
      const k = Math.min(1, (t - start) / ms);
      el.volume = Math.max(0, Math.min(1, from + (to - from) * k));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, []);

  const start = useCallback(
    async (next: Track, autoplay: boolean) => {
      const els = [aRef.current, bRef.current];
      if (!els[0] || !els[1]) return;

      const nextIndex = 1 - active.current;
      const nextEl = els[nextIndex]!;
      const curEl = els[active.current];

      nextEl.src = next.src;
      nextEl.volume = 0;
      nextEl.loop = true;
      try {
        nextEl.load();
      } catch {
        /* noop */
      }
      setError(null);
      setProgress(0);
      setDuration(0);
      loadedId.current = next.id;

      if (autoplay) {
        try {
          await nextEl.play();
        } catch {
          setError("Autoplay is blocked — tap play to start the music.");
          setPlaying(false);
          return;
        }
      }

      setPlaying(true);
      setTrackId(next.id);

      if (curEl && !curEl.paused) {
        fade(curEl, active.current, 0, 900);
        window.setTimeout(() => {
          if (curEl !== els[active.current]) curEl.pause();
        }, 950);
      }
      fade(nextEl, nextIndex, volumeRef.current, autoplay ? 900 : 0);
      active.current = nextIndex;
    },
    [fade],
  );

  const play = useCallback(() => {
    updateSettings({ musicOn: true });
    const el = element(active.current);
    if (el && el.src && loadedId.current === trackIdRef.current && el.currentTime > 0) {
      void el
        .play()
        .then(() => {
          setPlaying(true);
          setError(null);
          fade(el, active.current, volumeRef.current, 350);
        })
        .catch(() => setError("Autoplay is blocked — tap play again."));
      return;
    }
    void start(getTrack(trackIdRef.current), true);
  }, [element, fade, start, updateSettings]);

  const pause = useCallback(() => {
    updateSettings({ musicOn: false });
    const index = active.current;
    const el = element(index);
    setPlaying(false);
    if (!el) return;
    fade(el, index, 0, 320);
    window.setTimeout(() => el.pause(), 340);
  }, [element, fade, updateSettings]);

  const toggle = useCallback(() => {
    if (playingRef.current) pause();
    else play();
  }, [pause, play]);

  const select = useCallback(
    (id: string) => {
      const next = getTrack(id);
      updateSettings({ trackId: next.id, musicOn: true });
      void start(next, true);
    },
    [start, updateSettings],
  );

  const next = useCallback(() => {
    const i = trackIndex(trackIdRef.current);
    select(TRACKS[(i + 1) % TRACKS.length].id);
  }, [select]);

  const prev = useCallback(() => {
    const i = trackIndex(trackIdRef.current);
    select(TRACKS[(i - 1 + TRACKS.length) % TRACKS.length].id);
  }, [select]);

  const seek = useCallback((ratio: number) => {
    const el = element(active.current);
    if (!el || !Number.isFinite(el.duration)) return;
    el.currentTime = Math.max(0, Math.min(1, ratio)) * el.duration;
    setProgress(el.currentTime);
  }, [element]);

  const setVolume = useCallback(
    (v: number) => {
      volumeRef.current = v;
      updateSettings({ musicVolume: v });
      const el = element(active.current);
      if (el && playingRef.current) el.volume = v;
    },
    [element, updateSettings],
  );

  /* ---------------- lifecycle ---------------- */

  useEffect(() => {
    const els = [aRef.current, bRef.current];
    for (const el of els) {
      if (!el) continue;
      el.loop = true;
      el.preload = "auto";
    }
    return () => {
      for (const el of els) {
        if (!el) continue;
        el.pause();
        el.removeAttribute("src");
      }
    };
  }, []);

  // Resume the last track after the first user gesture of the session.
  useEffect(() => {
    if (!hydrated || startedRef.current || !settings.musicOn) return;
    const el = element(active.current);
    if (!el) return;
    const kick = () => {
      startedRef.current = true;
      void start(getTrack(trackIdRef.current), true);
    };
    window.addEventListener("pointerdown", kick, { once: true });
    window.addEventListener("keydown", kick, { once: true });
    return () => {
      window.removeEventListener("pointerdown", kick);
      window.removeEventListener("keydown", kick);
    };
  }, [hydrated, settings.musicOn, element, start]);

  // Keep volume in sync when it changes from elsewhere (e.g. reset).
  useEffect(() => {
    const el = element(active.current);
    if (el && playingRef.current) el.volume = settings.musicVolume;
    volumeRef.current = settings.musicVolume;
  }, [settings.musicVolume, element]);

  // Media Session: lock screen / notification shade controls.
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.artist,
        album: "Anti-Stress Playground",
        artwork: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
        ],
      });
      navigator.mediaSession.playbackState = playing ? "playing" : "paused";
      navigator.mediaSession.setActionHandler("play", () => play());
      navigator.mediaSession.setActionHandler("pause", () => pause());
      navigator.mediaSession.setActionHandler("nexttrack", () => next());
      navigator.mediaSession.setActionHandler("previoustrack", () => prev());
    } catch {
      /* partial support — ignore */
    }
  }, [track, playing, play, pause, next, prev]);

  const value: MusicContextValue = {
    playing,
    track,
    progress,
    duration,
    error,
    play,
    pause,
    toggle,
    next,
    prev,
    select,
    seek,
    volume: settings.musicVolume,
    setVolume,
  };

  return (
    <MusicContext.Provider value={value}>
      {children}
      <audio
        ref={aRef}
        loop
        preload="auto"
        onTimeUpdate={(e) => {
          if (active.current !== 0) return;
          setProgress(e.currentTarget.currentTime);
          if (Number.isFinite(e.currentTarget.duration)) setDuration(e.currentTarget.duration);
        }}
        onLoadedMetadata={(e) => {
          if (active.current !== 0) return;
          if (Number.isFinite(e.currentTarget.duration)) setDuration(e.currentTarget.duration);
        }}
        onError={() => {
          if (active.current === 0) setError("This track could not be loaded.");
        }}
      />
      <audio
        ref={bRef}
        loop
        preload="auto"
        onTimeUpdate={(e) => {
          if (active.current !== 1) return;
          setProgress(e.currentTarget.currentTime);
          if (Number.isFinite(e.currentTarget.duration)) setDuration(e.currentTarget.duration);
        }}
        onLoadedMetadata={(e) => {
          if (active.current !== 1) return;
          if (Number.isFinite(e.currentTarget.duration)) setDuration(e.currentTarget.duration);
        }}
        onError={() => {
          if (active.current === 1) setError("This track could not be loaded.");
        }}
      />
    </MusicContext.Provider>
  );
}

export function useMusic(): MusicContextValue {
  const ctx = useContext(MusicContext);
  if (!ctx) throw new Error("useMusic must be used inside <MusicProvider>");
  return ctx;
}
