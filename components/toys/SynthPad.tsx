"use client";

import React, { useEffect, useRef, useState } from "react";
import { Tile } from "../ui";
import { useGame } from "../../lib/game";
import { sfx } from "../../lib/audio/sfx";

const PADS = [
  { label: "C", freq: 261.63, hue: "#a855f7" },
  { label: "D", freq: 293.66, hue: "#8b5cf6" },
  { label: "E", freq: 329.63, hue: "#6366f1" },
  { label: "G", freq: 392.0, hue: "#3b82f6" },
  { label: "A", freq: 440.0, hue: "#0ea5e9" },
  { label: "C+", freq: 523.25, hue: "#14b8a6" },
  { label: "D+", freq: 587.33, hue: "#22c55e" },
  { label: "E+", freq: 659.25, hue: "#eab308" },
];

export default function SynthPad() {
  const { say, addScore } = useGame();
  const [octave, setOctave] = useState(1);
  const [echo, setEcho] = useState(true);
  const [lit, setLit] = useState<number[]>([]);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    return () => {
      timers.current.forEach((t) => window.clearTimeout(t));
      timers.current = [];
    };
  }, []);

  const play = (index: number) => {
    const pad = PADS[index];
    const freq = pad.freq * octave;
    sfx.note(freq, 1.8, 0.17);

    if (echo) {
      timers.current.push(window.setTimeout(() => sfx.note(freq, 1.2, 0.07), 240));
      timers.current.push(window.setTimeout(() => sfx.note(freq, 1.0, 0.035), 480));
    }

    setLit((prev) => [...prev, index]);
    window.setTimeout(() => setLit((prev) => prev.filter((i) => i !== index)), 220);

    addScore(1, "synth");
    if (Math.random() < 0.22) {
      say("🎹 That was a whole vibe. Keep going, composer.");
    }
  };

  return (
    <Tile
      title="🎹 Pocket Synth"
      desc="Eight pads, one pentatonic scale. You literally cannot play a wrong note."
      action={
        <div className="toolBtns">
          <button className="smallBtn" onClick={() => setEcho((v) => !v)} aria-pressed={echo}>
            {echo ? "Echo on" : "Echo off"}
          </button>
          <button className="smallBtn" onClick={() => setOctave((o) => (o === 1 ? 2 : 1))}>
            {octave === 1 ? "Low" : "High"}
          </button>
        </div>
      }
      className="synthCard"
      footer={<span>Tap pads in any order — it always sounds nice.</span>}
    >
      <div className="padGrid">
        {PADS.map((pad, i) => (
          <button
            key={pad.label}
            className={`pad ${lit.includes(i) ? "active" : ""}`}
            style={{ ["--pad-hue" as string]: pad.hue } as React.CSSProperties}
            onPointerDown={(e) => {
              e.preventDefault();
              play(i);
            }}
            aria-label={`Play note ${pad.label}`}
          >
            <span className="padNote">{pad.label}</span>
            <span className="padRing" />
          </button>
        ))}
      </div>
    </Tile>
  );
}
