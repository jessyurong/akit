"use client";

import React, { useEffect, useRef, useState } from "react";
import { useGame } from "../lib/game";
import { useMusic } from "../lib/music/player";
import { sfx, haptics } from "../lib/audio/sfx";
import { Icon } from "./icons";
import { primeSpeech, speak, stopSpeaking, warmUpVoices } from "../lib/speech";
import { useMochiVoice } from "../lib/use-mochi-voice";

// Always the first thing Mochi says on a fresh visit.
const GREETINGS = [
  "Hi Leah Kate!",
  "Oh, you're back!",
  "Hello hello, Leah Kate.",
  "Leah Kate! I was hoping you'd come by.",
];

// Short, spoken-style lines. Written to be read aloud, not just read.
const LINES = [
  "How are you today?",
  "How's your heart today, Leah Kate?",
  "Have you eaten yet?",
  "Did you drink water? Be honest.",
  "That tickles!",
  "Again! Again!",
  "Eep! Careful, I bruise like a strawberry.",
  "I'm a strawberry, not a stress ball. But I'll allow it.",
  "You poked me. I poked back. We're even.",
  "You're doing better than you think.",
  "Rest is allowed.",
  "Mochi is proud of you.",
  "Whatever's heavy today, you don't have to carry it alone.",
  "Kumain ka na ba?",
  "Ingat ka ha.",
  "Tiny break? I'll guard your tabs.",
  "I'm ninety percent water and thriving. Hydrate with me?",
  "One tap at a time. That's the whole plan.",
  // Little life-care reminders — the kind a best friend nags you about.
  "Have you eaten yet? Please don't get hungry.",
  "Eat something warm today, even if it's small.",
  "Drink water. Right now. I'll wait.",
  "Love yourself a little louder today.",
  "Unclench your jaw. Drop your shoulders. There you go.",
  "You don't have to earn your rest.",
  "Sleep early tonight, okay? Your body keeps score.",
  "Text someone you miss. It'll make both your days.",
  "Go stand in the sun for two minutes. Free medicine.",
  "If today feels heavy, do the small version.",
  "You're allowed to change your mind.",
  "Stretch your back, Leah Kate. You've been sitting a while.",
  "It's okay to say no. Really.",
  "Your feelings make sense. All of them.",
  "One small thing done is still a win.",
  "Take your meds if it's that time. I'm keeping track of nothing, but still.",
  "Put your phone down for a minute. Yes, I know. Hypocrite strawberry.",
  "You are not behind. You're just on your own timeline.",
];

// Grumpy lines for when someone poke-spams the strawberry.
const ANGRY_LINES = [
  "Hey! Easy! I'm a strawberry, not a punching bag.",
  "Ow ow ow — one tap at a time, please!",
  "Too fast! I'm getting dizzy!",
  "Keep poking me and I'll go sour, I swear.",
  "Excuse me? I have feelings and seeds.",
  "That's it. I'm telling Leah Kate.",
  "Gentle hands! I bruise, remember?",
  "Hmph. Poke me again and see what happens.",
];

// Second offense — still a warning, but she is no longer being polite about it.
const WARN_LINES = [
  "Excuse me? That was your second warning.",
  "I'm not playing around. Stop poking me.",
  "Okay, now I'm actually annoyed.",
  "Hands. Off. The strawberry.",
  "You're testing my patience, and I'm a very patient fruit.",
];

// Third offense and beyond — the warnings failed, so Jessie gets involved.
const JESSIE_LINES = [
  "Stop it. Or I'm telling Jessie.",
  "That's it — I'm telling Jessie.",
  "One more poke and Jessie hears about this.",
  "Careful. I have Jessie on speed dial.",
  "Do you want me to tell Jessie? Because I will.",
  "I'm serious. Jessie made me, and Jessie will hear about you.",
];

const OFFENSE_KEY = "sr:mochi-offense";
// She forgives after this long without any more spam.
const FORGIVE_MS = 120_000;

