import { audio, soundCtx } from "./engine";

/* ------------------------------------------------------------------ */
/* Haptics                                                             */
/* ------------------------------------------------------------------ */

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
    const start = (0.5 + Math.random() * 0.16) * 1000 * pitch;
    const { o, g } = osc(ctx, "sine", start, 0, 0.09, 0.3, 0.003);
    o.frequency.exponentialRampToValueAtTime(90 * pitch, ctx.currentTime + 0.09);
    g.connect(out);
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
