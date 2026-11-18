"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Tile } from "../ui";
import { useGame } from "../../lib/game";
import { sfx } from "../../lib/audio/sfx";

const COLORS = ["#a855f7", "#ec4899", "#38bdf8", "#22c55e", "#f59e0b", "#ffffff"];

export default function Canvas() {
  const { say, addScore, bump, resetToken } = useGame();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const [color, setColor] = useState(COLORS[0]);
  const [size, setSize] = useState(6);
  const [eraser, setEraser] = useState(false);

  const paint = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.lineTo(x, y);
    ctx.stroke();
  }, []);

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    // Preserve whatever is already drawn across resizes / rotation.
    const snapshot = document.createElement("canvas");
    snapshot.width = canvas.width;
    snapshot.height = canvas.height;
    const sctx = snapshot.getContext("2d");
    if (sctx && canvas.width > 0) sctx.drawImage(canvas, 0, 0);

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (snapshot.width > 0) {
      ctx.drawImage(snapshot, 0, 0, snapshot.width / dpr, snapshot.height / dpr);
    }
  }, []);

  useEffect(() => {
    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("orientationchange", resize);
    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("orientationchange", resize);
    };
  }, [resize]);

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    sfx.pop(1.3);
    say("Canvas cleared! Fresh slate for your creativity.");
  };

  useEffect(() => {
    if (resetToken > 0) clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetToken]);

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const down = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const ctx = e.currentTarget.getContext("2d");
    if (!ctx) return;
    drawing.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    const { x, y } = pos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = size;
    ctx.strokeStyle = color;
    ctx.globalCompositeOperation = eraser ? "destination-out" : "source-over";
  };

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = e.currentTarget.getContext("2d");
    if (!ctx) return;
    const { x, y } = pos(e);
    paint(ctx, x, y);
  };

  const up = () => {
    if (!drawing.current) return;
    drawing.current = false;
    bump("doodles");
    addScore(1, "canvas");
  };

  return (
    <Tile
      title="🖌️ Zen Canvas"
      desc="Finger paint freely. No mistakes here, only happy little lines."
      wide
      className="doodleCard"
      action={
        <div className="canvasControls">
          <div className="colorPalette" role="group" aria-label="Brush colour">
            {COLORS.map((c) => (
              <button
                key={c}
                className={`colorDot ${color === c && !eraser ? "selected" : ""}`}
                style={{ backgroundColor: c }}
                onClick={() => {
                  setColor(c);
                  setEraser(false);
                }}
                aria-label={`Use colour ${c}`}
                aria-pressed={color === c && !eraser}
              />
            ))}
          </div>
          <div className="toolBtns">
            <button
              className={`smallBtn ${eraser ? "activeTool" : ""}`}
              onClick={() => setEraser((v) => !v)}
              aria-pressed={eraser}
            >
              🧹 {eraser ? "Eraser on" : "Eraser"}
            </button>
            <button className="smallBtn" onClick={() => setSize((s) => (s === 4 ? 8 : s === 8 ? 16 : 4))}>
              Size {size}px
            </button>
            <button className="smallBtn" onClick={clear}>
              Clear
            </button>
          </div>
        </div>
      }
      footer={<span className="hintInline">Tip: works with a finger, stylus, or mouse.</span>}
    >
      <canvas
        ref={canvasRef}
        className="paintCanvas"
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onPointerLeave={up}
        aria-label="Drawing canvas. Draw with a finger, stylus, or mouse."
      />
    </Tile>
  );
}
