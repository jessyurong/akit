"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Tile } from "../ui";
import { useGame } from "../../lib/game";
import { sfx, type DrumKind } from "../../lib/audio/sfx";

type Drum = {
  kind: DrumKind;
  label: string;
  cls: string;
  glyph: string;
  note: { x: number; y: number };
};

const DRUMS: Drum[] = [
  { kind: "hat", label: "Hi-hat", cls: "dHat", glyph: "✦", note: { x: 16, y: 12 } },
  { kind: "crash", label: "Crash cymbal", cls: "dCrash", glyph: "✧", note: { x: 84, y: 9 } },
  { kind: "snare", label: "Snare drum", cls: "dSnare", glyph: "♪", note: { x: 22, y: 42 } },
  { kind: "tom", label: "Tom drum", cls: "dTom", glyph: "♫", note: { x: 78, y: 42 } },
  { kind: "kick", label: "Kick drum", cls: "dKick", glyph: "♩", note: { x: 50, y: 40 } },
];

const PRAISE = [
  "Mochi is bopping. Keep going.",
  "Tiny concert, zero tickets sold.",
  "That beat fixed something in your brain.",
  "One-woman band. Very impressive.",
  "The drums approve. So does Mochi.",
];

const FILL: DrumKind[] = ["snare", "snare", "tom", "kick", "hat", "snare", "tom", "crash"];

type Note = { id: number; x: number; y: number; glyph: string; dx: number };

export default function DrumKit() {
  const { say, addScore } = useGame();
  const drumEls = useRef<Record<string, HTMLButtonElement | null>>({});
  const timers = useRef<number[]>([]);
  const noteId = useRef(0);
  const hitCount = useRef(0);

  const [notes, setNotes] = useState<Note[]>([]);
  const [beats, setBeats] = useState(0);

  useEffect(() => {
    const list = timers.current;
    return () => {
      list.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  const later = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timers.current.push(id);
  }, []);

  const spawnNote = useCallback((drum: Drum) => {
    const id = noteId.current++;
    const note: Note = {
      id,
      x: drum.note.x + (Math.random() - 0.5) * 8,
      y: drum.note.y,
      glyph: drum.glyph,
      dx: (Math.random() - 0.5) * 26,
    };
    setNotes((prev) => [...prev.slice(-13), note]);
    later(() => setNotes((prev) => prev.filter((n) => n.id !== id)), 1100);
  }, [later]);

  const hit = useCallback(
    (drum: Drum, opts: { score?: boolean; speak?: boolean } = {}) => {
      const el = drumEls.current[drum.kind];
      sfx.drum(drum.kind);

      if (el) {
        el.classList.remove("is-hit");
        const tilt = drum.kind === "hat" || drum.kind === "crash";
        el.animate(
          tilt
            ? [
                { transform: "rotate(0deg) scale(1)" },
                { transform: "rotate(-5deg) scale(0.96)", offset: 0.35 },
                { transform: "rotate(3deg) scale(1.02)", offset: 0.7 },
                { transform: "rotate(0deg) scale(1)" },
              ]
            : [
                { transform: "scale(1, 1)" },
                { transform: "scale(1.04, 0.88)", offset: 0.35 },
                { transform: "scale(0.98, 1.03)", offset: 0.7 },
                { transform: "scale(1, 1)" },
              ],
          { duration: 320, easing: "cubic-bezier(.34,1.56,.64,1)" },
        );
        el.classList.add("is-hit");
        later(() => el.classList.remove("is-hit"), 240);
      }

      spawnNote(drum);

      if (opts.score !== false) addScore(2, "drums");
      setBeats((b) => b + 1);

      if (opts.speak) {
        hitCount.current += 1;
        if (hitCount.current % 7 === 0) {
          say(PRAISE[Math.floor(Math.random() * PRAISE.length)]);
        }
      }
    },
    [addScore, later, say, spawnNote],
  );

  const drumRoll = useCallback(() => {
    FILL.forEach((kind, i) => {
      const drum = DRUMS.find((d) => d.kind === kind);
      if (!drum) return;
      later(() => hit(drum, { speak: false }), i * 105);
    });
    later(() => {
      say("Drum roll! Mochi gives it a 10/10.");
      sfx.sparkle();
    }, FILL.length * 105 + 120);
  }, [hit, later, say]);

  return (
    <Tile
      title="🥁 Tiny Drum Kit"
      desc="Tap a drum. Make a tiny beat — no rhythm required."
      action={
        <button className="smallBtn" onClick={drumRoll}>
          Drum roll
        </button>
      }
      className="drumCard"
      footer={<span>{beats ? `${beats} beats played · Mochi is keeping time` : "Start with the big kick drum"}</span>}
    >
      <div className="drumStage">
        <span className="drumGlow" aria-hidden="true" />

        {DRUMS.map((drum) => (
          <button
            key={drum.kind}
            type="button"
            ref={(el) => {
              drumEls.current[drum.kind] = el;
            }}
            className={`drum ${drum.cls}`}
            aria-label={`${drum.label} — tap to play`}
            title={drum.label}
            onClick={() => hit(drum, { speak: true })}
          >
            {drum.kind !== "kick" ? <span className="drumRig" aria-hidden="true" /> : null}
            <span className="drumBody">
              <span className="drumSkin">
                {drum.kind === "hat" || drum.kind === "crash" ? (
                  <span className="drumShine" aria-hidden="true">
                    ✦
                  </span>
                ) : (
                  <span className="drumFace" aria-hidden="true">
                    <span className="drumEye" />
                    <span className="drumEye" />
                    <span className="drumMouth" />
                  </span>
                )}
              </span>
            </span>
          </button>
        ))}

        {notes.map((note) => (
          <span
            key={note.id}
            className="drumNote"
            aria-hidden="true"
            style={{
              left: `${note.x}%`,
              top: `${note.y}%`,
              ["--note-dx" as string]: `${note.dx}px`,
            }}
          >
            {note.glyph}
          </span>
        ))}
      </div>
    </Tile>
  );
}
