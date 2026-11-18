"use client";

import React, { useState } from "react";
import { useMusic } from "../lib/music/player";
import { TRACKS } from "../lib/music/tracks";
import { sfx } from "../lib/audio/sfx";

function fmt(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function Equalizer({ playing, small = false }: { playing: boolean; small?: boolean }) {
  return (
    <span className={`eq ${small ? "small" : ""}`} data-playing={playing} aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => (
        <i key={i} className="eqBar" style={{ animationDelay: `${i * 0.13}s` }} />
      ))}
    </span>
  );
}

export default function MusicPlayer() {
  const { track, playing, toggle, next, prev, select, seek, progress, duration, volume, setVolume, error } =
    useMusic();
  const [open, setOpen] = useState(false);
  const pct = duration > 0 ? Math.min(1, progress / duration) : 0;

  return (
    <div className={`musicDock ${open ? "open" : ""}`}>
      {open && (
        <div className="musicPanel">
          <div className="musicHead">
            <div
              className="musicArt"
              style={{ background: `linear-gradient(140deg, ${track.gradient[0]}, ${track.gradient[1]})` }}
            >
              {track.emoji}
            </div>
            <div className="musicMeta">
              <strong>{track.title}</strong>
              <span>
                {track.artist} · {track.mood}
              </span>
            </div>
            <button className="iconRound" onClick={() => setOpen(false)} aria-label="Collapse player">
              ▾
            </button>
          </div>

          <div className="eqRow">
            <Equalizer playing={playing} />
            <span className="musicTime">
              {fmt(progress)} / {fmt(duration)}
            </span>
          </div>

          <input
            className="progressRange"
            type="range"
            min={0}
            max={1000}
            value={Math.round(pct * 1000)}
            onChange={(e) => seek(Number(e.target.value) / 1000)}
            aria-label="Seek in track"
          />

          <div className="musicControls">
            <button className="iconRound" onClick={prev} aria-label="Previous track">
              ⏮
            </button>
            <button className="iconRound playRound" onClick={toggle} aria-label={playing ? "Pause" : "Play"}>
              {playing ? "⏸" : "▶"}
            </button>
            <button className="iconRound" onClick={next} aria-label="Next track">
              ⏭
            </button>
            <label className="volSlider">
              <span aria-hidden="true">🔊</span>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(volume * 100)}
                onChange={(e) => setVolume(Number(e.target.value) / 100)}
                aria-label="Music volume"
              />
            </label>
          </div>

          <ul className="trackList">
            {TRACKS.map((t) => (
              <li key={t.id}>
                <button
                  className={t.id === track.id ? "active" : ""}
                  onClick={() => {
                    select(t.id);
                    sfx.click();
                  }}
                  aria-pressed={t.id === track.id}
                >
                  <span
                    className="trackSwatch"
                    style={{ background: `linear-gradient(140deg, ${t.gradient[0]}, ${t.gradient[1]})` }}
                  />
                  <span className="trackName">{t.title}</span>
                  <small>{t.mood}</small>
                </button>
              </li>
            ))}
          </ul>

          {error && <p className="musicError">{error}</p>}
          <p className="musicHint">
            Music keeps playing on your lock screen. Drop your own tracks in <code>public/audio</code>.
          </p>
        </div>
      )}

      <div className="musicPill">
        <button className="pillMain" onClick={toggle} aria-label={playing ? "Pause music" : "Play music"}>
          <Equalizer playing={playing} small />
          <span className="pillText">
            <b>{track.title}</b>
            <small>{playing ? `${track.mood} · playing` : "Tap to start the vibes"}</small>
          </span>
          <span className="pillState" aria-hidden="true">
            {playing ? "⏸" : "▶"}
          </span>
        </button>
        <button className="pillMini" onClick={next} aria-label="Next track">
          ⏭
        </button>
        <button
          className="pillMini"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Close player panel" : "Open player panel"}
          aria-expanded={open}
        >
          {open ? "▾" : "⋯"}
        </button>
      </div>
    </div>
  );
}
