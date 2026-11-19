/**
 * Mochi's voice — a tiny wrapper around the Web Speech API.
 * No audio files: the device's own voices do the talking, so it works offline.
 */

type SpeakOptions = {
  onStart?: () => void;
  onEnd?: () => void;
  volume?: number;
};

// Nicer-sounding English voices, in order of preference per platform.
const CUTE_VOICES = [
  "samantha",
  "google us english",
  "microsoft aria",
  "microsoft jenny",
  "karen",
  "moira",
  "tessa",
  "victoria",
  "zira",
];

let voice: SpeechSynthesisVoice | null = null;
let voiceReady = false;

function synth(): SpeechSynthesis | null {
  if (typeof window === "undefined") return null;
  if (!("speechSynthesis" in window)) return null;
  return window.speechSynthesis;
}

function chooseVoice(list: SpeechSynthesisVoice[]) {
  const english = list.filter((v) => /^en/i.test(v.lang));
  for (const name of CUTE_VOICES) {
    const hit = english.find((v) => v.name.toLowerCase().includes(name));
    if (hit) return hit;
  }
  return english.find((v) => v.localService) ?? english[0] ?? null;
}

/** Voices load asynchronously on most browsers — call this once on mount. */
export function warmUpVoices() {
  const s = synth();
  if (!s || voiceReady) return;
  const pick = () => {
    const list = s.getVoices();
    if (!list.length) return;
    voice = chooseVoice(list);
    voiceReady = true;
  };
  pick();
  if (!voiceReady) s.addEventListener("voiceschanged", pick, { once: true });
}

export function canSpeak(): boolean {
  if (typeof window === "undefined") return false;
  return "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
}

export function stopSpeaking() {
  synth()?.cancel();
}

/**
 * Says one line out loud. Returns false when the browser has no speech
 * support (the speech bubble still shows, so nothing breaks).
 */
export function speak(text: string, opts: SpeakOptions = {}): boolean {
  const s = synth();
  if (!s || typeof window === "undefined" || !("SpeechSynthesisUtterance" in window)) {
    return false;
  }

  // Cut the previous line so fast taps don't stack up in a queue.
  s.cancel();

  const u = new SpeechSynthesisUtterance(text);
  if (!voice) warmUpVoices();
  if (voice) u.voice = voice;
  u.lang = voice?.lang ?? "en-US";
  u.pitch = 1.35; // a little high = cute, not robotic
  u.rate = 1.02;
  u.volume = opts.volume ?? 0.95;

  u.onstart = () => opts.onStart?.();
  u.onend = () => opts.onEnd?.();
  u.onerror = () => opts.onEnd?.();

  // iOS Safari sometimes stays paused after a cancel.
  if (s.paused) s.resume();
  s.speak(u);
  return true;
}
