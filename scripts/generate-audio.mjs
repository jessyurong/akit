/**
 * Generates four small seamless ambient loops as 16-bit mono WAV files.
 * These are placeholders so the player works out of the box — swap them for
 * your own royalty-free MP3s any time (see lib/music/tracks.ts).
 *
 * Usage: node scripts/generate-audio.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const SR = 16000;
const OUT = resolve("public/audio");
mkdirSync(OUT, { recursive: true });

function buffer(seconds) {
  return new Float32Array(Math.floor(SR * seconds));
}

function addTone(buf, freq, startSec, durSec, amp, { attack = 0.8, release = 1.2, detune = 0 } = {}) {
  const start = Math.max(0, Math.floor(startSec * SR));
  const len = Math.min(buf.length - start, Math.floor(durSec * SR));
  const f = freq * (1 + detune / 1000);
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    let env = 1;
    if (t < attack) env = t / attack;
    const left = durSec - t;
    if (left < release) env = Math.min(env, Math.max(0, left / release));
    // smoothstep-ish shaping keeps the pad soft
    env = Math.sin((env * Math.PI) / 2) ** 1.3;
    const s = Math.sin(2 * Math.PI * f * t) + 0.18 * Math.sin(4 * Math.PI * f * t);
    buf[start + i] += s * amp * env;
  }
}

function addPluck(buf, freq, startSec, amp, decay = 4.5) {
  const start = Math.max(0, Math.floor(startSec * SR));
  const len = Math.min(buf.length - start, Math.floor(2.2 * SR));
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const env = Math.exp(-t * decay) * Math.min(1, t * 90);
    const s = Math.sin(2 * Math.PI * freq * t) + 0.32 * Math.sin(4 * Math.PI * freq * t) + 0.1 * Math.sin(6 * Math.PI * freq * t);
    buf[start + i] += s * amp * env;
  }
}

function addNoise(buf, startSec, durSec, amp, cutoff = 0.25) {
  const start = Math.max(0, Math.floor(startSec * SR));
  const len = Math.min(buf.length - start, Math.floor(durSec * SR));
  let prev = 0;
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const env = Math.exp(-t * 28);
    const white = Math.random() * 2 - 1;
    prev += (white - prev) * cutoff;
    buf[start + i] += prev * amp * env;
  }
}

function delay(buf, timeSec, feedback, mix) {
  const d = Math.floor(timeSec * SR);
  for (let i = d; i < buf.length; i++) buf[i] += buf[i - d] * feedback * mix;
}

function lowpass(buf, cutoffHz) {
  const a = 1 - Math.exp((-2 * Math.PI * cutoffHz) / SR);
  let y = 0;
  for (let i = 0; i < buf.length; i++) {
    y += (buf[i] - y) * a;
    buf[i] = y;
  }
}

function edgeFade(buf, sec = 0.03) {
  const n = Math.floor(sec * SR);
  for (let i = 0; i < n; i++) {
    const k = i / n;
    buf[i] *= k;
    buf[buf.length - 1 - i] *= k;
  }
}

function normalize(buf, peak = 0.72) {
  let max = 0;
  for (const s of buf) max = Math.max(max, Math.abs(s));
  if (max === 0) return;
  const g = peak / max;
  for (let i = 0; i < buf.length; i++) buf[i] *= g;
}

function writeWav(name, buf) {
  const pcm = Buffer.alloc(buf.length * 2);
  for (let i = 0; i < buf.length; i++) {
    const s = Math.max(-1, Math.min(1, buf[i]));
    pcm.writeInt16LE(Math.round(s * 32767), i * 2);
  }
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(SR, 24);
  header.writeUInt32LE(SR * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);

  const wav = Buffer.concat([header, pcm]);
  writeFileSync(resolve(OUT, name), wav);
  console.log(`  ${name}  ${(wav.length / 1024).toFixed(0)} KB`);
}

/* ------------------------------------------------------------------ */
/* Calm — Am9 → Fmaj7 → Cmaj7 → G6, 16s                                */
/* ------------------------------------------------------------------ */
{
  const b = buffer(16);
  const chords = [
    [0, [110, 164.81, 261.63, 392.0]],
    [4, [87.31, 130.81, 220.0, 329.63]],
    [8, [130.81, 196.0, 329.63, 493.88]],
    [12, [98.0, 146.83, 246.94, 349.23]],
  ];
  for (const [start, notes] of chords) {
    notes.forEach((f, i) => {
      addTone(b, f, start, 4, 0.085 - i * 0.008, { attack: 1.1, release: 1.7 });
      addTone(b, f, start, 4, 0.04 - i * 0.004, { attack: 1.3, release: 1.7, detune: 4 });
    });
  }
  const arp = [440, 523.25, 659.25, 783.99, 659.25, 523.25];
  for (let i = 0; i < 16; i++) {
    addPluck(b, arp[i % arp.length], 0.35 + i * 1.0, 0.055, 3.6);
  }
  lowpass(b, 5200);
  delay(b, 0.34, 0.34, 0.45);
  edgeFade(b);
  normalize(b, 0.66);
  writeWav("calm.wav", b);
}

