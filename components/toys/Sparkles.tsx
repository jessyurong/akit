"use client";

import React, { useEffect, useRef, useState } from "react";
import { Tile } from "../ui";
import { useGame } from "../../lib/game";
import { sfx } from "../../lib/audio/sfx";

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
}

const COLORS = ["#f43f5e", "#ec4899", "#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#38bdf8"];

export default function Sparkles() {
  const { addScore, say } = useGame();
  const [particles, setParticles] = useState<Particle[]>([]);
  const timeout = useRef<number | null>(null);
  const [bursts, setBursts] = useState(0);

  useEffect(() => {
    return () => {
      if (timeout.current) window.clearTimeout(timeout.current);
    };
  }, []);

  const fire = () => {
    sfx.whoosh();
    sfx.sparkle();
    addScore(3, "sparkles");
    setBursts((n) => n + 1);

    const now = Date.now();
    const next: Particle[] = Array.from({ length: 44 }, (_, i) => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 18 + Math.random() * 40;
      return {
        id: now + i,
        x: 50,
        y: 50,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: 7 + Math.random() * 9,
      };
    });

    setParticles(next);
    if (timeout.current) window.clearTimeout(timeout.current);
    timeout.current = window.setTimeout(() => setParticles([]), 1900);
    say(
      bursts > 4
        ? "✨ You are officially a sparkle hazard. Keep going."
        : "✨ Sparkle cannon deployed! Maximum good vibes unleashed.",
    );
  };

  return (
    <>
      {particles.map((p) => (
        <span
          key={p.id}
          className="particle"
          style={
            {
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              backgroundColor: p.color,
              ["--vx" as string]: `${p.vx}vw`,
              ["--vy" as string]: `${p.vy}vh`,
            } as React.CSSProperties
          }
        />
      ))}
      <Tile
        title="✨ Sparkle Chaos"
        desc="Release a burst of colorful dopamine confetti."
        className="particleCard"
        footer={<span>{bursts} bursts of serotonin</span>}
      >
        <button className="chaosBtn" onClick={fire}>
          RELEASE THE SPARKLES ✨
        </button>
      </Tile>
    </>
  );
}
