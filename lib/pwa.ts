/**
 * Tiny external store for the PWA install prompt.
 *
 * `beforeinstallprompt` can fire before React mounts, so the event is captured
 * at module load and components subscribe to it afterwards.
 */

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferred: InstallPromptEvent | null = null;
let installed = false;

const EVENT = "sr:installable";

export function initInstallPrompt() {
  if (typeof window === "undefined") return;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e as InstallPromptEvent;
    window.dispatchEvent(new Event(EVENT));
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    installed = true;
    window.dispatchEvent(new Event(EVENT));
  });
}

export function isInstallable(): boolean {
  return Boolean(deferred) && !installed;
}

export function installChangeEvent() {
  return EVENT;
}

export async function promptInstall(): Promise<boolean> {
  if (!deferred) return false;
  try {
    await deferred.prompt();
    const choice = await deferred.userChoice;
    deferred = null;
    window.dispatchEvent(new Event(EVENT));
    return choice.outcome === "accepted";
  } catch {
    return false;
  }
}

export function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}
