"use client";

import { useEffect, useRef, useState } from "react";
import {
  canRecord,
  MAX_RECORD_MS,
  MIN_RECORD_MS,
  startRecording,
  type VoiceRecording,
} from "./voice";

export type VoicePhase = "idle" | "listening" | "thinking";

type Options = {
  onReply: (text: string) => void;
  onStatus: (text: string) => void;
};

/**
 * Hold-to-talk logic for Mochi's voice chat, without owning a button.
 *
 * Mochi herself is the button now: she starts recording, stops on release,
 * uploads the WAV to /api/mochi and hands the reply back through `onReply`.
 */
export function useMochiVoice({ onReply, onStatus }: Options) {
  const [supported, setSupported] = useState(false);
  const [phase, setPhase] = useState<VoicePhase>("idle");

  const phaseRef = useRef<VoicePhase>("idle");
  const sessionRef = useRef<VoiceRecording | null>(null);
  const holdingRef = useRef(false);
  const attemptRef = useRef(0);
  const finishingRef = useRef(false);
  const autoStopRef = useRef<number | null>(null);
  const mountedRef = useRef(true);
  const finishRef = useRef<() => void>(() => undefined);
  const onReplyRef = useRef(onReply);
  const onStatusRef = useRef(onStatus);
  onReplyRef.current = onReply;
  onStatusRef.current = onStatus;

  const go = (next: VoicePhase) => {
    phaseRef.current = next;
    if (mountedRef.current) setPhase(next);
  };

  const clearAutoStop = () => {
    if (autoStopRef.current !== null) {
      window.clearTimeout(autoStopRef.current);
      autoStopRef.current = null;
    }
  };

  // Stop listening and, if we have audio, send it to Mochi.
  const finish = async () => {
    // Two releases can race (the pet's own handler plus the window fallback).
    if (finishingRef.current) return;
    clearAutoStop();
    holdingRef.current = false;

    const session = sessionRef.current;
    if (!session) {
      // Still waiting on the mic permission prompt — start() will cancel it.
      go("idle");
      return;
    }
    finishingRef.current = true;
    sessionRef.current = null;
    go("thinking");

    try {
      const result = await session.stop();
      if (!mountedRef.current) return;

      if (!result) {
        go("idle");
        return;
      }
      if (result.durationMs < MIN_RECORD_MS) {
        onStatusRef.current("Hold me a little longer, then let go.");
        go("idle");
        return;
      }

      const response = await fetch("/api/mochi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audio: result.base64 }),
      });

      if (!mountedRef.current) return;

      if (response.status === 429) {
        onStatusRef.current("Mochi needs a tiny rest. Try again in a minute.");
        return;
      }
      if (!response.ok) {
        onStatusRef.current("Mochi couldn't hear that one. Try again in a bit.");
        return;
      }

      const data = (await response.json()) as { reply?: unknown };
      if (typeof data.reply === "string" && data.reply.trim()) {
        onReplyRef.current(data.reply.trim());
      } else {
        onStatusRef.current("Mochi didn't catch that. Try again?");
      }
    } catch {
      if (mountedRef.current) {
        onStatusRef.current("Mochi couldn't hear that one. Try again in a bit.");
      }
    } finally {
      finishingRef.current = false;
      if (mountedRef.current) go("idle");
    }
  };

  finishRef.current = () => {
    void finish();
  };

  // Throw the current take away without uploading it.
  const cancel = () => {
    clearAutoStop();
    holdingRef.current = false;
    attemptRef.current += 1;
    const session = sessionRef.current;
    sessionRef.current = null;
    session?.cancel();
    go("idle");
  };

  const start = () => {
    if (phaseRef.current !== "idle" || holdingRef.current) return;
    if (!canRecord()) return;

    holdingRef.current = true;
    const attempt = (attemptRef.current += 1);
    go("listening");

    void (async () => {
      try {
        const session = await startRecording();
        // Released (or unmounted) while the permission prompt was open.
        if (!mountedRef.current || attempt !== attemptRef.current || !holdingRef.current) {
          session.cancel();
          if (mountedRef.current && attempt === attemptRef.current) go("idle");
          return;
        }
        sessionRef.current = session;
        autoStopRef.current = window.setTimeout(() => {
          autoStopRef.current = null;
          void finishRef.current();
        }, MAX_RECORD_MS);
      } catch {
        const stillHolding = holdingRef.current && attempt === attemptRef.current;
        if (attempt === attemptRef.current) {
          holdingRef.current = false;
          go("idle");
        }
        if (stillHolding && mountedRef.current) {
          onStatusRef.current("I couldn't reach your mic. Check the permission and try again.");
        }
      }
    })();
  };

  useEffect(() => {
    mountedRef.current = true;
    setSupported(canRecord());

    return () => {
      mountedRef.current = false;
      clearAutoStop();
      holdingRef.current = false;
      attemptRef.current += 1;
      const session = sessionRef.current;
      sessionRef.current = null;
      session?.cancel();
    };
  }, []);

  return {
    supported,
    phase,
    listening: phase === "listening",
    thinking: phase === "thinking",
    busy: phase !== "idle",
    start,
    finish: () => void finishRef.current(),
    cancel,
  };
}
