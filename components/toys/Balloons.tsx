"use client";

import React, { useEffect, useState } from "react";
import { Tile } from "../ui";
import { useGame } from "../../lib/game";
import { sfx } from "../../lib/audio/sfx";

interface Balloon {
  id: number;
  color: string;
  popped: boolean;
}

const COLORS = ["#f43f5e", "#38bdf8", "#a855f7", "#eab308", "#22c55e", "#ec4899", "#14b8a6"];

/* Pre-computed shades: older iOS Safari has no color-mix(), which used to
   leave the balloon bodies with no background at all. */
function shade(hex: string, amount: number) {
  const n = parseInt(hex.slice(1), 16);
  const mix = (c: number) => Math.round(amount >= 0 ? c + (255 - c) * amount : c * (1 + amount));
  return `rgb(${mix((n >> 16) & 255)}, ${mix((n >> 8) & 255)}, ${mix(n & 255)})`;
}

function tint(hex: string, alpha: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

/** Pre-computed burst directions so no trigonometry runs during render. */
const SHARDS = Array.from({ length: 9 }, (_, i) => {
  const angle = (i / 9) * Math.PI * 2 + 0.35;
  return {
    dx: `${(Math.cos(angle) * 34).toFixed(1)}px`,
    dy: `${(Math.sin(angle) * 30).toFixed(1)}px`,
    rot: `${Math.round((i * 67) % 360)}deg`,
    scale: (0.65 + (i % 3) * 0.22).toFixed(2),
    delay: `${(i % 4) * 9}ms`,
  };
});

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
    sfx.pop(0.8 + Math.random() * 0.25);
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
            style={
              {
                "--balloon": b.color,
                "--balloon-light": shade(b.color, 0.45),
                "--balloon-dark": shade(b.color, -0.38),
                "--balloon-string": shade(b.color, -0.2),
                "--balloon-shadow": tint(b.color, 0.3),
              } as React.CSSProperties
            }
            onClick={() => !b.popped && pop(b.id)}
            disabled={b.popped}
            aria-label={b.popped ? "Popped balloon" : "Pop balloon"}
          >
            <span className="balloonBody">
              <span className="balloonGloss" />
              <span className="balloonKnot" />
              <svg className="balloonString" viewBox="0 0 18 54" aria-hidden="true">
                <path d="M9 0c6 8-5 13 0 21s-4 12 1 20-2 8 1 13" />
              </svg>
            </span>

            {b.popped ? (
              <span className="balloonBurst" aria-hidden="true">
                <span className="burstRing" />
                <span className="burstFlash" />
                {SHARDS.map((s, i) => (
                  <span
                    key={i}
                    className="burstShard"
                    style={
                      {
                        "--dx": s.dx,
                        "--dy": s.dy,
                        "--rot": s.rot,
                        "--scale": s.scale,
                        "--delay": s.delay,
                      } as React.CSSProperties
                    }
                  />
                ))}
              </span>
            ) : null}
          </button>
        ))}
      </div>
      <p className="hint">They have done nothing wrong. Pop them anyway.</p>
    </Tile>
  );
}