const TIPS = [
  "Try the 4-4-4 breathing card when your chest feels tight.",
  "Stack rain + fireplace in the ambient mixer. Trust.",
  "The synth pads are pentatonic — no wrong notes exist.",
  "Draw one ugly line. It counts as art.",
];

// Cute reactions Mochi cycles through on tap. Never the same one twice in a row.
const REACTIONS = ["boing", "squish", "wiggle", "love", "blink"] as const;

// Little things she does on her own when nobody is poking her.
const IDLE_REACTIONS = ["blink", "blink", "gaze", "yawn", "stretch"] as const;

const POS_KEY = "sr:mochi-pos";
// A press this long turns a tap into a voice note.
const HOLD_MS = 300;

type DragState = {
  id: number;
  sx: number;
  sy: number;
  ox: number;
  oy: number;
  scale: number;
  moved: boolean;
};

export default function Mochi() {
  const { mood, moodLabel, happiness, calm, addScore, settings } = useGame();
  const { playing, track } = useMusic();
  const bodyRef = useRef<HTMLSpanElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const posRef = useRef({ x: 0, y: 0 });
  const drag = useRef<DragState | null>(null);
  const suppressClick = useRef(false);
  const [dragging, setDragging] = useState(false);
  const [bubble, setBubble] = useState<string | null>(null);
  const bubbleTimer = useRef<number | null>(null);
  const [hearts, setHearts] = useState<
    { id: number; left: number; dx: number; rot: number; size: number }[]
  >([]);
  const [pokes, setPokes] = useState(0);
  const [reaction, setReaction] = useState<string | null>(null);
  const heartId = useRef(0);
  const lastReaction = useRef(-1);
  const reactionTimer = useRef<number | null>(null);
  const recentLines = useRef<string[]>([]);
  const [talking, setTalking] = useState(false);
  const talkTimer = useRef<number | null>(null);
  const [idle, setIdle] = useState<string | null>(null);
  const [annoyed, setAnnoyed] = useState(false);
  const annoyedRef = useRef(false);
  const annoyedTimer = useRef<number | null>(null);
  const tapTimes = useRef<number[]>([]);
  const [offense, setOffense] = useState(0);
  const offenseRef = useRef(0);
  const lastOffenseAt = useRef(0);
  const holdTimer = useRef<number | null>(null);

  const showBubble = (text: string, ms = 5200) => {
    setBubble(text);
    if (bubbleTimer.current) window.clearTimeout(bubbleTimer.current);
    bubbleTimer.current = window.setTimeout(() => setBubble(null), ms);
  };

  // Never repeat a line within the last four taps.
  const pickLine = () => {
    const fresh = LINES.filter((line) => !recentLines.current.includes(line));
    const pool = fresh.length ? fresh : LINES;
    const line = pool[Math.floor(Math.random() * pool.length)];
    recentLines.current = [...recentLines.current, line].slice(-4);
    return line;
  };

  const stopTalking = () => {
    if (talkTimer.current) window.clearTimeout(talkTimer.current);
    setTalking(false);
  };

  /* ---------------- Voice chat (hold Mochi to talk) ---------------- */

  // A real answer from the voice chat: stay on screen long enough to read,
  // and let her speak it with the same mouth movement as a poke.
  const bubbleMsFor = (text: string) => Math.min(14_000, Math.max(5_200, text.length * 90));

  const onVoiceReply = (text: string) => {
    const ms = bubbleMsFor(text);
    showBubble(text, ms);
    addScore(2, "mochi");
    if (!settings.soundOn) return;

    const started = speak(text, {
      onStart: () => {
        setTalking(true);
        if (talkTimer.current) window.clearTimeout(talkTimer.current);
        talkTimer.current = window.setTimeout(stopTalking, Math.max(3600, ms));
      },
      onEnd: stopTalking,
    });
    if (started) setTalking(true);
  };

  const onVoiceStatus = (text: string) => {
    showBubble(text, 4500);
  };

  const voice = useMochiVoice({ onReply: onVoiceReply, onStatus: onVoiceStatus });
  const voiceRef = useRef(voice);
  voiceRef.current = voice;

  const clearHold = () => {
    if (holdTimer.current !== null) {
      window.clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  };

  useEffect(() => {
    warmUpVoices();
    // Remember how many warnings were already ignored during this browsing session.
    try {
      const saved = JSON.parse(window.sessionStorage.getItem(OFFENSE_KEY) ?? "null") as
        | { level?: number; at?: number }
        | null;
      if (saved && typeof saved.level === "number" && typeof saved.at === "number") {
        if (Date.now() - saved.at < FORGIVE_MS) {
          offenseRef.current = saved.level;
          lastOffenseAt.current = saved.at;
          setOffense(saved.level);
        } else {
          window.sessionStorage.removeItem(OFFENSE_KEY);
        }
      }
    } catch {
      /* storage blocked — escalation just starts fresh */
    }
    return () => {
      if (bubbleTimer.current) window.clearTimeout(bubbleTimer.current);
      if (reactionTimer.current) window.clearTimeout(reactionTimer.current);
      if (talkTimer.current) window.clearTimeout(talkTimer.current);
      if (annoyedTimer.current) window.clearTimeout(annoyedTimer.current);
      if (holdTimer.current !== null) window.clearTimeout(holdTimer.current);
      annoyedRef.current = false;
      stopSpeaking();
    };
  }, []);

  // Safety net: if the pointer is released off the pet, still send the note.
  useEffect(() => {
    const release = () => {
      if (voiceRef.current.listening) voiceRef.current.finish();
    };
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    return () => {
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
    };
  }, []);

  /* ---------------- Dragging ---------------- */

  const applyPos = (x: number, y: number) => {
    posRef.current = { x, y };
    const el = wrapRef.current;
    if (!el) return;
    el.style.setProperty("--mx", `${x}px`);
    el.style.setProperty("--my", `${y}px`);
  };

  // Keep the whole pet (and its speech bubble) on screen.
  const clampTo = (x: number, y: number) => {
    const el = wrapRef.current;
    if (!el) return { x, y };
    const rect = el.getBoundingClientRect();
    const scale = el.offsetWidth ? rect.width / el.offsetWidth : 1;
    const baseLeft = rect.left - posRef.current.x * scale;
    const baseTop = rect.top - posRef.current.y * scale;
    const pad = 6;
    const minX = (pad - baseLeft) / scale;
    const maxX = (window.innerWidth - pad - baseLeft - rect.width) / scale;
    const minY = (pad - baseTop) / scale;
    const maxY = (window.innerHeight - pad - baseTop - rect.height) / scale;
    return {
      x: maxX < minX ? (minX + maxX) / 2 : Math.min(Math.max(x, minX), maxX),
      y: maxY < minY ? (minY + maxY) / 2 : Math.min(Math.max(y, minY), maxY),
    };
  };

  // Put Mochi back where she was left last time.
  useEffect(() => {
    let saved: { x?: number; y?: number } | null = null;
    try {
      saved = JSON.parse(window.localStorage.getItem(POS_KEY) ?? "null");
    } catch {
      saved = null;
    }
    if (!saved || typeof saved.x !== "number" || typeof saved.y !== "number") return;
    const next = clampTo(saved.x, saved.y);
    applyPos(next.x, next.y);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onResize = () => {
      const p = posRef.current;
      if (!p.x && !p.y) return;
      const next = clampTo(p.x, p.y);
      applyPos(next.x, next.y);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    // Guarantee a gesture-linked first utterance before any async reply speaks.
    primeSpeech();
    const el = wrapRef.current;
    if (!el) return;
    suppressClick.current = false;
    const rect = el.getBoundingClientRect();
    drag.current = {
      id: e.pointerId,
      sx: e.clientX,
      sy: e.clientY,
      ox: posRef.current.x,
      oy: posRef.current.y,
      scale: el.offsetWidth ? rect.width / el.offsetWidth : 1,
      moved: false,
    };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* synthetic or already-released pointer — gestures still work */
    }

    // Arm hold-to-talk. A quick tap stays a poke, a moving finger stays a drag,
    // and only a steady 300ms press turns into a voice note.
    if (voice.supported && !annoyedRef.current && !voice.busy) {
      clearHold();
      holdTimer.current = window.setTimeout(() => {
        holdTimer.current = null;
        const d = drag.current;
        if (!d || d.moved) return;
        // Swallow the click that will follow this release.
        suppressClick.current = true;
        setIdle(null);
        haptics.pulse(10);
        voice.start();
      }, HOLD_MS);
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    // While she is recording, the finger stays put; no dragging mid-note.
    if (voice.listening) {
      clearHold();
      return;
    }
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.sx;
    const dy = e.clientY - d.sy;
    if (!d.moved) {
      if (Math.hypot(dx, dy) < 5) return;
      d.moved = true;
      clearHold();
      setDragging(true);
    }
    const next = clampTo(d.ox + dx / d.scale, d.oy + dy / d.scale);
    applyPos(next.x, next.y);
  };

  const endDrag = (e: React.PointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    clearHold();

    // Releasing a hold sends the voice note instead of poking her.
    if (voice.listening) {
      suppressClick.current = true;
      voice.finish();
      return;
    }

    if (!d.moved) return;
    setDragging(false);
    suppressClick.current = true;
    try {
      window.localStorage.setItem(POS_KEY, JSON.stringify(posRef.current));
    } catch {
      /* storage full or blocked — position just won't persist */
    }
    haptics.pulse(8);
  };

  const onPointerCancel = (e: React.PointerEvent<HTMLButtonElement>) => {
    clearHold();
    if (voice.listening) {
      drag.current = null;
      suppressClick.current = true;
      voice.cancel();
      return;
    }
    endDrag(e);
  };

  // Occasional unsolicited advice, because that is what friends do.
  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.hidden) return;
      showBubble(TIPS[Math.floor(Math.random() * TIPS.length)], 6500);
    }, 45000);
    return () => window.clearInterval(id);
  }, []);

  // Idle life of her own: blinks, looks around, yawns, stretches.
  // Restarts whenever she talks or is being dragged, so it only happens when quiet.
  useEffect(() => {
    if (dragging || annoyed || voice.busy) return;
    let alive = true;
    let timer = 0;

    const step = (delay = 2400 + Math.random() * 3200) => {
      timer = window.setTimeout(() => {
        if (!alive) return;
        if (document.hidden) {
          step(2000);
          return;
        }
        const kind = IDLE_REACTIONS[Math.floor(Math.random() * IDLE_REACTIONS.length)];
        setIdle(kind);
        const hold = kind === "blink" ? 180 : kind === "gaze" ? 1500 : kind === "yawn" ? 1350 : 1000;
        window.setTimeout(() => {
          if (alive) setIdle((cur) => (cur === kind ? null : cur));
        }, hold);
        step();
      }, delay);
    };

    step(1600 + Math.random() * 2000);
    return () => {
      alive = false;
      window.clearTimeout(timer);
      setIdle(null);
    };
  }, [bubble, dragging, annoyed, voice.busy]);

  // Pupils follow the cursor on devices that actually have one.
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    let raf = 0;
    let px = 0;
    let py = 0;
    const apply = () => {
      raf = 0;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = Math.max(-1, Math.min(1, (px - cx) / 140));
      const dy = Math.max(-1, Math.min(1, (py - cy) / 140));
      el.style.setProperty("--ex", `${dx * 3.2}px`);
      el.style.setProperty("--ey", `${dy * 3}px`);
    };
    const onMove = (e: PointerEvent) => {
      px = e.clientX;
      py = e.clientY;
      if (!raf) raf = requestAnimationFrame(apply);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const poke = () => {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    // She's still grumpy — let her cool off instead of stacking more pokes.
    if (annoyedRef.current) return;
    // Mid voice note or waiting on a reply — this click isn't a poke.
    if (voice.busy) return;
    const next = pokes + 1;
    setPokes(next);
    addScore(1, "mochi");
    sfx.chime(next % 5 === 0 ? 1046.5 : 783.99, 0.8, 0.1);
    haptics.pulse(14);

    // Poke-spam detection: four taps inside ~2 seconds and she gets grumpy.
    const now = Date.now();
    tapTimes.current = tapTimes.current.filter((t) => now - t < 2200);
    tapTimes.current.push(now);
    if (tapTimes.current.length >= 4 && next > 1) {
      tapTimes.current = [];

      // Escalation: first time is a warning, second is a sterner one, and after
      // that she stops asking nicely and threatens to tell Jessie.
      if (now - lastOffenseAt.current > FORGIVE_MS) offenseRef.current = 0;
      const level = (offenseRef.current += 1);
      lastOffenseAt.current = now;
      setOffense(level);
      try {
        window.sessionStorage.setItem(OFFENSE_KEY, JSON.stringify({ level, at: now }));
      } catch {
        /* storage blocked — escalation still works for this visit */
      }

      const pool = level >= 3 ? JESSIE_LINES : level === 2 ? WARN_LINES : ANGRY_LINES;
      const grumpyMs = level >= 3 ? 2800 : level === 2 ? 2300 : 1900;

      if (annoyedTimer.current) window.clearTimeout(annoyedTimer.current);
      annoyedRef.current = true;
      setAnnoyed(true);
      annoyedTimer.current = window.setTimeout(() => {
        annoyedRef.current = false;
        setAnnoyed(false);
        // Drop back to a normal mood once she has cooled off for good.
        if (Date.now() - lastOffenseAt.current > FORGIVE_MS) {
          offenseRef.current = 0;
          setOffense(0);
        }
      }, grumpyMs);
      setIdle(null);
      if (reactionTimer.current) window.clearTimeout(reactionTimer.current);
      setReaction(null);
      sfx.huff();

      const grumpy = pool[Math.floor(Math.random() * pool.length)];
      showBubble(grumpy, level >= 3 ? 4800 : 3800);
      if (settings.soundOn) {
        const started = speak(grumpy, {
          pitch: level >= 3 ? 0.86 : 0.92,
          rate: level >= 3 ? 1 : 1.06,
          onStart: () => {
            setTalking(true);
            if (talkTimer.current) window.clearTimeout(talkTimer.current);
            talkTimer.current = window.setTimeout(stopTalking, Math.max(3400, grumpyMs));
          },
          onEnd: stopTalking,
        });
        if (started) setTalking(true);
      }
      return;
    }

    // First tap is always a greeting; after that, something she hasn't just said.
    const line =
      next === 1 ? GREETINGS[Math.floor(Math.random() * GREETINGS.length)] : pickLine();
    showBubble(line, 5200);

    if (settings.soundOn) {
      const started = speak(line, {
        onStart: () => {
          setTalking(true);
          if (talkTimer.current) window.clearTimeout(talkTimer.current);
          talkTimer.current = window.setTimeout(stopTalking, 3600);
        },
        onEnd: stopTalking,
      });
      // Some browsers fire onstart late — move the mouth right away.
      if (started) setTalking(true);
    }

    const id = ++heartId.current;
    setHearts((prev) => [
      ...prev.slice(-4),
      {
        id,
        left: 38 + Math.random() * 24,
        dx: Math.round((Math.random() - 0.5) * 46),
        rot: Math.round((Math.random() - 0.5) * 44),
        size: 0.9 + Math.random() * 0.55,
      },
    ]);
    window.setTimeout(() => setHearts((prev) => prev.filter((h) => h.id !== id)), 1300);

    // A different cute reaction every tap.
    let idx = Math.floor(Math.random() * REACTIONS.length);
    if (idx === lastReaction.current) idx = (idx + 1) % REACTIONS.length;
    lastReaction.current = idx;
    setReaction(REACTIONS[idx]);
    if (reactionTimer.current) window.clearTimeout(reactionTimer.current);
    reactionTimer.current = window.setTimeout(() => setReaction(null), 900);
  };

  const beat = `${Math.min(1.4, Math.max(0.5, 60 / track.bpm))}s`;

  return (
    <div
      className="mochiWrap"
      ref={wrapRef}
      data-dragging={dragging ? "true" : undefined}
    >
      {voice.listening ? (
        <div className="mochiListen" role="status" aria-live="polite">
          <span className="mochiListenDot" aria-hidden="true" />
          <span>Listening…</span>
          <span className="mochiListenHint">let go to send</span>
        </div>
      ) : voice.thinking ? (
        <div className="mochiListen thinking" role="status" aria-live="polite">
          <span className="mochiListenDot" aria-hidden="true" />
          <span>Thinking…</span>
        </div>
      ) : (
        bubble && (
          <div className="mochiBubble" role="status">
            {bubble}
          </div>
        )
      )}
      <button
        className={`mochi ${pokes > 0 ? "poked" : ""}`}
        onClick={poke}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={onPointerCancel}
        onContextMenu={(event) => event.preventDefault()}
        aria-label={`Mochi the strawberry, ${moodLabel}, ${happiness} percent happy. Tap to say hi, hold to talk, or drag her anywhere.`}
        title="Tap: say hi · Hold: talk to me · Drag: move me"
        data-mood={mood}
        data-calm={calm}
        data-dancing={playing && !calm}
        data-talking={talking ? "true" : undefined}
        data-listening={voice.listening ? "true" : undefined}
        data-thinking={voice.thinking ? "true" : undefined}
        data-react={reaction ?? undefined}
        data-idle={idle ?? undefined}
        data-annoyed={annoyed ? "true" : undefined}
        data-offense={offense >= 3 ? "high" : offense === 2 ? "warn" : undefined}
        data-dragging={dragging ? "true" : undefined}
        style={{ ["--beat" as string]: beat } as React.CSSProperties}
      >
        <span className="mochiShadow" aria-hidden="true" />
        <span className="mochiBody" ref={bodyRef} aria-hidden="true">
          <span className="mochiCrown">
            <span className="mochiLeaf leaf1" />
            <span className="mochiLeaf leaf2" />
            <span className="mochiLeaf leaf3" />
            <span className="mochiLeaf leaf4" />
            <span className="mochiLeaf leaf5" />
            <span className="mochiStem" />
          </span>
          <span className="mochiSeeds" />
          <span className="mochiFace">
            <span className="mochiBrow left" />
            <span className="mochiBrow right" />
            <span className="mochiEye left">
              <span className="mochiPupil" />
            </span>
            <span className="mochiEye right">
              <span className="mochiPupil" />
            </span>
            <span className="mochiCheek left" />
            <span className="mochiCheek right" />
            <span className="mochiMouth" />
          </span>
          <span className="mochiSteam" aria-hidden="true" />
          <span className="mochiShine" />
        </span>
      </button>
      {hearts.map((h) => (
        <span
          key={h.id}
          className="mochiHeart"
          style={
            {
              left: `${h.left}%`,
              "--heart-size": `${h.size}rem`,
              "--dx": `${h.dx}px`,
              "--rot": `${h.rot}deg`,
            } as React.CSSProperties
          }
          aria-hidden="true"
        >
          <Icon name="heart" size={Math.round(h.size * 21)} />
        </span>
      ))}
      <span className="mochiLabel">
        Mochi · {happiness}% {playing && !calm ? "· dancing" : ""}
      </span>
    </div>
  );
}
