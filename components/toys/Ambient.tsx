"use client";

import React, { useEffect, useState } from "react";
import { Tile } from "../ui";
import { useGame } from "../../lib/game";
import { ambient, AMBIENT_DEFS, type AmbientId } from "../../lib/audio/ambient";
import { sfx } from "../../lib/audio/sfx";

export default function Ambient() {
  const { say, addScore, settings, updateSettings, resetToken, pushToast } = useGame();
  const [active, setActive] = useState<AmbientId[]>([]);

  useEffect(() => {
    if (resetToken > 0) {
      ambient.stopAll();
      setActive([]);
    }
  }, [resetToken]);

  useEffect(() => () => ambient.stopAll(), []);

  const toggle = (id: AmbientId) => {
    const on = ambient.toggle(id);
    setActive(ambient.activeIds());
    addScore(1, "ambient");

    if (on) {
      sfx.click();
      const def = AMBIENT_DEFS.find((d) => d.id === id);
      say(`${def?.emoji ?? "🎵"} ${def?.label ?? "Ambient"} layer added. Stack more for a full soundscape.`);
      if (ambient.activeIds().length === 2) {
        pushToast("Ambient layers stack — try rain + fireplace 🔥", "🎧");
      }
    } else {
      say("Layer removed. Silence is also a valid soundscape.");
    }
  };

  return (
    <Tile
      title="🎵 Ambient Mixer"
      desc="Stack real-time soundscapes. Blend as many as you like."
      action={<span className="scoreBadge">{active.length} on</span>}
      className="ambientCard"
      footer={
        <label className="miniSlider">
          <span>Volume</span>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(settings.ambientVolume * 100)}
            onChange={(e) => updateSettings({ ambientVolume: Number(e.target.value) / 100 })}
            aria-label="Ambient volume"
          />
        </label>
      }
    >
      <div className="ambientButtons">
        {AMBIENT_DEFS.map((def) => {
          const on = active.includes(def.id);
          return (
            <button
              key={def.id}
              className={`ambientBtn ${on ? "active" : ""}`}
              onClick={() => toggle(def.id)}
              aria-pressed={on}
              title={def.hint}
            >
              <span>{def.emoji}</span>
              {def.label}
              <span className="ambientDot" data-on={on} />
            </button>
          );
        })}
      </div>
    </Tile>
  );
}
