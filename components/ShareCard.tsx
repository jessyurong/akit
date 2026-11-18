"use client";

import React, { useEffect, useRef } from "react";
import { Modal } from "./ui";
import { useGame, type Mood } from "../lib/game";
import { sfx } from "../lib/audio/sfx";
import type { ResolvedTheme } from "../lib/theme";

const W = 1080;
const H = 1920;

const PALETTES: Record<
  ResolvedTheme,
  { bg: [string, string]; ink: string; sub: string; accent: string; accent2: string; pill: string }
> = {
  night: {
    bg: ["#0b1022", "#241046"],
    ink: "#f8fafc",
    sub: "#a5b4fc",
    accent: "#a855f7",
    accent2: "#38bdf8",
    pill: "rgba(255,255,255,0.10)",
  },
  dusk: {
    bg: ["#241a3d", "#4c1d53"],
    ink: "#fdf4ff",
    sub: "#e9d5ff",
    accent: "#f0abfc",
    accent2: "#67e8f9",
    pill: "rgba(255,255,255,0.12)",
  },
  day: {
    bg: ["#eef2ff", "#ffffff"],
    ink: "#0f172a",
    sub: "#475569",
    accent: "#7c3aed",
    accent2: "#0284c7",
    pill: "rgba(15,23,42,0.06)",
  },
  dawn: {
    bg: ["#fff1e6", "#ffe4ec"],
    ink: "#3b1d2e",
    sub: "#7c5468",
    accent: "#e11d48",
    accent2: "#d97706",
    pill: "rgba(59,29,46,0.06)",
  },
};

const TOY_LABELS: Record<string, string> = {
  bubbles: "Bubble Wrap",
  popit: "Silicone Pop-It",
  balloons: "Balloon Pop",
  squishy: "Squishy Jelly",
  spinner: "Kinetic Spinner",
  frog: "Pond Hopper",
  dice: "Lucky Dice",
  sparkles: "Sparkle Chaos",
  breathing: "Calm Breathing",
  ambient: "Ambient Mixer",
  canvas: "Zen Canvas",
  synth: "Pocket Synth",
  sand: "Kinetic Sand",
  koi: "Koi Pond",
  rocks: "Zen Rock Stack",
  mochi: "Mochi",
};

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/* Draws the same cartoon strawberry as the in-page pet, with an expression that
   follows the current mood (sleepy / chill / happy / blissful). */
