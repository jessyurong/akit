"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Tile } from "../ui";
import { useGame } from "../../lib/game";
import { sfx } from "../../lib/audio/sfx";

interface Koi {
  x: number;
  y: number;
  angle: number;
  speed: number;
  size: number;
  color: string;
  patch: string;
  phase: number;
  tx: number | null;
  ty: number | null;
}

interface Ripple {
  x: number;
  y: number;
  born: number;
  color: string;
}

const KOI_COLORS = [
  { body: "#fb7185", patch: "#fff1f2" },
  { body: "#fbbf24", patch: "#fff7ed" },
  { body: "#f8fafc", patch: "#f97316" },
];

export default function KoiPond() {
  const { say, addScore } = useGame();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const koi = useRef<Koi[]>([]);
  const ripples = useRef<Ripple[]>([]);
  const size = useRef({ w: 0, h: 0 });
  const [taps, setTaps] = useState(0);

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
    const prev = size.current;
    size.current = { w: rect.width, h: rect.height };

    if (koi.current.length === 0) {
      koi.current = KOI_COLORS.map((c, i) => ({
        x: rect.width * (0.28 + i * 0.22),
        y: rect.height * (0.4 + (i % 2) * 0.2),
        angle: Math.random() * Math.PI * 2,
        speed: 0.35 + i * 0.07,
        size: 15 - i * 1.6,
        color: c.body,
        patch: c.patch,
        phase: Math.random() * Math.PI * 2,
        tx: null,
        ty: null,
      }));
    } else if (prev.w > 0) {
      for (const k of koi.current) {
        k.x = Math.min(rect.width - 10, Math.max(10, k.x));
        k.y = Math.min(rect.height - 10, Math.max(10, k.y));
      }
    }
  }, []);

  useEffect(() => {
    prepare();
    window.addEventListener("resize", prepare);
    return () => window.removeEventListener("resize", prepare);
  }, [prepare]);

  useEffect(() => {
    let raf = 0;

    const loop = (time: number) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      const { w, h } = size.current;
      if (!ctx || !w) {
        raf = requestAnimationFrame(loop);
        return;
      }
      ctx.clearRect(0, 0, w, h);

      // Lily pads, drawn first so fish swim over them.
      const pads = [
        { x: w * 0.16, y: h * 0.26, r: 20 },
        { x: w * 0.82, y: h * 0.7, r: 26 },
        { x: w * 0.56, y: h * 0.16, r: 14 },
      ];
      for (const pad of pads) {
        ctx.beginPath();
        ctx.arc(pad.x, pad.y, pad.r, 0.35, Math.PI * 2 - 0.35);
        ctx.fillStyle = "rgba(52, 211, 153, 0.16)";
        ctx.fill();
        ctx.strokeStyle = "rgba(52, 211, 153, 0.3)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Expanding ripples.
      for (let i = ripples.current.length - 1; i >= 0; i--) {
        const r = ripples.current[i];
        const age = (time - r.born) / 1000;
        if (age > 2.4) {
          ripples.current.splice(i, 1);
          continue;
        }
        const radius = 6 + age * 42;
        const alpha = Math.max(0, 0.45 * (1 - age / 2.4));
        ctx.beginPath();
        ctx.arc(r.x, r.y, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(186, 230, 253, ${alpha})`;
        ctx.lineWidth = 1.4;
        ctx.stroke();
      }

      for (const k of koi.current) {
        if (k.tx !== null && k.ty !== null) {
          const dx = k.tx - k.x;
          const dy = k.ty - k.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 24) {
            k.tx = null;
            k.ty = null;
          } else {
            const desired = Math.atan2(dy, dx);
            let diff = desired - k.angle;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            k.angle += diff * 0.045;
          }
        } else {
          k.angle += Math.sin(time * 0.0009 + k.phase) * 0.012;
        }

        k.x += Math.cos(k.angle) * k.speed;
        k.y += Math.sin(k.angle) * k.speed;

        if (k.x < 18 || k.x > w - 18) {
          k.angle = Math.PI - k.angle;
          k.x = Math.min(w - 18, Math.max(18, k.x));
        }
        if (k.y < 16 || k.y > h - 16) {
          k.angle = -k.angle;
          k.y = Math.min(h - 16, Math.max(16, k.y));
        }

        const wobble = Math.sin(time * 0.006 + k.phase) * k.size * 0.22;

        ctx.save();
        ctx.translate(k.x, k.y);
        ctx.rotate(k.angle);
        ctx.globalAlpha = 0.95;

        // tail
        ctx.beginPath();
        ctx.moveTo(-k.size * 0.8, 0);
        ctx.lineTo(-k.size * 1.7, -k.size * 0.55 + wobble * 0.4);
        ctx.lineTo(-k.size * 1.7, k.size * 0.55 + wobble * 0.4);
        ctx.closePath();
        ctx.fillStyle = k.color;
        ctx.fill();

        // body
        ctx.beginPath();
        ctx.ellipse(0, 0, k.size, k.size * 0.46, 0, 0, Math.PI * 2);
        ctx.fillStyle = k.color;
        ctx.fill();

        // patch
        ctx.beginPath();
        ctx.ellipse(k.size * 0.1, -k.size * 0.08, k.size * 0.42, k.size * 0.22, 0.2, 0, Math.PI * 2);
        ctx.fillStyle = k.patch;
        ctx.globalAlpha = 0.85;
        ctx.fill();
        ctx.globalAlpha = 0.95;

        // eye
        ctx.beginPath();
        ctx.arc(k.size * 0.62, -k.size * 0.1, 1.6, 0, Math.PI * 2);
        ctx.fillStyle = "#0b1220";
        ctx.fill();

        ctx.restore();
      }

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const splash = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ripples.current.push({ x, y, born: performance.now(), color: "#bae6fd" });
    ripples.current.push({ x, y, born: performance.now() - 260, color: "#e0f2fe" });
    koi.current.forEach((k, i) => {
      k.tx = x + (i - 1) * 14;
      k.ty = y + (i % 2 === 0 ? 10 : -10);
    });
    setTaps((n) => n + 1);
    addScore(1, "koi");
    sfx.chime(660 + Math.random() * 220, 0.5, 0.06);
    if (taps === 0) say("The koi heard you. Tap again — they're curious little fish.");
  };

  return (
    <Tile
      title="Koi Pond"
      icon="koi"
      desc="Tap the water. Ripples spread, koi come to investigate."
      className="koiCard"
      footer={<span>{taps === 0 ? "Yes, the fish are real (enough)" : `${taps} ripples made`}</span>}
    >
      <canvas ref={canvasRef} className="koiCanvas" onPointerDown={splash} aria-label="Koi pond. Tap to make ripples." />
    </Tile>
  );
}
