import React from "react";

/**
 * Hand-drawn icon set.
 *
 * Everything is a 24x24 stroke icon that inherits `currentColor`, so the same
 * glyph works in every theme. No emoji, no image requests.
 */

export type IconName =
  | "sparkle"
  | "star"
  | "gamepad"
  | "leaf"
  | "install"
  | "volume"
  | "mute"
  | "vibrate"
  | "theme"
  | "camera"
  | "prev"
  | "play"
  | "pause"
  | "next"
  | "offline"
  | "refresh"
  | "bubble"
  | "popit"
  | "balloon"
  | "jelly"
  | "spinner"
  | "frog"
  | "dice"
  | "breath"
  | "mixer"
  | "brush"
  | "eraser"
  | "synth"
  | "drum"
  | "koi"
  | "rocks"
  | "heart"
  | "rain"
  | "waves"
  | "bowl"
  | "fire"
  | "cricket"
  | "island"
  | "moon"
  | "sun"
  | "sunrise"
  | "sunset"
  | "check"
  | "share"
  | "message"
  | "mochi";

const ICONS: Record<IconName, React.ReactNode> = {
  sparkle: (
    <>
      <path d="M12 3.5l2.1 5.4 5.4 2.1-5.4 2.1L12 18.5l-2.1-5.4L4.5 11l5.4-2.1z" />
      <path d="M18.5 17.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z" />
    </>
  ),
  star: (
    <path d="M12 3.8l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.6 9.9l5.8-.8z" />
  ),
  gamepad: (
    <>
      <rect x="2.6" y="7.4" width="18.8" height="9.6" rx="4.4" />
      <path d="M7.4 10.6v3.2M5.8 12.2h3.2" />
      <circle cx="16" cy="11.2" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="18" cy="13.4" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
  leaf: (
    <>
      <path d="M20 4C11.5 4 4.6 8.2 4.6 15.4c0 1.7.5 3.2 1.3 4.4C7.6 12.4 13 8.7 19.6 7.6" />
      <path d="M4.6 19.9c6.7.6 14.2-3.1 15.4-15.9" />
    </>
  ),
  install: (
    <>
      <path d="M12 4v10" />
      <path d="M8 10.6l4 4 4-4" />
      <path d="M4.5 16.5v2a1.5 1.5 0 001.5 1.5h12a1.5 1.5 0 001.5-1.5v-2" />
    </>
  ),
  volume: (
    <>
      <path d="M4 10v4h3l4.2 3.4V6.6L7 10z" />
      <path d="M15.4 9.2a4 4 0 010 5.6" />
      <path d="M18 6.6a7.6 7.6 0 010 10.8" />
    </>
  ),
  mute: (
    <>
      <path d="M4 10v4h3l4.2 3.4V6.6L7 10z" />
      <path d="M16 9.8l4.4 4.4M20.4 9.8L16 14.2" />
    </>
  ),
  vibrate: (
    <>
      <rect x="8.4" y="4.4" width="7.2" height="15.2" rx="2" />
      <path d="M5 8.8v6.4M19 8.8v6.4" />
      <path d="M2.8 10.6v2.8M21.2 10.6v2.8" opacity="0.55" />
    </>
  ),
  theme: (
    <>
      <circle cx="12" cy="12" r="8.2" />
      <path d="M12 3.8a8.2 8.2 0 010 16.4z" fill="currentColor" stroke="none" />
    </>
  ),
  camera: (
    <>
      <path d="M3.6 8.8h3l1.6-2.4h7.6l1.6 2.4h3.2a1.4 1.4 0 011.4 1.4v7a1.4 1.4 0 01-1.4 1.4H3.6a1.4 1.4 0 01-1.4-1.4v-7a1.4 1.4 0 011.4-1.4z" />
      <circle cx="12" cy="13.6" r="3.4" />
    </>
  ),
  prev: (
    <>
      <path d="M18.5 6.4v11.2L9.8 12z" />
      <path d="M6.4 6.2v11.6" />
    </>
  ),
  play: <path d="M8.4 5.8l10 6.2-10 6.2z" />,
  pause: (
    <>
      <path d="M9 5.6v12.8M15 5.6v12.8" />
    </>
  ),
  next: (
    <>
      <path d="M5.5 6.4v11.2L14.2 12z" />
      <path d="M17.6 6.2v11.6" />
    </>
  ),
  offline: (
    <>
      <path d="M4.2 9.6A7.6 7.6 0 0116.8 8h.6a3.9 3.9 0 012.4 6.9" />
      <path d="M7.4 13.4a5.6 5.6 0 013.2-1.5" />
      <path d="M4 20L20 4" />
      <path d="M12 17.6h.01" />
    </>
  ),
  refresh: (
    <>
      <path d="M19.6 12a7.6 7.6 0 11-2.3-5.4" />
      <path d="M19.8 4.6v4.2h-4.2" />
    </>
  ),
  bubble: (
    <>
      <circle cx="12" cy="12" r="7.2" />
      <path d="M9.2 8.9a3.6 3.6 0 00-1.3 2.2" />
      <circle cx="14.6" cy="14.6" r="1.1" fill="currentColor" stroke="none" opacity="0.55" />
    </>
  ),
  popit: (
    <>
      <rect x="3.4" y="3.4" width="17.2" height="17.2" rx="4.2" />
      <circle cx="8.6" cy="8.6" r="1.25" />
      <circle cx="15.4" cy="8.6" r="1.25" />
      <circle cx="8.6" cy="15.4" r="1.25" />
      <circle cx="15.4" cy="15.4" r="1.25" />
    </>
  ),
  balloon: (
    <>
      <path d="M12 3.6c3.2 0 5.6 2.5 5.6 5.7 0 3.9-3.3 6.6-5.6 6.6S6.4 13.2 6.4 9.3c0-3.2 2.4-5.7 5.6-5.7z" />
      <path d="M10.5 16.4h3" />
      <path d="M12 16.4c.6 1.6-.9 2.3-.2 3.4.4.7 1.2.9 1.8.8" />
    </>
  ),
  jelly: (
    <>
      <path d="M6.4 19.4c-1.6-1-2.2-3-1.5-5.6.9-3.4 2.2-6.6 6.4-6.6 4.6 0 6.4 3.3 6.9 7.3.3 2.5-.4 4.3-2 5.1-2.6 1.3-7.6 1.2-9.8-.2z" />
      <path d="M9.4 12.6h.01M14.4 12.6h.01" />
      <path d="M10.2 15.6c.9.9 2.3.9 3.2 0" />
    </>
  ),
  spinner: (
    <>
      <circle cx="12" cy="12" r="2.1" />
      <path d="M12 9.9c0-2.6.8-4.6 2.4-5.9 1 1.9.9 4.1-.7 6" />
      <path d="M14.1 12c2.6 0 4.6.8 5.9 2.4-1.9 1-4.1.9-6-.7" />
      <path d="M12 14.1c0 2.6-.8 4.6-2.4 5.9-1-1.9-.9-4.1.7-6" />
      <path d="M9.9 12c-2.6 0-4.6-.8-5.9-2.4 1.9-1 4.1-.9 6 .7" />
    </>
  ),
  frog: (
    <>
      <path d="M4.4 15.6c0-3.4 3.4-6 7.6-6s7.6 2.6 7.6 6c0 2.4-3.4 4-7.6 4s-7.6-1.6-7.6-4z" />
      <circle cx="8.4" cy="8" r="2.2" />
      <circle cx="15.6" cy="8" r="2.2" />
      <circle cx="8.4" cy="8" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="15.6" cy="8" r="0.8" fill="currentColor" stroke="none" />
      <path d="M9.6 14.6c1.4 1.1 3.4 1.1 4.8 0" />
    </>
  ),
  dice: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="4.4" />
      <circle cx="8.6" cy="8.6" r="1.05" fill="currentColor" stroke="none" />
      <circle cx="15.4" cy="8.6" r="1.05" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.05" fill="currentColor" stroke="none" />
      <circle cx="8.6" cy="15.4" r="1.05" fill="currentColor" stroke="none" />
      <circle cx="15.4" cy="15.4" r="1.05" fill="currentColor" stroke="none" />
    </>
  ),
  breath: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4.6" opacity="0.6" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
    </>
  ),
  mixer: (
    <>
      <path d="M7 4.4v15.2M12 4.4v15.2M17 4.4v15.2" />
      <circle cx="7" cy="9" r="1.9" fill="var(--icon-bg, transparent)" />
      <circle cx="12" cy="15" r="1.9" fill="var(--icon-bg, transparent)" />
      <circle cx="17" cy="7.6" r="1.9" fill="var(--icon-bg, transparent)" />
    </>
  ),
  brush: (
    <>
      <path d="M16.8 3.8l3.4 3.4-8 8-3.4-3.4z" />
      <path d="M8.8 11.8l3.4 3.4-2.2 2.2c-1 1-2.4 1-3.4 0s-1-2.4 0-3.4z" />
      <path d="M6.2 17.4c-1.1 1.6-2 2.3-3.2 2.6.3-1.2 1-2.1 2.6-3.2" />
    </>
  ),
  eraser: (
    <>
      <path d="M15.4 4.4l4.2 4.2a1.4 1.4 0 0 1 0 2l-7.4 7.4-6.2-6.2 7.4-7.4a1.4 1.4 0 0 1 2 0z" />
      <path d="M9.6 10.2l6.2 6.2" />
      <path d="M8.4 20.4h11.2" opacity="0.7" />
    </>
  ),
  synth: (
    <>
      <rect x="3.2" y="6.4" width="17.6" height="11.2" rx="2.2" />
      <path d="M8.2 6.4v6.6M11.6 6.4v6.6M15.4 6.4v6.6M18.4 6.4v6.6" />
      <path d="M4.4 15.4h15.2" opacity="0.6" />
    </>
  ),
  drum: (
    <>
      <ellipse cx="12" cy="8.6" rx="7" ry="2.8" />
      <path d="M5 8.6v6.2c0 1.6 3.1 2.9 7 2.9s7-1.3 7-2.9V8.6" />
      <path d="M8.6 12.6l-.6 3M15.4 12.6l.6 3" opacity="0.5" />
      <path d="M7.4 5.4L4.6 3.4M16.6 5.4l2.8-2" />
    </>
  ),
  koi: (
    <>
      <path d="M20.4 12c-2 3-5 4.6-8.6 4.6-3.6 0-6-2-7-4.6 1-2.6 3.4-4.6 7-4.6 3.6 0 6.6 1.6 8.6 4.6z" />
      <path d="M20.4 12c.9 1 1.3 1.9 1.4 3.1-1.3-.2-2.2-.7-3.2-1.6" />
      <circle cx="8.4" cy="11.4" r="0.9" fill="currentColor" stroke="none" />
      <path d="M10.6 12.6c1.6 0 3-.5 4.2-1.4" opacity="0.5" />
    </>
  ),
  rocks: (
    <>
      <ellipse cx="12" cy="18.2" rx="7" ry="2.6" />
      <ellipse cx="11.2" cy="13.2" rx="5" ry="2.4" />
      <ellipse cx="12.6" cy="8.6" rx="3.2" ry="2.1" />
    </>
  ),
  heart: (
    <path
      d="M12 20s-7.4-4.4-7.4-9.4a4.2 4.2 0 017.4-2.7 4.2 4.2 0 017.4 2.7C19.4 15.6 12 20 12 20z"
      fill="currentColor"
      stroke="none"
    />
  ),
  rain: (
    <>
      <path d="M6.4 14.6a4 4 0 01.3-8 5.4 5.4 0 0110.4 1.2 3.4 3.4 0 011 6.6" />
      <path d="M8.4 17.4l-.8 2.4M12.2 17.4l-.8 2.4M16 17.4l-.8 2.4" />
    </>
  ),
  waves: (
    <>
      <path d="M2.8 9.4c1.5-1.6 3-1.6 4.6 0s3.1 1.6 4.6 0 3.1-1.6 4.6 0 3.1 1.6 4.6 0" />
      <path d="M2.8 14.6c1.5-1.6 3-1.6 4.6 0s3.1 1.6 4.6 0 3.1-1.6 4.6 0 3.1 1.6 4.6 0" />
      <path d="M2.8 19.4c1.5-1.6 3-1.6 4.6 0" opacity="0.5" />
    </>
  ),
  bowl: (
    <>
      <path d="M3.4 11.4h17.2c0 4.9-3.8 8.2-8.6 8.2s-8.6-3.3-8.6-8.2z" />
      <path d="M7 11.4a5 5 0 0110 0" opacity="0.45" />
      <path d="M12 3.6v2.4" />
    </>
  ),
  fire: (
    <>
      <path d="M12 3.4c2.6 3 2.2 4.8 1.4 6.2 1.6-.5 2.6-1.6 3-3 1.7 2 2.6 3.9 2.6 5.8a7 7 0 11-14 0c0-3.4 3.4-6.4 7-9z" />
      <path d="M12 20a3 3 0 01-3-3c0-1.7 1.4-2.9 3-4.6 1.6 1.7 3 2.9 3 4.6a3 3 0 01-3 3z" opacity="0.55" />
    </>
  ),
  cricket: (
    <>
      <ellipse cx="12.6" cy="13.4" rx="4" ry="6.2" transform="rotate(18 12.6 13.4)" />
      <path d="M9.4 9.6c-1.6-1.6-2.2-3-2.4-4.6 1.6.2 3 1 4.2 2.6" />
      <path d="M15.4 8.4c1.6-1.4 2.4-2.8 2.8-4.4" opacity="0.7" />
      <path d="M8.4 15.4L5 18M9.6 17.4L7.4 20.6M15.6 16.6l2.4 3" />
      <circle cx="11.6" cy="9.4" r="0.85" fill="currentColor" stroke="none" />
    </>
  ),
  island: (
    <>
      <path d="M3.6 19.4c2-1.6 5-2.4 8.4-2.4s6.4.8 8.4 2.4" />
      <path d="M13.4 17c-.6-3.4-.8-6.6-.6-10" />
      <path d="M12.8 7c-2-1.4-3.8-1.4-5.6-.2 1.6 1.6 3.2 2 5.6.8" />
      <path d="M13 7c1.2-1.8 2.8-2.4 4.8-1.8-.6 2-1.8 2.8-4.4 2.6" />
      <path d="M12.6 6.4c.2-2 1-3.4 2.4-4.2" opacity="0.7" />
    </>
  ),
  moon: (
    <path d="M19.4 14.4A8.6 8.6 0 019.6 4.6 8.4 8.4 0 1019.4 14.4z" />
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4.4" />
      <path d="M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2M5.4 5.4l1.6 1.6M17 17l1.6 1.6M18.6 5.4L17 7M7 17l-1.6 1.6" />
    </>
  ),
  sunrise: (
    <>
      <path d="M3.4 19h17.2" />
      <path d="M7.6 15.4a4.4 4.4 0 018.8 0" />
      <path d="M12 8.6V2.8M9.2 5.6L12 2.8l2.8 2.8" />
      <path d="M5.4 17.4h.01M18.6 17.4h.01" opacity="0.6" />
    </>
  ),
  sunset: (
    <>
      <path d="M3.4 19h17.2" />
      <path d="M7.6 15.4a4.4 4.4 0 018.8 0" />
      <path d="M12 2.8v5.8M9.2 5.6L12 8.4l2.8-2.8" />
      <path d="M5.4 17.4h.01M18.6 17.4h.01" opacity="0.6" />
    </>
  ),
  check: <path d="M4.6 12.6l4.6 4.6 10.2-10.2" />,
  share: (
    <>
      <path d="M12 3.6v10.8" />
      <path d="M8 7.4L12 3.6l4 3.8" />
      <path d="M5 13.4v5.4a1.6 1.6 0 001.6 1.6h10.8a1.6 1.6 0 001.6-1.6v-5.4" />
    </>
  ),
  message: (
    <>
      <path d="M4 6.4h16a1.4 1.4 0 011.4 1.4v7.4a1.4 1.4 0 01-1.4 1.4H9.6L5 20.4v-3.8H4a1.4 1.4 0 01-1.4-1.4V7.8A1.4 1.4 0 014 6.4z" />
      <path d="M7.6 11.4h.01M12 11.4h.01M16.4 11.4h.01" />
    </>
  ),
  mochi: (
    <>
      <path d="M12 3.6c-4.2 0-7.2 2.6-7.2 6.4 0 4.8 3 9.8 7.2 10.4 4.2-.6 7.2-5.6 7.2-10.4 0-3.8-3-6.4-7.2-6.4z" />
      <path d="M7.8 4.6c.9-1.3 2.4-2 4.2-2s3.3.7 4.2 2" />
      <circle cx="9.8" cy="11" r="0.95" fill="currentColor" stroke="none" />
      <circle cx="14.2" cy="11" r="0.95" fill="currentColor" stroke="none" />
      <path d="M10.4 13.8c1 .9 2.2.9 3.2 0" />
    </>
  ),
};

export function Icon({
  name,
  size = 18,
  className,
  ...rest
}: { name: IconName; size?: number } & React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className ? `icon ${className}` : "icon"}
      {...rest}
    >
      {ICONS[name]}
    </svg>
  );
}
