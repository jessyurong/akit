"use client";

import React from "react";
import { GameProvider } from "../lib/game";
import { MusicProvider } from "../lib/music/player";
import { initInstallPrompt } from "../lib/pwa";
import ServiceWorkerRegister from "./pwa/ServiceWorkerRegister";
import OfflineBanner from "./pwa/OfflineBanner";
import Toasts from "./Toasts";
import Mochi from "./Mochi";
import MusicPlayer from "./MusicPlayer";
import ShareCard from "./ShareCard";

// Capture `beforeinstallprompt` as early as possible.
if (typeof window !== "undefined") initInstallPrompt();

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <GameProvider>
      <MusicProvider>
        <ServiceWorkerRegister />
        <OfflineBanner />
        <Toasts />
        {children}
        <Mochi />
        <MusicPlayer />
        <ShareCard />
      </MusicProvider>
    </GameProvider>
  );
}
