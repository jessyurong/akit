"use client";

import React from "react";
import { useGame } from "../lib/game";
import Toolbar from "../components/Toolbar";
import BubbleWrap from "../components/toys/BubbleWrap";
import PopIt from "../components/toys/PopIt";
import Balloons from "../components/toys/Balloons";
import Squishy from "../components/toys/Squishy";
import Spinner from "../components/toys/Spinner";
import Frog from "../components/toys/Frog";
import Dice from "../components/toys/Dice";
import Sparkles from "../components/toys/Sparkles";
import SynthPad from "../components/toys/SynthPad";
import KineticSand from "../components/toys/KineticSand";
import KoiPond from "../components/toys/KoiPond";
import RockStack from "../components/toys/RockStack";
import Breathing from "../components/toys/Breathing";
import Ambient from "../components/toys/Ambient";
import Canvas from "../components/toys/Canvas";

const SECTIONS = [
  { id: "instant", label: "🫧 Instant relief" },
  { id: "play", label: "🎮 Play" },
  { id: "calm", label: "🌿 Calm & create" },
];

export default function Home() {
  const { message, stats, happiness, moodLabel, resetAll } = useGame();

  const jump = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main>
      <header>
        <div>
          <div className="badgeRow">
            <span className="eyebrow">Designed for Leah Kate only</span>
          </div>
          <h1>
            Anti-Stress <span>Playground</span>
          </h1>
          <p className="sub">
            A sensory digital retreat. Pop, squish, spin, doodle, breathe, and reset your mind.
          </p>
        </div>

        <div className="headerSide">
          <div className="score">
            <span className="scoreStar" aria-hidden="true">
              ✨
            </span>
            <b>{stats.score.toLocaleString("en-US")}</b>
            <small>serotonin points</small>
            <div className="moodMeter" aria-label={`Mochi is ${moodLabel}, ${happiness} percent happy`}>
              <span style={{ width: `${happiness}%` }} />
            </div>
          </div>
          <Toolbar />
        </div>
      </header>

      <section className="message" aria-live="polite">
        <span className="msgIcon" aria-hidden="true">
          💬
        </span>
        <span className="msgText">{message}</span>
      </section>

      <nav className="sectionNav" aria-label="Jump to a section">
        {SECTIONS.map((s) => (
          <button key={s.id} onClick={() => jump(s.id)}>
            {s.label}
          </button>
        ))}
      </nav>

      <section className="section" id="instant">
        <div className="sectionHead">
          <h2 className="sectionTitle">Instant relief</h2>
          <p className="sectionDesc">Low effort, immediate payoff. Start here.</p>
        </div>
        <div className="grid">
          <BubbleWrap />
          <PopIt />
          <Balloons />
          <Squishy />
          <Spinner />
        </div>
      </section>

      <section className="section" id="play">
        <div className="sectionHead">
          <h2 className="sectionTitle">Play</h2>
          <p className="sectionDesc">Reflexes, luck, noise, and physics.</p>
        </div>
        <div className="grid">
          <Frog />
          <Dice />
          <Sparkles />
          <SynthPad />
          <KineticSand />
          <KoiPond />
          <RockStack />
        </div>
      </section>

      <section className="section" id="calm">
        <div className="sectionHead">
          <h2 className="sectionTitle">Calm &amp; create</h2>
          <p className="sectionDesc">For the days when you need lower volume.</p>
        </div>
        <div className="grid">
          <Breathing />
          <Ambient />
          <Canvas />
        </div>
      </section>

      <footer>
        <button className="bigResetBtn" onClick={resetAll}>
          ↻ Reset everything
        </button>
        <p className="footerText">
          💝 made for Leah Kate · @ by jesy_yuri · install it for offline calm.
        </p>
      </footer>
    </main>
  );
}
