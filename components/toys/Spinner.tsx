"use client";

import React, { useEffect, useRef, useState } from "react";
import { Tile } from "../ui";
import { useGame } from "../../lib/game";
import { sfx, haptics } from "../../lib/audio/sfx";

/**
 * The spin lives entirely in refs — the rAF loop writes `transform` directly.
 * The old version kept angle/velocity in React state, which re-rendered the
 * whole page ~60 times per second and melted phones.
 */
export default function Spinner() {
  const { addScore, say, resetToken } = useGame();
  const wheelRef = useRef<HTMLDivElement | null>(null);
  const velocity = useRef(0);
  const [speed, setSpeed] = useState(0);
  const [boosted, setBoosted] = useState(0);

  useEffect(() => {
    if (resetToken > 0) {
      velocity.current = 0;
      setBoosted(0);
    }
  }, [resetToken]);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    let angle = 0;

    const loop = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;

      if (Math.abs(velocity.current) < 0.2) {
        velocity.current = 0;
      } else {
        velocity.current *= Math.pow(0.965, dt * 60);
      }
      angle = (angle + velocity.current * dt * 18) % 360;
      if (wheelRef.current) wheelRef.current.style.transform = `rotate(${angle}deg)`;

      acc += dt;
      if (acc > 0.25) {
        acc = 0;
        setSpeed(Math.round(Math.abs(velocity.current)));
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const boost = () => {
    velocity.current = Math.min(velocity.current + 38, 165);
    setBoosted((n) => n + 1);
    sfx.click();
    haptics.pulse(10);
    addScore(2, "spinner");
    if (boosted > 0 && boosted % 8 === 0) say("🌪️ That spinner is officially out of control. Beautiful.");
  };

  return (
    <Tile
      title="🌪️ Kinetic Spinner"
      desc="Tap to spin faster. Soothing momentum, zero maintenance."
      action={
        <button className="smallBtn" onClick={boost}>
          + Boost
        </button>
      }
      footer={<span>Speed: {speed} RPM</span>}
    >
      <div className="spinnerContainer" onClick={boost} role="presentation">
        <div className="spinnerWheel" ref={wheelRef}>
          <div className="blade blade1">🌀</div>
          <div className="blade blade2">🌀</div>
          <div className="blade blade3">🌀</div>
          <div className="spinnerCore">✨</div>
        </div>
      </div>
    </Tile>
  );
}
