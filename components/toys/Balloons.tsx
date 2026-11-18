"use client";

import React, { useEffect, useState } from "react";
import { Tile } from "../ui";
import { Icon } from "../icons";
import { useGame } from "../../lib/game";
import { sfx } from "../../lib/audio/sfx";

interface Balloon {
  id: number;
  color: string;
  popped: boolean;
}

const COLORS = ["#f43f5e", "#38bdf8", "#a855f7", "#eab308", "#22c55e", "#ec4899", "#14b8a6"];

function makeBalloons(): Balloon[] {
  return Array.from({ length: 5 }, (_, i) => ({
    id: Date.now() + i,
    color: COLORS[i % COLORS.length],
    popped: false,
  }));
}

export default function Balloons() {
  const { addScore, say, resetToken } = useGame();
  const [balloons, setBalloons] = useState<Balloon[]>(makeBalloons);

  useEffect(() => {
    if (resetToken > 0) setBalloons(makeBalloons());
  }, [resetToken]);

  const pop = (id: number) => {
    setBalloons((prev) => prev.map((b) => (b.id === id ? { ...b, popped: true } : b)));
    sfx.pop(0.8);
    addScore(2, "balloons");
    say("Pop! The balloon had no regrets.");
  };

  const more = () => {
    setBalloons(makeBalloons());
    sfx.pop(1.2);
    say("More balloons spawned! Pop to your heart's content.");
  };

  const remaining = balloons.filter((b) => !b.popped).length;

  return (
    <Tile
      title="Balloon Pop"
      icon="balloon"
      desc="Tap to pop the floating balloons into thin air."
      action={
        <button className="smallBtn" onClick={more}>
          More
        </button>
      }
      footer={<span>{remaining} balloons floating</span>}
    >
      <div className="balloonRow">
        {balloons.map((b) => (
          <button
            key={b.id}
            className={`balloonItem ${b.popped ? "balloonPopped" : ""}`}
            style={{ color: b.color }}
            onClick={() => !b.popped && pop(b.id)}
            disabled={b.popped}
            aria-label={b.popped ? "Popped balloon" : "Pop balloon"}
          >
            {b.popped ? <Icon name="sparkle" size={24} /> : <Icon name="balloon" size={46} />}
          </button>
        ))}
      </div>
      <p className="hint">They have done nothing wrong. Pop them anyway.</p>
    </Tile>
  );
}
