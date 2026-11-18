"use client";

import React, { useEffect, useRef, useState } from "react";
import { useGame } from "../lib/game";
import { useMusic } from "../lib/music/player";
import { sfx, haptics } from "../lib/audio/sfx";

const LINES = [
  "Mochi believes in you. Statistically speaking.",
  "Hydrate? Mochi is 90% water and thriving.",
  "You've done enough for now. Seriously.",
  "Mochi saw that pop. Extremely impressive.",
  "Tiny break? Mochi will guard your tabs.",
  "Remember: rest is productive. Mochi naps 14 hours a day.",
];

const TIPS = [
  "Try the 4-4-4 breathing card when your chest feels tight.",
  "Stack rain + fireplace in the ambient mixer. Trust.",
  "The synth pads are pentatonic — no wrong notes exist.",
  "Draw one ugly line. It counts as art.",
];

// Cute reactions Mochi cycles through on tap. Never the same one twice in a row.
const REACTIONS = ["boing", "squish", "wiggle", "love", "blink"] as const;

export default function Mochi() {
  const { mood, moodLabel, happiness, calm, addScore, say } = useGame();
  const { playing, track } = useMusic();
  const bodyRef = useRef<HTMLSpanElement | null>(null);
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

  const showBubble = (text: string, ms = 5200) => {
    setBubble(text);
    if (bubbleTimer.current) window.clearTimeout(bubbleTimer.current);
    bubbleTimer.current = window.setTimeout(() => setBubble(null), ms);
  };

  useEffect(() => {
    return () => {
      if (bubbleTimer.current) window.clearTimeout(bubbleTimer.current);
      if (reactionTimer.current) window.clearTimeout(reactionTimer.current);
    };
  }, []);

  // Occasional unsolicited advice, because that is what friends do.
  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.hidden) return;
      showBubble(TIPS[Math.floor(Math.random() * TIPS.length)], 6500);
    }, 45000);
    return () => window.clearInterval(id);
  }, []);

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
    const next = pokes + 1;
    setPokes(next);
    addScore(1, "mochi");
    sfx.chime(next % 5 === 0 ? 1046.5 : 783.99, 0.8, 0.1);
    haptics.pulse(14);
    showBubble(LINES[Math.floor(Math.random() * LINES.length)], 4200);
    say("🫧 Mochi appreciates the attention. Mood +1.");

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
    <div className="mochiWrap">
      {bubble && (
        <div className="mochiBubble" role="status">
          {bubble}
        </div>
      )}
      <button
        className={`mochi ${pokes > 0 ? "poked" : ""}`}
        onClick={poke}
        aria-label={`Mochi the strawberry, ${moodLabel}, ${happiness} percent happy. Tap to say hi.`}
        data-mood={mood}
        data-calm={calm}
        data-dancing={playing && !calm}
        data-react={reaction ?? undefined}
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
            <span className="mochiEye">
              <span className="mochiPupil" />
            </span>
            <span className="mochiEye">
              <span className="mochiPupil" />
            </span>
            <span className="mochiCheek left" />
            <span className="mochiCheek right" />
            <span className="mochiMouth" />
          </span>
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
          💗
        </span>
      ))}
      <span className="mochiLabel">
        Mochi · {happiness}% {playing && !calm ? "· dancing" : ""}
      </span>
    </div>
  );
}