function drawMochi(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, mood: Mood) {
  ctx.save();
  ctx.lineJoin = "round";

  const bodyPath = () => {
    ctx.beginPath();
    ctx.moveTo(cx, cy + r * 1.12);
    ctx.bezierCurveTo(cx - r * 0.56, cy + r * 0.86, cx - r, cy + r * 0.34, cx - r, cy - r * 0.2);
    ctx.bezierCurveTo(cx - r, cy - r * 0.7, cx - r * 0.54, cy - r * 0.98, cx, cy - r * 0.98);
    ctx.bezierCurveTo(cx + r * 0.54, cy - r * 0.98, cx + r, cy - r * 0.7, cx + r, cy - r * 0.2);
    ctx.bezierCurveTo(cx + r, cy + r * 0.34, cx + r * 0.56, cy + r * 0.86, cx, cy + r * 1.12);
    ctx.closePath();
  };

  /* ---------- berry body ---------- */
  const bodyGrad = ctx.createLinearGradient(cx - r * 0.9, cy - r, cx + r * 0.85, cy + r * 1.05);
  bodyGrad.addColorStop(0, "#ff8c9c");
  bodyGrad.addColorStop(0.42, "#f43f52");
  bodyGrad.addColorStop(1, "#cb1c39");

  bodyPath();
  ctx.fillStyle = bodyGrad;
  ctx.fill();
  ctx.strokeStyle = "#96122c";
  ctx.lineWidth = Math.max(2, r * 0.052);
  ctx.stroke();

  // Inner shading + shoulder highlight, clipped to the body.
  ctx.save();
  bodyPath();
  ctx.clip();
  const shade = ctx.createRadialGradient(cx + r * 0.55, cy + r * 0.75, r * 0.1, cx + r * 0.4, cy + r * 0.5, r * 1.25);
  shade.addColorStop(0, "rgba(126,12,36,0.45)");
  shade.addColorStop(1, "rgba(126,12,36,0)");
  ctx.fillStyle = shade;
  ctx.fillRect(cx - r * 1.2, cy - r * 1.2, r * 2.4, r * 2.5);

  ctx.beginPath();
  ctx.ellipse(cx - r * 0.46, cy - r * 0.6, r * 0.27, r * 0.14, -0.55, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.42)";
  ctx.fill();
  ctx.restore();

  /* ---------- gold seeds ---------- */
  const seedRows: [number, number[]][] = [
    [-0.7, [-0.46, -0.15, 0.15, 0.46]],
    [-0.47, [-0.7, -0.33, 0.33, 0.7]],
    [-0.23, [-0.84, 0.84]],
    [0.02, [-0.75, -0.46, 0.46, 0.75]],
    [0.3, [-0.56, -0.28, 0.28, 0.56]],
    [0.58, [-0.33, 0, 0.33]],
    [0.83, [-0.15, 0.15]],
  ];
  ctx.fillStyle = "#ffd45e";
  for (const [sy, xs] of seedRows) {
    for (const sx of xs) {
      ctx.beginPath();
      ctx.ellipse(cx + sx * r, cy + sy * r, r * 0.036, r * 0.055, sx * 0.45, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /* ---------- leafy crown ---------- */
  const leafGrad = ctx.createLinearGradient(cx, cy - r * 0.9, cx, cy - r * 1.6);
  leafGrad.addColorStop(0, "#9df0ad");
  leafGrad.addColorStop(0.55, "#3ecb5e");
  leafGrad.addColorStop(1, "#187a3c");

  const leaves: [number, number, number][] = [
    [-64, 0.42, 0.3],
    [-34, 0.52, 0.36],
    [0, 0.56, 0.4],
    [34, 0.52, 0.36],
    [64, 0.42, 0.3],
  ];
  for (const [deg, len, wid] of leaves) {
    ctx.save();
    ctx.translate(cx, cy - r * 0.86);
    ctx.rotate((deg * Math.PI) / 180);
    const L = r * len;
    const W = r * wid;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-W * 0.72, -L * 0.44, 0, -L);
    ctx.quadraticCurveTo(W * 0.72, -L * 0.44, 0, 0);
    ctx.closePath();
    ctx.fillStyle = leafGrad;
    ctx.fill();
    ctx.strokeStyle = "rgba(9,72,38,0.5)";
    ctx.lineWidth = Math.max(1.5, r * 0.022);
    ctx.stroke();
    // midrib
    ctx.beginPath();
    ctx.moveTo(0, -L * 0.12);
    ctx.lineTo(0, -L * 0.82);
    ctx.strokeStyle = "rgba(255,255,255,0.28)";
    ctx.lineWidth = Math.max(1, r * 0.016);
    ctx.stroke();
    ctx.restore();
  }

  // stem, leaning slightly right
  ctx.save();
  ctx.translate(cx + r * 0.04, cy - r * 0.98);
  ctx.rotate(-0.14);
  const stemGrad = ctx.createLinearGradient(0, 0, 0, -r * 0.42);
  stemGrad.addColorStop(0, "#187a3c");
  stemGrad.addColorStop(1, "#55e086");
  roundRect(ctx, -r * 0.045, -r * 0.42, r * 0.09, r * 0.44, r * 0.045);
  ctx.fillStyle = stemGrad;
  ctx.fill();
  ctx.strokeStyle = "rgba(9,72,38,0.45)";
  ctx.lineWidth = Math.max(1.5, r * 0.02);
  ctx.stroke();
  ctx.restore();

  /* ---------- face ---------- */
  const eyeY = cy - r * 0.13;
  const eyeX = r * 0.355;

  if (mood === "sleepy") {
    // closed, content eyes
    ctx.strokeStyle = "#4a0a1c";
    ctx.lineWidth = Math.max(2, r * 0.042);
    ctx.lineCap = "round";
    for (const dx of [-eyeX, eyeX]) {
      ctx.beginPath();
      ctx.moveTo(cx + dx - r * 0.15, eyeY + r * 0.02);
      ctx.quadraticCurveTo(cx + dx, eyeY + r * 0.12, cx + dx + r * 0.15, eyeY + r * 0.02);
      ctx.stroke();
    }
  } else {
    const squash = mood === "chill" ? 0.88 : 1;
    for (const dx of [-eyeX, eyeX]) {
      ctx.beginPath();
      ctx.ellipse(cx + dx, eyeY, r * 0.19 * squash, r * 0.225 * squash, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.strokeStyle = "rgba(74,10,28,0.18)";
      ctx.lineWidth = Math.max(1, r * 0.012);
      ctx.stroke();

      // glossy navy iris
      const iris = ctx.createRadialGradient(
        cx + dx - r * 0.03,
        eyeY - r * 0.05,
        r * 0.01,
        cx + dx,
        eyeY,
        r * 0.22,
      );
      iris.addColorStop(0, "#3f68bd");
      iris.addColorStop(0.55, "#16244f");
      iris.addColorStop(1, "#0a1128");
      ctx.beginPath();
      ctx.ellipse(cx + dx, eyeY + r * 0.012, r * 0.155 * squash, r * 0.19 * squash, 0, 0, Math.PI * 2);
      ctx.fillStyle = iris;
      ctx.fill();

      // two highlights
      ctx.beginPath();
      ctx.arc(cx + dx - r * 0.06, eyeY - r * 0.07, r * 0.052, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.98)";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx + dx + r * 0.055, eyeY + r * 0.075, r * 0.026, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.fill();
    }
  }

  // blush
  const blushAlpha = mood === "blissful" ? 0.95 : mood === "happy" ? 0.8 : mood === "chill" ? 0.62 : 0.4;
  for (const dx of [-r * 0.6, r * 0.6]) {
    const bx = cx + dx;
    const by = cy + r * 0.26;
    const blush = ctx.createRadialGradient(bx, by, 0, bx, by, r * 0.24);
    blush.addColorStop(0, `rgba(255,138,166,${blushAlpha})`);
    blush.addColorStop(0.6, `rgba(255,157,178,${blushAlpha * 0.55})`);
    blush.addColorStop(1, "rgba(255,157,178,0)");
    ctx.beginPath();
    ctx.ellipse(bx, by, r * 0.23, r * 0.125, 0, 0, Math.PI * 2);
    ctx.fillStyle = blush;
    ctx.fill();
  }

  // mouth
  const mouthY = cy + r * 0.25;
  ctx.strokeStyle = "#4a0a1c";
  ctx.lineCap = "round";
  ctx.lineWidth = Math.max(2, r * 0.05);

  if (mood === "blissful") {
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.225, mouthY - r * 0.03);
    ctx.quadraticCurveTo(cx, mouthY + r * 0.36, cx + r * 0.225, mouthY - r * 0.03);
    ctx.quadraticCurveTo(cx, mouthY + r * 0.06, cx - r * 0.225, mouthY - r * 0.03);
    ctx.closePath();
    ctx.fillStyle = "#5b0a1e";
    ctx.fill();

    ctx.save();
    ctx.clip();
    ctx.beginPath();
    ctx.ellipse(cx, mouthY + r * 0.235, r * 0.105, r * 0.062, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#ff8aa6";
    ctx.fill();
    ctx.restore();
  } else if (mood === "sleepy") {
    ctx.lineWidth = Math.max(2, r * 0.038);
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.08, mouthY);
    ctx.quadraticCurveTo(cx, mouthY + r * 0.06, cx + r * 0.08, mouthY);
    ctx.stroke();
  } else {
    const mr = mood === "chill" ? r * 0.14 : r * 0.175;
    ctx.beginPath();
    ctx.arc(cx, mouthY - r * 0.02, mr, 0.22, Math.PI - 0.22);
    ctx.stroke();
  }

  ctx.restore();
}

export default function ShareCard() {
  const { shareOpen, setShareOpen, stats, happiness, mood, moodLabel, resolvedTheme, pushToast } = useGame();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!shareOpen) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const p = PALETTES[resolvedTheme];
    canvas.width = W;
    canvas.height = H;

    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, p.bg[0]);
    bg.addColorStop(1, p.bg[1]);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // ambient glows
    for (const [x, y, r, color] of [
      [W * 0.15, H * 0.18, 420, p.accent],
      [W * 0.9, H * 0.42, 360, p.accent2],
      [W * 0.35, H * 0.88, 480, p.accent],
    ] as const) {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `${color}55`);
      g.addColorStop(1, `${color}00`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }

    // floating bubbles
    for (let i = 0; i < 26; i++) {
      const x = ((i * 137) % W + 60) % W;
      const y = ((i * 311) % H + 120) % H;
      const r = 6 + ((i * 17) % 26);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.strokeStyle = `${p.accent2}44`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // frame
    roundRect(ctx, 48, 48, W - 96, H - 96, 64);
    ctx.strokeStyle = `${p.ink}22`;
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.textAlign = "center";

    // brand
    ctx.fillStyle = p.sub;
    ctx.font = "700 30px Inter, system-ui, sans-serif";
    ctx.letterSpacing = "10px";
    ctx.fillText("ANTI-STRESS PLAYGROUND", W / 2, 190);
    ctx.letterSpacing = "0px";

    // headline
    ctx.fillStyle = p.ink;
    ctx.font = "900 76px Inter, system-ui, sans-serif";
    ctx.fillText("Today I chose", W / 2, 330);
    ctx.fillText("calm.", W / 2, 420);

    // mochi
    drawMochi(ctx, W / 2, 690, 168, mood);

    // score
    const score = stats.score.toLocaleString("en-US");
    const scoreGrad = ctx.createLinearGradient(W * 0.2, 0, W * 0.8, 0);
    scoreGrad.addColorStop(0, p.accent);
    scoreGrad.addColorStop(1, p.accent2);
    ctx.fillStyle = scoreGrad;
    ctx.font = "900 220px Inter, system-ui, sans-serif";
    ctx.fillText(score, W / 2, 1120);

    ctx.fillStyle = p.sub;
    ctx.font = "600 42px Inter, system-ui, sans-serif";
    ctx.fillText("serotonin points collected", W / 2, 1190);

    // mood pill
    const pillW = 420;
    roundRect(ctx, W / 2 - pillW / 2, 1260, pillW, 96, 48);
    ctx.fillStyle = p.pill;
    ctx.fill();
    ctx.fillStyle = p.ink;
    ctx.font = "700 38px Inter, system-ui, sans-serif";
    ctx.fillText(`Mochi is ${moodLabel.toLowerCase()} · ${happiness}%`, W / 2, 1322);

    // stats row
    const favorite =
      Object.entries(stats.plays)
        .filter(([, n]) => n > 0)
        .sort((a, b) => b[1] - a[1])
        .map(([id]) => TOY_LABELS[id] ?? id)[0] ?? "just vibing";

    ctx.fillStyle = p.sub;
    ctx.font = "600 36px Inter, system-ui, sans-serif";
    ctx.fillText(`Most played: ${favorite}`, W / 2, 1440);
    ctx.fillText(`${stats.plays.breathing ?? 0} breathing sessions · ${stats.plays.canvas ?? 0} doodles`, W / 2, 1500);

    // date
    ctx.fillStyle = p.ink;
    ctx.font = "700 34px Inter, system-ui, sans-serif";
    const date = new Date().toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" });
    ctx.fillText(date, W / 2, 1720);

    // footer
    ctx.fillStyle = p.sub;
    ctx.font = "600 28px Inter, system-ui, sans-serif";
    ctx.fillText("@ by jesy_yuri · a tiny digital retreat", W / 2, 1800);
    ctx.letterSpacing = "6px";
    ctx.font = "700 24px Inter, system-ui, sans-serif";
    ctx.fillText("POP · SQUISH · BREATHE · REPEAT", W / 2, 1852);
    ctx.letterSpacing = "0px";
  }, [shareOpen, stats, happiness, mood, moodLabel, resolvedTheme]);

  const share = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    sfx.success();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) return;

    const file = new File([blob], "anti-stress-card.png", { type: "image/png" });
    const text = `I collected ${stats.score} serotonin points in the Anti-Stress Playground 🫧`;

    if (typeof navigator !== "undefined" && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: "My calm card", text });
        return;
      } catch {
        /* user cancelled — fall through to download */
      }
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "anti-stress-card.png";
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 4000);
    pushToast("Card saved to your downloads 📸", "✅");
  };

  return (
    <Modal open={shareOpen} onClose={() => setShareOpen(false)} title="Your calm card" className="shareModal">
      <p className="modalText">A little proof that you took a break today. Share it or keep it.</p>
      <div className="sharePreview">
        <canvas ref={canvasRef} className="shareCanvas" aria-label="Preview of your shareable calm card" />
      </div>
      <div className="shareActions">
        <button className="primaryBtn" onClick={share}>
          📤 Share card
        </button>
        <button className="smallBtn" onClick={() => setShareOpen(false)}>
          Close
        </button>
      </div>
    </Modal>
  );
}
