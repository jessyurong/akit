import { audio, soundCtx } from "./engine";

/* ------------------------------------------------------------------ */
/* Haptics                                                             */
/* ------------------------------------------------------------------ */

export type DrumKind = "kick" | "snare" | "tom" | "hat" | "crash" | "rim";

export const haptics = {
  enabled: true,
  pulse(pattern: number | number[] = 12) {
    if (!this.enabled || typeof navigator === "undefined") return;
    try {
      navigator.vibrate?.(pattern);
    } catch {
      /* iOS Safari has no vibrate API — silently skip */
    }
  },
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function envelope(ctx: AudioContext, peak: number, attack: number, decay: number) {
  const gain = ctx.createGain();
  const now = ctx.currentTime;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), now + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + attack + decay);
  return gain;
}

function osc(
  ctx: AudioContext,
  type: OscillatorType,
  freq: number,
  when = 0,
  duration = 0.12,
  peak = 0.22,
  attack = 0.004,
) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, ctx.currentTime + when);
  g.gain.setValueAtTime(0.0001, ctx.currentTime + when);
  g.gain.exponentialRampToValueAtTime(peak, ctx.currentTime + when + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + when + attack + duration);
  o.connect(g);
  o.start(ctx.currentTime + when);
  o.stop(ctx.currentTime + when + attack + duration + 0.02);
  return { o, g };
}

/* ------------------------------------------------------------------ */
/* Sound effects                                                       */
/* ------------------------------------------------------------------ */

