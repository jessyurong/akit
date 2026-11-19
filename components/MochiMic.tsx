"use client";

import React, { useEffect, useRef, useState } from "react";
import { Icon } from "./icons";
import {
  canRecord,
  MAX_RECORD_MS,
  MIN_RECORD_MS,
  startRecording,
  type VoiceRecording,
} from "../lib/voice";

type Phase = "idle" | "listening" | "thinking";

type Props = {
  onReply: (text: string) => void;
  onStatus: (text: string) => void;
};

/**
 * Hold-to-talk button that lives next to Mochi.
 *
 * Hold, speak, let go. The note goes to /api/mochi as 16 kHz WAV and the reply
 * comes back as text for Mochi's bubble (and her voice).
 */
export default function MochiMic({ onReply, onStatus }: Props) {
  const [supported, setSupported] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");

  const phaseRef = useRef<Phase>("idle");
  const sessionRef = useRef<VoiceRecording | null>(null);
  const holdingRef = useRef(false);
  const attemptRef = useRef(0);
  const autoStopRef = useRef<number | null>(null);
  const mountedRef = useRef(true);
  const finishRef = useRef<() => void>(() => undefined);
  const onReplyRef = useRef(onReply);
  const onStatusRef = useRef(onStatus);
  onReplyRef.current = onReply;
  onStatusRef.current = onStatus;

  const go = (next: Phase) => {
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
    clearAutoStop();
    holdingRef.current = false;

    const session = sessionRef.current;
    if (!session) {
      // Still waiting on the mic permission prompt — begin() will cancel it.
      go("idle");
      return;
    }
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
        onStatusRef.current("Hold the mic a little longer, then let go.");
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
      if (mountedRef.current) go("idle");
    }
  };

  finishRef.current = () => {
    void finish();
  };

  // Throw the current take away without uploading it.
  const abort = () => {
    clearAutoStop();
    holdingRef.current = false;
    attemptRef.current += 1;
    const session = sessionRef.current;
    sessionRef.current = null;
    session?.cancel();
    go("idle");
  };

  const begin = () => {
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

    const release = () => {
      if (holdingRef.current) void finishRef.current();
    };
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);

    return () => {
      mountedRef.current = false;
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
      clearAutoStop();
      holdingRef.current = false;
      attemptRef.current += 1;
      const session = sessionRef.current;
      sessionRef.current = null;
      session?.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!supported) return null;

  const label =
    phase === "listening"
      ? "Mochi is listening. Let go to send."
      : phase === "thinking"
        ? "Mochi is thinking."
        : "Hold to talk to Mochi.";

  return (
    <button
      type="button"
      className="mochiMic"
      data-phase={phase}
      disabled={phase === "thinking"}
      onPointerDown={(event) => {
        if (event.pointerType === "mouse" && event.button !== 0) return;
        event.preventDefault();
        begin();
      }}
      onPointerUp={() => {
        if (holdingRef.current) void finishRef.current();
      }}
      onPointerLeave={() => {
        if (holdingRef.current) void finishRef.current();
      }}
      onPointerCancel={abort}
      onContextMenu={(event) => event.preventDefault()}
      aria-label={label}
      title="Hold to talk to Mochi"
      draggable={false}
    >
      <span className="mochiMicRing" aria-hidden="true" />
      <Icon name={phase === "thinking" ? "sparkle" : "mic"} size={17} />
    </button>
  );
}
