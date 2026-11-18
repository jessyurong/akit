"use client";

import React, { useRef, useState } from "react";
import { Tile } from "../ui";
import { Icon } from "../icons";
import { useGame } from "../../lib/game";
import { sfx, haptics } from "../../lib/audio/sfx";
import { clamp } from "../../lib/storage";

interface Stone {
  id: number;
  offset: number;
  width: number;
  color: string;
}

const PALETTE = ["#a78bfa", "#818cf8", "#60a5fa", "#38bdf8", "#67e8f9", "#a5b4fc"];
const GOAL = 6;

export default function RockStack() {
  const { say, addScore } = useGame();
  const [placed, setPlaced] = useState<Stone[]>([]);
  const [aim, setAim] = useState(0);
  const [status, setStatus] = useState<"aim" | "lost" | "won">("aim");
  const drag = useRef<{ startX: number; startAim: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  const level = placed.length;
  const currentWidth = 100 - level * 5;
  const top = placed[placed.length - 1];

  const reset = () => {
    setPlaced([]);
    setAim(0);
    setStatus("aim");
    sfx.pop(0.9);
    say("Fresh stones. Breathe. Align. Drop.");
  };

  const drop = () => {
    drag.current = null;
    setDragging(false);
    if (status !== "aim") return;

    const tolerance = top ? (currentWidth + top.width) * 0.3 : 999;
    if (top && Math.abs(aim - top.offset) > tolerance) {
      setStatus("lost");
      sfx.squish();
      haptics.pulse([40, 60, 40]);
      say("Toppled! The stones have spoken. Rebuild — gentler this time.");
      return;
    }

    const stone: Stone = {
      id: Date.now(),
      offset: aim,
      width: currentWidth,
      color: PALETTE[level % PALETTE.length],
    };
    const next = [...placed, stone];
    setPlaced(next);
    setAim(aim + (Math.random() - 0.5) * 6);
    sfx.chime(392 + level * 55, 0.7, 0.13);
    addScore(4 + level, "rocks");

    if (next.length >= GOAL) {
      setStatus("won");
      sfx.success();
      addScore(25);
      say("Perfect six-stone cairn. The zen garden is impressed.");
    } else {
      say(level === 0 ? "Nice start. Now align the next one with the stone below." : "Solid placement. Steady hands.");
    }
  };

  return (
    <Tile
      title="Zen Rock Stack"
      icon="rocks"
      desc="Drag the stone left or right, then release to drop it."
      action={
        <span className="scoreBadge">
          {placed.length} / {GOAL}
        </span>
      }
      className="rockCard"
      footer={
        <button className="smallBtn" onClick={reset}>
          {status === "aim" ? "Restart" : "Stack again"}
        </button>
      }
    >
      <div className={`rockStage ${dragging ? "dragging" : ""}`} data-state={status}>
        <div className="rockBase" />
        <div className="rockGuide" />

        {placed.map((stone, i) => (
          <div
            key={stone.id}
            className="rock"
            style={{
              left: `calc(50% + ${stone.offset}px)`,
              bottom: `${18 + i * 23}px`,
              width: stone.width,
              height: 21,
              background: `linear-gradient(160deg, ${stone.color}, ${stone.color}aa)`,
              ["--tilt" as string]: `${stone.offset * 0.08}deg`,
            } as React.CSSProperties}
          />
        ))}

        {status === "aim" && (
          <div
            className={`rock current ${dragging ? "dragging" : ""}`}
            style={{
              left: `calc(50% + ${aim}px)`,
              bottom: `${18 + placed.length * 23}px`,
              width: currentWidth,
              height: 21,
              background: `linear-gradient(160deg, ${PALETTE[level % PALETTE.length]}, ${PALETTE[level % PALETTE.length]}aa)`,
            }}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              drag.current = { startX: e.clientX, startAim: aim };
              setDragging(true);
            }}
            onPointerMove={(e) => {
              if (!drag.current) return;
              const delta = e.clientX - drag.current.startX;
              setAim(clamp(drag.current.startAim + delta, -110, 110));
            }}
            onPointerUp={drop}
            onPointerCancel={drop}
            role="slider"
            aria-label="Stone position"
            aria-valuemin={-110}
            aria-valuemax={110}
            aria-valuenow={Math.round(aim)}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft") setAim((v) => clamp(v - 8, -110, 110));
              if (e.key === "ArrowRight") setAim((v) => clamp(v + 8, -110, 110));
              if (e.key === "Enter" || e.key === " ") drop();
            }}
          />
        )}

        {status === "won" && (
          <div className="rockBadge">
            +25 Cairn bonus <Icon name="sparkle" size={12} />
          </div>
        )}
      </div>
      <p className="hint">Small offsets are fine. Big ones make physics sad.</p>
    </Tile>
  );
}
