"use client";

import React, { useEffect, useRef, useState } from "react";
import { Tile } from "../ui";
import { useGame } from "../../lib/game";
import { sfx } from "../../lib/audio/sfx";

const WISDOM = [
  "Rest is productive. Ask anyone who naps professionally.",
  "You are allowed to do the bare minimum today.",
  "Drink water. Then decide if it is still a problem.",
  "Slow is a speed. Try it.",
  "Not every thought needs a reply.",
  "You survived every hard day so far. Good odds.",
];

/** Pip positions on a 3×3 grid for each face value. */
const PIPS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

/** Rotation that turns each face toward the viewer. */
const FACING: Record<number, { x: number; y: number }> = {
  1: { x: 0, y: 0 },
  2: { x: 0, y: -90 },
  3: { x: -90, y: 0 },
  4: { x: 90, y: 0 },
  5: { x: 0, y: 90 },
  6: { x: 0, y: 180 },
};

export default function Dice() {
  const { addScore, say, resetToken } = useGame();
  const [face, setFace] = useState(5);
  const [rot, setRot] = useState(FACING[5]);
  const [rolling, setRolling] = useState(false);
  const [landed, setLanded] = useState(0);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    if (resetToken > 0) {
      setFace(5);
      setRot(FACING[5]);
      setRolling(false);
      setLanded(0);
    }
  }, [resetToken]);

  useEffect(() => {
    const list = timers.current;
    return () => list.forEach((t) => window.clearTimeout(t));
  }, []);

  const roll = () => {
    if (rolling) return;
    setRolling(true);
    sfx.dice();

    const value = 1 + Math.floor(Math.random() * 6);
    const base = FACING[value];
    const spins = 540 + Math.floor(Math.random() * 360);
    const tilt = Math.round(Math.random() * 14 - 7);

    setRot({ x: base.x + spins + tilt, y: base.y + spins - tilt });

    timers.current.push(
      window.setTimeout(() => {
        setRot(base);
        setFace(value);
        setRolling(false);
        setLanded((l) => l + 1);
        addScore(1, "dice");
        sfx.chime(523.25, 0.6, 0.12);
        say(`${value} — ${WISDOM[value - 1]}`);
      }, 1000),
    );
  };

  return (
    <Tile
      title="Lucky Dice"
      icon="dice"
      desc="Ask a silly question. Roll for cosmic wisdom."
      className="diceCard"
      action={<span className="scoreBadge">d6</span>}
    >
      <div className="diceStage">
        <div className="diceScene" aria-hidden="true">
          <div
            className={`diceCube${rolling ? " isRolling" : ""}`}
            style={{
              transform: `rotateX(${rot.x}deg) rotateY(${rot.y}deg)`,
            }}
          >
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className={`diceFace f${n}`}>
                {Array.from({ length: 9 }, (_, i) => (
                  <span
                    key={i}
                    className={`pip${PIPS[n].includes(i) ? " on" : ""}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
        <span className="diceShadow" aria-hidden="true" />
        {landed > 0 ? (
          <span className="diceSpark" key={`spark-${landed}`} aria-hidden="true" />
        ) : null}
        <button
          type="button"
          className="diceRollBtn"
          onClick={roll}
          disabled={rolling}
          aria-label={`Roll the dice. Showing ${face}.`}
        >
          {rolling ? "Rolling…" : "Roll the dice"}
        </button>
        <p className="diceHint">Tap to roll · {face} is showing</p>
      </div>
    </Tile>
  );
}
