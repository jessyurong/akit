"use client";

import React, { useEffect, useRef, useState } from "react";
import { Tile } from "../ui";
import { useGame } from "../../lib/game";
import { sfx, haptics } from "../../lib/audio/sfx";

/** One four-sail pinwheel, drawn as gradients so it reads as glossy plastic. */
function PinwheelArt() {
  return (
    <svg className="pinwheelArt" viewBox="0 0 120 120" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="pwSail" x1="0.15" y1="0.1" x2="0.9" y2="0.95">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.92" />
          <stop offset="0.38" stopColor="var(--accent)" />
          <stop offset="0.82" stopColor="var(--spinner-core)" />
          <stop offset="1" stopColor="var(--spinner-core)" stopOpacity="0.75" />
        </linearGradient>
        <radialGradient id="pwHub" cx="0.34" cy="0.28" r="0.85">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.45" stopColor="var(--spinner-core)" />
          <stop offset="1" stopColor="#0f172a" stopOpacity="0.55" />
        </radialGradient>
      </defs>

      {[0, 90, 180, 270].map((a) => (
        <g key={a} transform={`rotate(${a} 60 60)`}>
          <path
            d="M60 60 Q 97 54 94 15 Q 74 25 60 60 Z"
            fill="url(#pwSail)"
            stroke="rgba(255,255,255,0.6)"
            strokeWidth="1.1"
          />
          <path
            d="M60 60 Q 81 50 90 26"
            fill="none"
            stroke="rgba(255,255,255,0.5)"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </g>
      ))}

      <circle cx="60" cy="60" r="10.5" fill="url(#pwHub)" />
      <circle cx="60" cy="60" r="3.4" fill="#1f2937" opacity="0.9" />
      <circle cx="57.7" cy="57.7" r="1.3" fill="#ffffff" opacity="0.95" />
    </svg>
  );
}

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

      const wheel = wheelRef.current;
      if (wheel) {
        // Motion blur grows with speed — the way a real pinwheel smears.
        const v = Math.abs(velocity.current);
        const blur = v > 22 ? Math.min(2.4, (v - 22) / 55) : 0;
        wheel.style.transform = `rotate(${angle}deg)`;
        wheel.style.filter = blur > 0.1 ? `blur(${blur.toFixed(2)}px)` : "";
      }

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
    if (boosted > 0 && boosted % 8 === 0) say("That spinner is officially out of control. Beautiful.");
  };

  return (
    <Tile
      title="Kinetic Spinner"
      icon="spinner"
      desc="Tap to spin faster. Soothing momentum, zero maintenance."
      action={
        <button className="smallBtn" onClick={boost}>
          + Boost
        </button>
      }
      footer={<span>Speed: {speed} RPM</span>}
    >
      <div className="spinnerContainer" onClick={boost} role="presentation">
        <span className="spinnerStick" aria-hidden="true" />
        <div className="spinnerWheel" ref={wheelRef}>
          <PinwheelArt />
        </div>
      </div>
    </Tile>
  );
}
