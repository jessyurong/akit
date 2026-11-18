"use client";

import React from "react";
import { useGame } from "../lib/game";
import { Icon } from "./icons";

export default function Toasts() {
  const { toasts } = useGame();
  if (toasts.length === 0) return null;
  return (
    <div className="toastStack" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="toast">
          <span className="toastIcon">
            <Icon name={t.icon} size={16} />
          </span>
          <span>{t.text}</span>
        </div>
      ))}
    </div>
  );
}
