"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Tile } from "../ui";
import { useGame } from "../../lib/game";
import { sfx } from "../../lib/audio/sfx";

interface Grain {
  x: number;
  y: number;
  vx: number;
  vy: number;
  c: number;
}

const GRAINS = 900;
const COLORS = ["#a78bfa", "#8b5cf6", "#38bdf8", "#7dd3fc", "#c4b5fd"];

export default function KineticSand() {
  const { say, addScore } = useGame();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const grains = useRef<Grain[]>([]);
  const size = useRef({ w: 0, h: 0 });
  const pointer = useRef({ x: -999, y: -999, down: false });
  const [moved, setMoved] = useState(false);

  const seed = useCallback((w: number, h: number) => {
    const ground = h - 6;
    const list: Grain[] = [];
    for (let i = 0; i < GRAINS; i++) {
      const t = Math.random();
      const spread = Math.pow(t, 0.6);
      const x = w / 2 + (Math.random() - 0.5) * w * 0.9 * spread;
      const heap = h * 0.44 * (1 - Math.abs(x - w / 2) / (w * 0.62));
      const y = ground - Math.random() * Math.max(12, heap);
      list.push({
        x: Math.max(2, Math.min(w - 2, x)),
        y: Math.max(4, Math.min(ground, y)),
        vx: 0,
        vy: 0,
        c: Math.floor(Math.random() * COLORS.length),
      });
    }
    grains.current = list;
  }, []);

  const prepare = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    size.current = { w: rect.width, h: rect.height };
    seed(rect.width, rect.height);
  }, [seed]);

  useEffect(() => {
    prepare();
    window.addEventListener("resize", prepare);
    return () => window.removeEventListener("resize", prepare);
  }, [prepare]);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();

    const loop = (time: number) => {
      const dt = Math.min(32, time - last) / 16.67;
      last = time;

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      const { w, h } = size.current;
      if (ctx && w > 0) {
        ctx.clearRect(0, 0, w, h);
        const ground = h - 6;
        const p = pointer.current;
        const radius = p.down ? 70 : 46;

        for (const g of grains.current) {
          g.vy += 0.22 * dt;
          g.x += g.vx * dt;
          g.y += g.vy * dt;
          g.vx *= Math.pow(0.9, dt);
          g.vy *= Math.pow(0.92, dt);

          const dx = g.x - p.x;
          const dy = g.y - p.y;
          const dist2 = dx * dx + dy * dy;
          if (dist2 < radius * radius) {
            const dist = Math.sqrt(dist2) || 1;
            const force = (1 - dist / radius) * (p.down ? 7 : 2.4) * dt;
            g.vx += (dx / dist) * force;
            g.vy += (dy / dist) * force * 0.6;
          }

          if (g.y > ground) {
            g.y = ground;
            if (g.vy > 0.4) g.vy *= -0.22;
            g.vx *= 0.82;
          }
          if (g.y < 2) {
            g.y = 2;
            g.vy = Math.abs(g.vy) * 0.2;
          }
          if (g.x < 2) {
            g.x = 2;
            g.vx = Math.abs(g.vx) * 0.3;
          } else if (g.x > w - 2) {
            g.x = w - 2;
            g.vx = -Math.abs(g.vx) * 0.3;
          }

          ctx.fillStyle = COLORS[g.c];
          ctx.fillRect(g.x, g.y, 2.4, 2.4);
        }
      }
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const toLocal = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  return (
    <Tile
      title="🏖️ Kinetic Sand"
      desc="Drag through the grains. It flows, piles, and settles — no cleanup."
      action={
        <button
          className="smallBtn"
          onClick={() => {
            seed(size.current.w, size.current.h);
            sfx.whoosh();
            say("Sand raked smooth. Deep breath. Again?");
          }}
        >
          Smooth
        </button>
      }
      className="sandCard"
      footer={<span>{moved ? "900 grains, zero mess" : "Try tracing a circle in the sand"}</span>}
    >
      <canvas
        ref={canvasRef}
        className="sandCanvas"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          pointer.current = { ...toLocal(e), down: true };
          setMoved(true);
          addScore(1, "sand");
          sfx.pop(0.7);
        }}
        onPointerMove={(e) => {
          const { x, y } = toLocal(e);
          pointer.current.x = x;
          pointer.current.y = y;
        }}
        onPointerUp={() => {
          pointer.current.down = false;
        }}
        onPointerCancel={() => {
          pointer.current.down = false;
        }}
        onPointerLeave={() => {
          pointer.current.down = false;
          pointer.current.x = -999;
          pointer.current.y = -999;
        }}
        aria-label="Kinetic sand. Drag to move the grains."
      />
    </Tile>
  );
}
