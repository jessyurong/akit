"use client";

import React, { useEffect, useState } from "react";
import { Tile } from "../ui";
import { useGame } from "../../lib/game";
import { sfx } from "../../lib/audio/sfx";

const START = { x: 45, y: 40 };

export default function Frog() {
  const { addScore, say, resetToken } = useGame();
  const [frog, setFrog] = useState({ ...START, caught: 0, hopping: false });

  useEffect(() => {
    if (resetToken > 0) setFrog({ ...START, caught: 0, hopping: false });
  }, [resetToken]);

  const catchFrog = () => {
    sfx.ribbit();
    addScore(3, "frog");
    setFrog((prev) => ({
      x: Math.max(6, Math.min(84, Math.random() * 84)),
      y: Math.max(8, Math.min(76, Math.random() * 76)),
      caught: prev.caught + 1,
      hopping: true,
    }));
    window.setTimeout(() => setFrog((f) => ({ ...f, hopping: false })), 230);
    say(
      frog.caught > 6
        ? `🐸 ${frog.caught + 1} catches! The frog respects your reflexes.`
        : "🐸 FROG CAPTURED! It did a graceful backflip and escaped.",
    );
  };

  return (
    <Tile
      title="🐸 Pond Hopper"
      desc="Test your reflexes. Can you tap the speedy frog?"
      action={<span className="scoreBadge">{frog.caught} caught</span>}
    >
      <div className="frogZone">
        <div className="waterRipple" />
        <button
          className={`frogBtn ${frog.hopping ? "hopping" : ""}`}
          style={{ left: `${frog.x}%`, top: `${frog.y}%` }}
          onClick={catchFrog}
          aria-label="Catch the frog"
        >
          🐸
        </button>
      </div>
    </Tile>
  );
}
