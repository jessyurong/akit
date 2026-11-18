import type { IconName } from "../../components/icons";
import { audio, soundCtx } from "./engine";

export type AmbientId = "rain" | "waves" | "bowl" | "fire" | "crickets";

export interface AmbientDef {
  id: AmbientId;
  label: string;
  icon: IconName;
  hint: string;
}

export const AMBIENT_DEFS: AmbientDef[] = [
  { id: "rain", label: "Soft Rain", icon: "rain", hint: "Low-passed noise, like rain on a window" },
  { id: "waves", label: "Ocean Waves", icon: "waves", hint: "Slow swelling surf" },
  { id: "bowl", label: "Singing Bowl", icon: "bowl", hint: "216 Hz + 432 Hz harmonic drone" },
  { id: "fire", label: "Fireplace", icon: "fire", hint: "Warm crackle and hiss" },
  { id: "crickets", label: "Night Crickets", icon: "cricket", hint: "A quiet summer evening" },
];

interface Layer {
  gain: GainNode;
  sources: AudioScheduledSourceNode[];
  timers: number[];
}

/**
 * Layered ambient mixer. Layers can run together (rain + fire + bowl), and
 * every layer is fully torn down when stopped — sources stopped, timers
 * cleared, nodes disconnected. No more ghost audio.
 */
class AmbientMixer {
  private layers = new Map<AmbientId, Layer>();

  isActive(id: AmbientId) {
    return this.layers.has(id);
  }

  activeIds(): AmbientId[] {
    return [...this.layers.keys()];
  }

  toggle(id: AmbientId): boolean {
    if (this.layers.has(id)) {
      this.stop(id);
      return false;
    }
    const ctx = soundCtx();
    const out = audio.busForAmbient();
    if (!ctx || !out) return false;
    this.layers.set(id, this.build(id, ctx, out));
    return true;
  }

  stop(id: AmbientId) {
    const layer = this.layers.get(id);
    if (!layer) return;
    this.layers.delete(id);
    const ctx = soundCtx();
    const now = ctx?.currentTime ?? 0;
    try {
      layer.gain.gain.cancelScheduledValues(now);
      layer.gain.gain.setValueAtTime(Math.max(0.0001, layer.gain.gain.value), now);
      layer.gain.gain.linearRampToValueAtTime(0.0001, now + 0.4);
    } catch {
      /* node already gone */
    }
    window.setTimeout(() => {
      for (const timer of layer.timers) window.clearInterval(timer);
      for (const source of layer.sources) {
        try {
          source.stop();
        } catch {
          /* already stopped */
        }
        try {
          source.disconnect();
        } catch {
          /* noop */
        }
      }
      try {
        layer.gain.disconnect();
      } catch {
        /* noop */
      }
    }, 500);
  }

  stopAll() {
    for (const id of this.activeIds()) this.stop(id);
  }

  /* ---------------------------------------------------------------- */

  private build(id: AmbientId, ctx: AudioContext, out: GainNode): Layer {
    const gain = ctx.createGain();
    gain.connect(out);
    const layer: Layer = { gain, sources: [], timers: [] };

    switch (id) {
      case "rain": {
        gain.gain.value = 0.16;
        const src = ctx.createBufferSource();
        src.buffer = audio.noiseBuffer(ctx);
        src.loop = true;

        const low = ctx.createBiquadFilter();
        low.type = "lowpass";
        low.frequency.value = 1800;

        const high = ctx.createBiquadFilter();
        high.type = "highpass";
        high.frequency.value = 350;

        src.connect(high).connect(low).connect(gain);
        src.start();
        layer.sources.push(src);
        break;
      }

      case "waves": {
        gain.gain.value = 0.1;
        const src = ctx.createBufferSource();
        src.buffer = audio.noiseBuffer(ctx);
        src.loop = true;

        const band = ctx.createBiquadFilter();
        band.type = "bandpass";
        band.frequency.value = 480;
        band.Q.value = 0.7;

        const swell = ctx.createGain();
        swell.gain.value = 0.55;

        // 9s swell — a slow, complete cycle so the loop never feels clipped
        const lfo = ctx.createOscillator();
        lfo.frequency.value = 1 / 9;
        const lfoDepth = ctx.createGain();
        lfoDepth.gain.value = 0.45;
        lfo.connect(lfoDepth).connect(swell.gain);

        src.connect(band).connect(swell).connect(gain);
        src.start();
        lfo.start();
        layer.sources.push(src, lfo);
        break;
      }

      case "bowl": {
        gain.gain.value = 0.09;
        const freqs = [216, 432, 648.5];
        const tremolo = ctx.createGain();
        tremolo.gain.value = 0.75;
        const trem = ctx.createOscillator();
        trem.frequency.value = 0.12;
        const tremDepth = ctx.createGain();
        tremDepth.gain.value = 0.25;
        trem.connect(tremDepth).connect(tremolo.gain);
        tremolo.connect(gain);

        const oscs = freqs.map((f, i) => {
          const o = ctx.createOscillator();
          o.type = "sine";
          o.frequency.value = f;
          o.detune.value = i * 3 - 3;
          const g = ctx.createGain();
          g.gain.value = 0.4 / (i + 1);
          o.connect(g).connect(tremolo);
          o.start();
          return o;
        });
        trem.start();
        layer.sources.push(...oscs, trem);
        break;
      }

      case "fire": {
        gain.gain.value = 0.14;
        const src = ctx.createBufferSource();
        src.buffer = audio.noiseBuffer(ctx);
        src.loop = true;
        const low = ctx.createBiquadFilter();
        low.type = "lowpass";
        low.frequency.value = 720;
        src.connect(low).connect(gain);
        src.start();
        layer.sources.push(src);

        layer.timers.push(
          window.setInterval(() => {
            if (ctx.state !== "running") return;
            const crackle = ctx.createBufferSource();
            crackle.buffer = audio.noiseBuffer(ctx);
            const bp = ctx.createBiquadFilter();
            bp.type = "bandpass";
            bp.frequency.value = 1200 + Math.random() * 2400;
            bp.Q.value = 2;
            const g = ctx.createGain();
            const now = ctx.currentTime;
            const peak = 0.08 + Math.random() * 0.12;
            g.gain.setValueAtTime(0.0001, now);
            g.gain.exponentialRampToValueAtTime(peak, now + 0.005);
            g.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
            crackle.connect(bp).connect(g).connect(gain);
            crackle.start(now, Math.random() * 1.5, 0.1);
          }, 320),
        );
        break;
      }

      case "crickets": {
        gain.gain.value = 0.05;
        layer.timers.push(
          window.setInterval(() => {
            if (ctx.state !== "running") return;
            const now = ctx.currentTime;
            for (let i = 0; i < 3; i++) {
              const o = ctx.createOscillator();
              o.type = "sine";
              o.frequency.value = 4200 + Math.random() * 500;
              const g = ctx.createGain();
              const t = now + i * 0.07;
              g.gain.setValueAtTime(0.0001, t);
              g.gain.exponentialRampToValueAtTime(0.5, t + 0.008);
              g.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
              o.connect(g).connect(gain);
              o.start(t);
              o.stop(t + 0.06);
            }
          }, 900),
        );
        break;
      }
    }

    return layer;
  }
}

export const ambient = new AmbientMixer();
