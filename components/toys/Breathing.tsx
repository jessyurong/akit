"use client";

import React, { useEffect, useRef, useState } from "react";
import { Tile } from "../ui";
import { Icon } from "../icons";
import { useGame } from "../../lib/game";
import { sfx } from "../../lib/audio/sfx";

type Phase = "Inhale" | "Hold" | "Exhale" | "Rest";

const PLAN: Record<Phase, { seconds: number; next: Phase; tone: number; cue: string }> = {
  Inhale: { seconds: 4, next: "Hold", tone: 440, cue: "Inhale gently through your nose..." },
  Hold: { seconds: 4, next: "Exhale", tone: 523.25, cue: "Hold softly. Feel the stillness..." },
  Exhale: { seconds: 4, next: "Rest", tone: 392, cue: "Exhale slowly through your mouth. Let it all out..." },
  Rest: { seconds: 2, next: "Inhale", tone: 329.63, cue: "Rest and reset. You're doing great." },
};

export default function Breathing() {
  const { say, addScore, bump, setCalm, resetToken, stats } = useGame();
  const [active, setActive] = useState(false);
  const [phase, setPhase] = useState<Phase>("Inhale");
  const [timer, setTimer] = useState(4);
  const interval = useRef<number | null>(null);
  const cycles = stats.plays.breathing ?? 0;

  const stop = (message?: string) => {
    if (interval.current) window.clearInterval(interval.current);
    interval.current = null;
    setActive(false);
    setPhase("Inhale");
    setTimer(4);
    setCalm(false);
    if (message) say(message);
  };

  useEffect(() => {
    if (resetToken > 0) stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetToken]);

  useEffect(() => {
    return () => {
      if (interval.current) window.clearInterval(interval.current);
      setCalm(false);
    };
  }, [setCalm]);

  const start = () => {
    if (active) {
      stop("Breathing paused. Come back whenever you're ready.");
      return;
    }

    setActive(true);
    setCalm(true);
    setPhase("Inhale");
    setTimer(4);
    sfx.chime(440, 1.4, 0.16);
    say("Mindful breathing: inhale gently through your nose...");

    let current: Phase = "Inhale";
    let remaining = 4;
    addScore(0, "breathing");

    interval.current = window.setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        const plan = PLAN[current];
        current = plan.next;
        remaining = PLAN[current].seconds;
        setPhase(current);
        sfx.chime(PLAN[current].tone, 1.2, 0.13);
        say(`${PLAN[current].cue}`);
        if (current === "Inhale") {
          bump("breaths");
          addScore(2, "breathing");
        }
      }
      setTimer(remaining);
    }, 1000);
  };

  return (
    <Tile
      title="4-4-4 Calm Breathing"
      icon="breath"
      desc="Follow the glowing orb for a nervous system reset."
      action={<span className="phaseBadge">{active ? phase : "Ready"}</span>}
      footer={<span>{cycles} cycles completed · 1 cycle ≈ 14s</span>}
      className="breathingCard"
    >
      <div className="breathOrbContainer">
        <div className={`breathOrb ${active ? `breathing-${phase.toLowerCase()}` : ""}`}>
          <span className="orbIcon">
            <Icon name="leaf" size={22} />
          </span>
          {active && <span className="orbTimer">{timer}s</span>}
        </div>
      </div>
      <button className={`breathActionBtn ${active ? "stopBtn" : ""}`} onClick={start}>
        {active ? "Stop exercise" : "Start guided cycle"}
      </button>
    </Tile>
  );
}
