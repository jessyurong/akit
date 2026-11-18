"use client";

import React, { useEffect } from "react";

export function Tile({
  title,
  desc,
  action,
  footer,
  className = "",
  id,
  wide,
  children,
}: {
  title: string;
  desc?: string;
  action?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  id?: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <article id={id} className={`card ${wide ? "wide" : ""} ${className}`}>
      <div className="cardHead">
        <h2>{title}</h2>
        {action}
      </div>
      {desc ? <p className="cardDesc">{desc}</p> : null}
      {children}
      {footer ? <div className="cardFooter">{footer}</div> : null}
    </article>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  className = "",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modalBackdrop" onClick={onClose} role="presentation">
      <div
        className={`modal ${className}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modalHead">
          <h3>{title}</h3>
          <button className="iconRound" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
