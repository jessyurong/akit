/**
 * Mochi's voice — a tiny wrapper around the Web Speech API.
 * No audio files: the device's own voices do the talking, so it works offline.
 */

type SpeakOptions = {
  onStart?: () => void;
  onEnd?: () => void;
  volume?: number;
  /** 1.35 is Mochi's usual cute voice; lower it for a grumpy line. */
  pitch?: number;
  rate?: number;
};

// Mochi's voice: small and bright, but slowed down a touch so every word lands.
const MOCHI_VOICE = { pitch: 1.5, rate: 0.97, volume: 0.92 };

// Nicer-sounding English voices, in order of preference per platform.
const CUTE_VOICES = [
  "samantha",
  "google us english",
  "microsoft aria",
  "microsoft jenny",
  "microsoft michelle",
  "microsoft ana",
  "google uk english female",
  "karen",
  "moira",
  "tessa",
  "victoria",
  "ava",
  "allison",
  "susan",
  "zira",
];

let voice: SpeechSynthesisVoice | null = null;
let voiceReady = false;
let primed = false;
let priming = false;
let armed = false;

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

/**
 * iOS/WebKit (and Chrome) refuse to start speech unless the first utterance is
 * created inside a real user gesture. Voice-chat replies arrive after an async
 * fetch, so by the time we speak there is no gesture left on the stack — the
 * browser drops it silently (no error, no onstart/onend, no sound). Whispering
 * one muted, empty utterance during the first tap lifts that restriction for
 * the rest of the session.
 */
export function primeSpeech() {
  if (primed || priming || typeof window === "undefined") return;
  const s = synth();
  if (!s || !("SpeechSynthesisUtterance" in window)) return;
  try {
    const u = new SpeechSynthesisUtterance(" ");
    u.volume = 0;
    u.rate = 10;
    priming = true;
    // Suppressed utterances fire no events at all, so only trust onstart as
    // proof the engine was really unlocked. Otherwise a later tap retries.
    u.onstart = () => {
      primed = true;
      priming = false;
    };
    window.setTimeout(() => {
      priming = false;
    }, 500);
    s.speak(u);
  } catch {
    priming = false;
  }
}

/** Fire once on the first gesture of the session, whatever the user touches. */
export function armSpeech() {
  if (armed || typeof window === "undefined") return;
  armed = true;
  const unlock = () => {
    primeSpeech();
    if (!primed) return; // let a later gesture retry if this one was ignored
    window.removeEventListener("pointerdown", unlock, true);
    window.removeEventListener("keydown", unlock, true);
    window.removeEventListener("touchend", unlock, true);
    window.removeEventListener("click", unlock, true);
  };
  // Capture phase so this runs before React's own handlers.
  window.addEventListener("pointerdown", unlock, true);
  window.addEventListener("keydown", unlock, true);
  window.addEventListener("touchend", unlock, true);
  window.addEventListener("click", unlock, true);
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

  // Cut the previous line so fast taps don't stack up in a queue. Don't call
  // cancel() while idle — on iOS that can swallow the next utterance, too.
  if (s.speaking || s.pending) s.cancel();

  const u = new SpeechSynthesisUtterance(text);
  if (!voice) warmUpVoices();
  if (voice) u.voice = voice;
  u.lang = voice?.lang ?? "en-US";
  u.pitch = opts.pitch ?? MOCHI_VOICE.pitch; // a little high = cute, not robotic
  u.rate = opts.rate ?? MOCHI_VOICE.rate; // slightly slower = clearer
  u.volume = opts.volume ?? MOCHI_VOICE.volume;

  u.onstart = () => opts.onStart?.();
  u.onend = () => opts.onEnd?.();
  u.onerror = () => opts.onEnd?.();

  // iOS Safari sometimes stays paused after a cancel.
  if (s.paused) s.resume();
  s.speak(u);
  return true;
}
