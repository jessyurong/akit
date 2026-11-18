"use client";

import React, { useEffect, useState } from "react";
import { Tile } from "../ui";
import { useGame } from "../../lib/game";
import { sfx } from "../../lib/audio/sfx";

const COUNT = 16;

export default function PopIt() {
  const { addScore, say, resetToken } = useGame();
  const [grid, setGrid] = useState<boolean[]>(() => Array(COUNT).fill(false));

  useEffect(() => {
    if (resetToken > 0) setGrid(Array(COUNT).fill(false));
  }, [resetToken]);

  const toggle = (index: number) => {
    const next = [...grid];
    next[index] = !next[index];
    setGrid(next);
    sfx.pop(next[index] ? 1.4 : 1.0);
    addScore(1, "popit");
    if (next.every(Boolean)) {
      sfx.chime(784, 0.8);
      say("Whole sheet flipped! Extremely satisfying. +8");
      addScore(8);
    }
  };

  const down = grid.filter(Boolean).length;

  return (
    <Tile
      title="Silicone Pop-It"
      icon="popit"
      desc="Press the rainbow dimples back and forth."
      action={
        <button
          className="smallBtn"
          onClick={() => {
            setGrid(Array(COUNT).fill(false));
            sfx.pop(0.8);
            say("Pop-it sheet flipped over!");
          }}
        >
          Flip
        </button>
      }
      footer={<span>{down} / {COUNT} pressed</span>}
    >
      <div className="popItGrid">
        {grid.map((isDown, i) => (
          <button
            key={i}
            className={`popItDimple dimple-${i % 4} ${isDown ? "down" : "up"}`}
            onClick={() => toggle(i)}
            aria-label={`Dimple ${i + 1}${isDown ? " pressed" : ""}`}
            aria-pressed={isDown}
          />
        ))}
      </div>
    </Tile>
  );
}
