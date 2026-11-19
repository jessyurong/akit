"use client";

import React, { useEffect, useRef, useState } from "react";
import { Tile } from "../ui";
import { useGame } from "../../lib/game";
import { sfx } from "../../lib/audio/sfx";

const START = { x: 45, y: 40 };

const SPLASHES = Array.from({ length: 6 }, (_, i) => {
  const a = (i / 6) * Math.PI * 2;
  return { dx: Math.cos(a) * 26, dy: Math.sin(a) * 14, delay: i * 18 };
});

function FrogArt({ size = 56 }: { size?: number }) {
  return (
    <svg
      className="frogArt"
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id="frogSkin" cx="0.36" cy="0.28" r="0.85">
          <stop offset="0" stopColor="#a8f0a0" />
          <stop offset="0.45" stopColor="#5ecb63" />
          <stop offset="1" stopColor="#2f8f43" />
        </radialGradient>
        <radialGradient id="frogBelly" cx="0.5" cy="0.35" r="0.75">
          <stop offset="0" stopColor="#f6ffd9" />
          <stop offset="1" stopColor="#cdeaa6" />
        </radialGradient>
        <linearGradient id="frogLeg" x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor="#6fd873" />
          <stop offset="1" stopColor="#2d8a3f" />
        </linearGradient>
      </defs>

      {/* back legs */}
      <ellipse cx="17" cy="45" rx="9" ry="7" fill="url(#frogLeg)" transform="rotate(-18 17 45)" />
      <ellipse cx="47" cy="45" rx="9" ry="7" fill="url(#frogLeg)" transform="rotate(18 47 45)" />

      {/* body */}
      <ellipse cx="32" cy="36" rx="20" ry="17" fill="url(#frogSkin)" />
      <ellipse cx="32" cy="41" rx="13" ry="10" fill="url(#frogBelly)" opacity="0.95" />

      {/* head */}
      <ellipse cx="32" cy="24" rx="17.5" ry="13.5" fill="url(#frogSkin)" />

      {/* eye bumps */}
      <circle cx="22" cy="15" r="8" fill="url(#frogSkin)" />
      <circle cx="42" cy="15" r="8" fill="url(#frogSkin)" />
      <circle cx="22" cy="15" r="6.4" fill="#ffffff" />
      <circle cx="42" cy="15" r="6.4" fill="#ffffff" />
      <circle className="frogPupil" cx="23" cy="15.6" r="3.5" fill="#20241b" />
      <circle className="frogPupil" cx="43" cy="15.6" r="3.5" fill="#20241b" />
      <circle cx="24.2" cy="13.9" r="1.3" fill="#ffffff" />
      <circle cx="44.2" cy="13.9" r="1.3" fill="#ffffff" />

      {/* mouth + nostrils */}
      <path
        d="M23.5 29.5c2.6 2.6 5.2 3.6 8.5 3.6s5.9-1 8.5-3.6"
        fill="none"
        stroke="#1f5f2c"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="27.5" cy="22.4" r="0.9" fill="#2a6b35" />
      <circle cx="36.5" cy="22.4" r="0.9" fill="#2a6b35" />

      {/* front toes */}
      <g fill="url(#frogLeg)">
        <ellipse cx="20" cy="50" rx="6.5" ry="4" transform="rotate(-12 20 50)" />
        <ellipse cx="44" cy="50" rx="6.5" ry="4" transform="rotate(12 44 50)" />
      </g>

      {/* soft sheen */}
      <ellipse cx="26" cy="20" rx="7" ry="4" fill="#ffffff" opacity="0.18" transform="rotate(-24 26 20)" />
    </svg>
  );
}

export default function Frog() {
  const { addScore, say, resetToken } = useGame();
  const [frog, setFrog] = useState({ ...START, caught: 0 });
  const [hop, setHop] = useState(0);
  const [splash, setSplash] = useState(0);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    if (resetToken > 0) {
      setFrog({ ...START, caught: 0 });
      setHop(0);
      setSplash(0);
    }
  }, [resetToken]);

  useEffect(() => {
    const list = timers.current;
    return () => list.forEach((t) => window.clearTimeout(t));
  }, []);

  const catchFrog = () => {
    sfx.ribbit();
    addScore(3, "frog");
    setHop((h) => h + 1);
    setSplash((s) => s + 1);
    setFrog((prev) => ({
      x: Math.max(8, Math.min(82, 8 + Math.random() * 74)),
      y: Math.max(10, Math.min(72, 10 + Math.random() * 62)),
      caught: prev.caught + 1,
    }));
    timers.current.push(window.setTimeout(() => setHop(0), 620));
    timers.current.push(window.setTimeout(() => setSplash(0), 700));
    say(
      frog.caught > 6
        ? `${frog.caught + 1} catches! The frog respects your reflexes.`
        : "FROG CAPTURED! It did a graceful backflip and escaped.",
    );
  };

  return (
    <Tile
      title="Pond Hopper"
      icon="frog"
      desc="Test your reflexes. Can you tap the speedy frog?"
      action={<span className="scoreBadge">{frog.caught} caught</span>}
    >
      <div className="frogPond">
        <div className="pondWater" aria-hidden="true" />
        <div className="pondLily lilyOne" aria-hidden="true" />
        <div className="pondLily lilyTwo" aria-hidden="true" />
        {splash > 0 ? (
          <div
            className="pondSplash"
            key={`splash-${splash}`}
            style={{ left: `${frog.x}%`, top: `${frog.y}%` }}
            aria-hidden="true"
          >
            <span className="splashRing" />
            {SPLASHES.map((s, i) => (
              <span
                key={i}
                className="splashDrop"
                style={
                  {
                    "--dx": `${s.dx}px`,
                    "--dy": `${s.dy}px`,
                    "--delay": `${s.delay}ms`,
                  } as React.CSSProperties
                }
              />
            ))}
          </div>
        ) : null}
        <button
          className={`frogBtn${hop > 0 ? " hopping" : ""}`}
          style={{ left: `${frog.x}%`, top: `${frog.y}%` }}
          onClick={catchFrog}
          aria-label="Catch the frog"
        >
          <span className="frogShadow" aria-hidden="true" />
          <span className="frogJump">
            <FrogArt />
          </span>
        </button>
      </div>
    </Tile>
  );
}
