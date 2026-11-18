"use client";

import React, { useEffect, useState } from "react";
import { useGame } from "../lib/game";
import { sfx, haptics } from "../lib/audio/sfx";
import { THEME_EMOJI, THEME_LABELS, type ThemeName } from "../lib/theme";
import { Modal } from "./ui";
import {
  installChangeEvent,
  isInstallable,
  isIOS,
  isStandalone,
  promptInstall,
} from "../lib/pwa";

const THEMES: ThemeName[] = ["auto", "dawn", "day", "dusk", "night"];

function InstallButton() {
  const { pushToast, setShareOpen } = useGame();
  const [installable, setInstallable] = useState(false);
  const [ios, setIos] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [hint, setHint] = useState(false);

  useEffect(() => {
    const sync = () => setInstallable(isInstallable());
    sync();
    setIos(isIOS());
    setStandalone(isStandalone());
    const onInstalled = () => {
      setStandalone(true);
      pushToast("Installed! Look for the playground on your home screen.", "📲");
    };
    window.addEventListener(installChangeEvent(), sync);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener(installChangeEvent(), sync);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [pushToast]);

  if (standalone) return null;
  if (!installable && !ios) return null;

  return (
    <>
      <button
        className="iconBtn installBtn"
        onClick={async () => {
          if (installable) {
            const ok = await promptInstall();
            if (!ok) pushToast("No pressure — the browser menu always works too.", "📲");
          } else {
            setHint(true);
          }
        }}
        aria-label="Install this app"
        title="Install app"
      >
        📲
      </button>
      <Modal open={hint} onClose={() => setHint(false)} title="Add to home screen">
        <ol className="steps">
          <li>
            Tap the <b>Share</b> button in Safari&apos;s toolbar.
          </li>
          <li>
            Scroll down and choose <b>Add to Home Screen</b>.
          </li>
          <li>Tap <b>Add</b> — the playground opens full screen, offline-ready.</li>
        </ol>
        <div className="shareActions">
          <button className="primaryBtn" onClick={() => setHint(false)}>
            Got it
          </button>
          <button
            className="smallBtn"
            onClick={() => {
              setHint(false);
              setShareOpen(true);
            }}
          >
            Share my card instead
          </button>
        </div>
      </Modal>
    </>
  );
}

export default function Toolbar() {
  const { settings, updateSettings, setShareOpen, pushToast } = useGame();
  const [themeOpen, setThemeOpen] = useState(false);

  return (
    <div className="toolbar">
      <button
        className={`iconBtn ${settings.soundOn ? "active" : ""}`}
        onClick={() => {
          const next = !settings.soundOn;
          updateSettings({ soundOn: next });
          if (next) window.setTimeout(() => sfx.click(), 60);
          pushToast(next ? "Sound effects on" : "Sound effects muted", next ? "🔊" : "🔇");
        }}
        aria-pressed={settings.soundOn}
        title={settings.soundOn ? "Mute sound effects" : "Enable sound effects"}
      >
        {settings.soundOn ? "🔊" : "🔇"}
      </button>

      <button
        className={`iconBtn ${settings.hapticsOn ? "active" : ""}`}
        onClick={() => {
          const next = !settings.hapticsOn;
          updateSettings({ hapticsOn: next });
          if (next) {
            haptics.enabled = true;
            haptics.pulse([12, 40, 12]);
          }
          pushToast(next ? "Haptics on" : "Haptics off", "📳");
        }}
        aria-pressed={settings.hapticsOn}
        title="Haptic feedback (mobile)"
      >
        📳
      </button>

      <div className="themeWrap">
        <button
          className="iconBtn"
          onClick={() => setThemeOpen((v) => !v)}
          aria-expanded={themeOpen}
          aria-haspopup="menu"
          title="Change theme"
        >
          {THEME_EMOJI[settings.theme]}
        </button>
        {themeOpen && (
          <>
            <button className="menuScrim" onClick={() => setThemeOpen(false)} aria-label="Close theme menu" />
            <div className="themeMenu" role="menu">
              {THEMES.map((t) => (
                <button
                  key={t}
                  role="menuitemradio"
                  aria-checked={settings.theme === t}
                  className={settings.theme === t ? "active" : ""}
                  onClick={() => {
                    updateSettings({ theme: t });
                    setThemeOpen(false);
                    sfx.click();
                    pushToast(`Theme: ${THEME_LABELS[t]}`, THEME_EMOJI[t]);
                  }}
                >
                  <span>{THEME_EMOJI[t]}</span>
                  {THEME_LABELS[t]}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <button className="iconBtn" onClick={() => setShareOpen(true)} aria-label="Share my calm card" title="Share card">
        📸
      </button>

      <InstallButton />
    </div>
  );
}
