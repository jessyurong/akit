"use client";

import React, { useEffect, useState } from "react";
import { Tile } from "../ui";
import { Icon } from "../icons";
import { useGame } from "../../lib/game";
import { sfx } from "../../lib/audio/sfx";

const COUNT = 12;

const quotes = [
  "Achievement unlocked: you clicked a button. Glorious.",
  "Your stress was politely asked to vacate the premises.",
  "You are now 3.14% more legendary.",
  "Somewhere in the digital cosmos, a duck salutes you.",
  "Status update: tension dropping to safely silly levels.",
  "Certified vibe check: passed with flying sparkles.",
  "You pressed something! The dopamine has arrived.",
  "Take a deep breath. You're doing splendidly today.",
];

export default function BubbleWrap() {
  const { addScore, say, resetToken } = useGame();
  const [bubbles, setBubbles] = useState<boolean[]>(() => Array(COUNT).fill(false));

  useEffect(() => {
    if (resetToken > 0) setBubbles(Array(COUNT).fill(false));
  }, [resetToken]);

  const popped = bubbles.filter(Boolean).length;

  const pop = (index: number) => {
    if (bubbles[index]) return;
    const next = [...bubbles];
    next[index] = true;
    setBubbles(next);
    sfx.pop(1.05 + (index % 5) * 0.08);
    addScore(1, "bubbles");

    if (next.every(Boolean)) {
      sfx.success();
      addScore(10);
      say("BUBBLE MASTER! All 12 bubbles cleared — bonus +10!");
    } else {
      say(quotes[Math.floor(Math.random() * quotes.length)]);
    }
  };

  const reset = () => {
    setBubbles(Array(COUNT).fill(false));
    sfx.pop(0.9);
    say("Fresh sheet of bubbles ready to pop!");
  };

  return (
    <Tile
      title="Bubble Wrap"
      icon="bubble"
      desc="Tap each bubble. Tiny pops, instant relief."
      action={
        <button className="smallBtn" onClick={reset}>
          Reset
        </button>
      }
      footer={
        <>
          <span>
            {popped} / {COUNT} popped
          </span>
          {popped === COUNT && (
            <span className="bonusTag">
              <Icon name="star" size={12} /> All clear! +10
            </span>
          )}
        </>
      }
    >
      <div className="bubbleZone">
        {bubbles.map((done, i) => (
          <button
            key={i}
            className={`bubbleBtn ${done ? "popped" : ""}`}
            onClick={() => pop(i)}
            aria-label={done ? `Bubble ${i + 1} popped` : `Pop bubble ${i + 1}`}
            aria-pressed={done}
          >
            {done ? "" : null}
          </button>
        ))}
      </div>
    </Tile>
  );
}