export const sfx = {
  pop(pitch = 1) {
    const ctx = soundCtx();
    const out = audio.busForSfx();
    if (!ctx || !out) return;
    const t = ctx.currentTime;

    // Round, bouncy "plop" body.
    const { o, g } = osc(ctx, "sine", 560 * pitch, 0, 0.12, 0.3, 0.003);
    o.frequency.setValueAtTime(560 * pitch, t);
    o.frequency.exponentialRampToValueAtTime(190 * pitch, t + 0.05);
    o.frequency.exponentialRampToValueAtTime(98 * pitch, t + 0.125);
    g.connect(out);

    // Tiny upward chirp keeps it cute instead of dull.
    const { o: o2, g: g2 } = osc(ctx, "triangle", 820 * pitch, 0.01, 0.075, 0.11, 0.004);
    o2.frequency.setValueAtTime(820 * pitch, t + 0.01);
    o2.frequency.exponentialRampToValueAtTime(1380 * pitch, t + 0.03);
    o2.frequency.exponentialRampToValueAtTime(430 * pitch, t + 0.09);
    g2.connect(out);

    // Rubber snap of the latex.
    const { g: g3 } = osc(ctx, "square", 2500, 0, 0.017, 0.05, 0.001);
    g3.connect(out);

    haptics.pulse(8);
  },

  squish() {
    const ctx = soundCtx();
    const out = audio.busForSfx();
    if (!ctx || !out) return;
    const { o, g } = osc(ctx, "triangle", 170, 0, 0.16, 0.26, 0.006);
    o.frequency.linearRampToValueAtTime(330, ctx.currentTime + 0.06);
    o.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.17);
    g.connect(out);
    haptics.pulse([10, 25, 10]);
  },

  dice() {
    const ctx = soundCtx();
    const out = audio.busForSfx();
    if (!ctx || !out) return;
    for (let i = 0; i < 5; i++) {
      const when = i * 0.05 + Math.random() * 0.02;
      const { g } = osc(ctx, "square", 320 + Math.random() * 420, when, 0.03, 0.09, 0.002);
      g.connect(out);
    }
    haptics.pulse([8, 30, 8, 30, 8]);
  },

  ribbit() {
    const ctx = soundCtx();
    const out = audio.busForSfx();
    if (!ctx || !out) return;
    const { o, g } = osc(ctx, "sawtooth", 140, 0, 0.13, 0.16, 0.005);
    o.frequency.linearRampToValueAtTime(230, ctx.currentTime + 0.05);
    o.frequency.linearRampToValueAtTime(120, ctx.currentTime + 0.13);
    g.connect(out);
    haptics.pulse(14);
  },

  /** A tiny indignant "hmph" for when Mochi gets poke-spammed. */
  huff() {
    const ctx = soundCtx();
    const out = audio.busForSfx();
    if (!ctx || !out) return;
    const { o, g } = osc(ctx, "triangle", 260, 0, 0.16, 0.14, 0.01);
    o.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.15);
    g.connect(out);
    haptics.pulse([12, 30, 12]);
  },

  chime(freq = 528, duration = 1.2, peak = 0.22) {
    const ctx = soundCtx();
    const out = audio.busForSfx();
    if (!ctx || !out) return;
    const { g } = osc(ctx, "sine", freq, 0, duration, peak, 0.008);
    const { g: g2 } = osc(ctx, "sine", freq * 2.01, 0, duration * 0.7, peak * 0.25, 0.01);
    g.connect(out);
    g2.connect(out);
  },

  click() {
    const ctx = soundCtx();
    const out = audio.busForSfx();
    if (!ctx || !out) return;
    const { g } = osc(ctx, "square", 880, 0, 0.035, 0.05, 0.002);
    g.connect(out);
  },

  /** Tiny acoustic drum kit — all synthesized, no samples. */
  drum(kind: DrumKind) {
    const ctx = soundCtx();
    const out = audio.busForSfx();
    if (!ctx || !out) return;

    const now = ctx.currentTime;

    const noise = (
      peak: number,
      decay: number,
      filterType: BiquadFilterType,
      freq: number,
      q = 0.9,
    ) => {
      const src = ctx.createBufferSource();
      src.buffer = audio.noiseBuffer(ctx);
      const filter = ctx.createBiquadFilter();
      filter.type = filterType;
      filter.frequency.setValueAtTime(freq, now);
      filter.Q.value = q;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(peak, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(out);
      src.start(now);
      src.stop(now + decay + 0.02);
    };

    const body = (type: OscillatorType, from: number, to: number, decay: number, peak: number) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(from, now);
      o.frequency.exponentialRampToValueAtTime(Math.max(30, to), now + decay * 0.8);
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(peak, now + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, now + decay);
      o.connect(g);
      g.connect(out);
      o.start(now);
      o.stop(now + decay + 0.02);
    };

    switch (kind) {
      case "kick":
        body("sine", 150, 44, 0.34, 0.55);
        noise(0.08, 0.03, "lowpass", 900);
        haptics.pulse(20);
        break;
      case "snare":
        noise(0.26, 0.18, "highpass", 1600, 0.7);
        body("triangle", 190, 150, 0.12, 0.18);
        haptics.pulse([8, 14, 8]);
        break;
      case "tom":
        body("sine", 250, 128, 0.26, 0.4);
        noise(0.05, 0.08, "lowpass", 700);
        haptics.pulse(12);
        break;
      case "hat":
        noise(0.13, 0.06, "highpass", 8200, 1.2);
        noise(0.06, 0.03, "bandpass", 11000, 2);
        haptics.pulse(5);
        break;
      case "crash":
        noise(0.17, 1.05, "highpass", 3600, 0.6);
        noise(0.05, 0.5, "bandpass", 7800, 1.5);
        haptics.pulse([6, 20, 6]);
        break;
      case "rim":
        body("square", 1500, 900, 0.045, 0.12);
        noise(0.09, 0.04, "bandpass", 2600, 2);
        haptics.pulse(6);
        break;
    }
  },

  whoosh() {
    const ctx = soundCtx();
    const out = audio.busForSfx();
    if (!ctx || !out) return;
    const src = ctx.createBufferSource();
    src.buffer = audio.noiseBuffer(ctx);
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.Q.value = 1.2;
    filter.frequency.setValueAtTime(400, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(2400, ctx.currentTime + 0.3);
    const g = envelope(ctx, 0.18, 0.04, 0.3);
    src.connect(filter);
    filter.connect(g);
    g.connect(out);
    src.start();
    src.stop(ctx.currentTime + 0.4);
  },

  sparkle() {
    const notes = [1046.5, 1318.5, 1568, 2093];
    notes.forEach((n, i) => setTimeout(() => sfx.chime(n, 0.6, 0.09), i * 55));
  },

  success() {
    [523.25, 659.25, 783.99, 1046.5].forEach((n, i) =>
      setTimeout(() => sfx.chime(n, 0.9, 0.14), i * 90),
    );
  },

  /** Synth pad voice — soft attack, long tail, two detuned sines. */
  note(freq: number, duration = 1.6, peak = 0.16, type: OscillatorType = "sine") {
    const ctx = soundCtx();
    const out = audio.busForSfx();
    if (!ctx || !out) return;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(3200, ctx.currentTime);
    filter.Q.value = 0.6;
    filter.connect(out);

    const g = ctx.createGain();
    const now = ctx.currentTime;
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(peak, now + 0.06);
    g.gain.exponentialRampToValueAtTime(peak * 0.5, now + 0.5);
    g.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    g.connect(filter);

    [-4, 0, 4].forEach((detune) => {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.value = freq;
      o.detune.value = detune;
      o.connect(g);
      o.start(now);
      o.stop(now + duration + 0.05);
    });
  },
};