/* ------------------------------------------------------------------ */
/* Focus — Dmaj7 → Bm7 → Gmaj7 → A7, soft pulse, 16s                   */
/* ------------------------------------------------------------------ */
{
  const b = buffer(16);
  const chords = [
    [0, [73.42, 220.0, 277.18, 369.99]],
    [4, [123.47, 185.0, 220.0, 293.66]],
    [8, [98.0, 146.83, 246.94, 369.99]],
    [12, [110.0, 164.81, 196.0, 277.18]],
  ];
  for (const [start, notes] of chords) {
    notes.forEach((f, i) => {
      addTone(b, f, start, 4, 0.08 - i * 0.007, { attack: 1.0, release: 1.6 });
      addTone(b, f, start, 4, 0.035, { attack: 1.4, release: 1.6, detune: -4 });
    });
  }
  const arp = [587.33, 369.99, 293.66, 220.0, 293.66, 369.99];
  for (let i = 0; i < 16; i++) {
    addPluck(b, arp[i % arp.length], 0.2 + i * 1.0, 0.05, 4.2);
  }
  for (let i = 0; i < 8; i++) addNoise(b, i * 2, 0.06, 0.05, 0.12);
  lowpass(b, 4800);
  delay(b, 0.26, 0.28, 0.35);
  edgeFade(b);
  normalize(b, 0.64);
  writeWav("focus.wav", b);
}

/* ------------------------------------------------------------------ */
/* Sleep — drones with an 8s swell, 16s                                */
/* ------------------------------------------------------------------ */
{
  const b = buffer(16);
  addTone(b, 65.41, 0, 16, 0.11, { attack: 3, release: 3 });
  addTone(b, 98.0, 0, 16, 0.075, { attack: 3.4, release: 3 });
  addTone(b, 130.81, 0, 16, 0.05, { attack: 4, release: 3 });
  addTone(b, 196.0, 0, 16, 0.025, { attack: 5, release: 4 });

  for (let i = 0; i < 5; i++) {
    addPluck(b, [523.25, 659.25, 783.99, 659.25, 523.25][i], 1.4 + i * 2.9, 0.022, 2.2);
  }
  // slow amplitude swell that completes twice in 16s, so the loop is seamless
  for (let i = 0; i < b.length; i++) {
    const t = i / SR;
    b[i] *= 0.82 + 0.18 * Math.sin((2 * Math.PI * t) / 8 - Math.PI / 2);
  }
  lowpass(b, 2600);
  delay(b, 0.5, 0.3, 0.4);
  edgeFade(b, 0.1);
  normalize(b, 0.6);
  writeWav("sleep.wav", b);
}

/* ------------------------------------------------------------------ */
/* Playful — 32 beats at 104 bpm (8 bars), pentatonic plucks           */
/* ------------------------------------------------------------------ */
{
  const bpm = 104;
  const beat = 60 / bpm;
  const beats = 32;
  const b = buffer(beat * beats);
  const notes = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
  const pattern = [0, 2, 4, 2, 1, 3, 5, 3, 0, 4, 2, 4, 1, 5, 3, 2];

  for (let bar = 0; bar < 8; bar++) {
    for (let step = 0; step < 8; step++) {
      const idx = pattern[(bar * 8 + step) % pattern.length];
      addPluck(b, notes[idx], bar * 4 * beat + step * (beat / 2), 0.085, 5.2);
      if (step % 2 === 1) addNoise(b, bar * 4 * beat + step * (beat / 2), 0.05, 0.03, 0.4);
    }
    addTone(b, [130.81, 174.61, 196.0, 146.83][bar % 4], bar * 4 * beat, beat * 1.6, 0.07, {
      attack: 0.02,
      release: 1.2,
    });
  }
  lowpass(b, 9000);
  delay(b, beat * 0.75, 0.3, 0.4);
  edgeFade(b);
  normalize(b, 0.62);
  writeWav("playful.wav", b);
}

console.log("Done.");
