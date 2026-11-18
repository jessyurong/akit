"use client";

import React, { useEffect, useRef, useState } from "react";
import { Tile } from "../ui";
import { useGame } from "../../lib/game";
import { sfx } from "../../lib/audio/sfx";

const FACES = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
const WISDOM = [
  "Possibility is a soup. Stir gently.",
  "The answer you seek is snack-adjacent.",
  "Today's forecast: 90% chance of coping.",
  "You are allowed to do the bare minimum and still be wonderful.",
  "Somewhere, a cat is asleep. Everything is fine.",
  "Say no to one thing today. Ahh, feels good.",
];

export default function Dice() {
  const { addScore, say } = useGame();
  const [face, setFace] = useState("⚄");
  const [rolling, setRolling] = useState(false);
  const interval = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (interval.current) window.clearInterval(interval.current);
    };
  }, []);

  const roll = () => {
    if (rolling) return;
    setRolling(true);
    sfx.dice();

    let ticks = 0;
    interval.current = window.setInterval(() => {
      ticks++;
      setFace(FACES[Math.floor(Math.random() * FACES.length)]);
      if (ticks > 9) {
        if (interval.current) window.clearInterval(interval.current);
        const final = FACES[Math.floor(Math.random() * FACES.length)];
        setFace(final);
        setRolling(false);
        addScore(1, "dice");
        sfx.chime(523.25, 0.6, 0.12);
        say(`${final} — ${WISDOM[Math.floor(Math.random() * WISDOM.length)]}`);
      }
    }, 60);
  };

  return (
    <Tile title="Lucky Dice" icon="dice" desc="Ask a silly question. Roll for cosmic wisdom." className="diceCard">
      <button
        className={`diceBtn ${rolling ? "rolling" : ""}`}
        onClick={roll}
        disabled={rolling}
        aria-label="Roll the dice"
      >
        {face}
      </button>
      <p className="hint">Tap dice to roll</p>
    </Tile>
  );
}
