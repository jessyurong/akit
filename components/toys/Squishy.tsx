"use client";

import React, { useEffect, useRef, useState } from "react";
import { Tile } from "../ui";
import { Icon } from "../icons";
import { useGame } from "../../lib/game";
import { sfx, haptics } from "../../lib/audio/sfx";

const LINES = [
  "SQUISH ME",
  "MORE SQUISH",
  "GENTLE. FIRM. PERFECT.",
  "THIS IS SELF CARE",
  "SQUISH RESPONSIBLY",
];

export default function Squishy() {
  const { addScore, say, resetToken } = useGame();
  const [count, setCount] = useState(0);
  const [label, setLabel] = useState(LINES[0]);
  const [squishing, setSquishing] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (resetToken > 0) setCount(0);
  }, [resetToken]);

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  const squish = () => {
    setSquishing(true);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setSquishing(false), 190);

    const next = count + 1;
    setCount(next);
    setLabel(LINES[next % LINES.length]);
    sfx.squish();
    addScore(1, "squishy");

    if (next % 10 === 0) {
      sfx.chime(659.25, 1);
      haptics.pulse([20, 40, 20]);
      say(`SQUISH COMBO! ${next} squishes delivered. Your thumbs are heroes.`);
    } else if (next % 25 === 0) {
      say("Legendary squish. The jelly has accepted you as one of its own.");
    }
  };

  return (
    <Tile title="Squishy Jelly" icon="jelly" desc="No thoughts. Just squish." className="squishyCard">
      <div className="squishContainer">
        <button className={`squishBtn ${squishing ? "squished" : ""}`} onClick={squish}>
          <span className="squishEmoji">
            <Icon name="heart" size={22} />
          </span>
          <span>{label}</span>
        </button>
      </div>
      <p className="squishCount">
        <b>{count}</b> squishes delivered with gentle enthusiasm.
      </p>
    </Tile>
  );
}
