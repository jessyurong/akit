/**
 * One AudioContext for the whole app.
 *
 * The old version created a fresh context every time you toggled an ambient
 * sound and never closed the old ones. Browsers cap you at a handful of
 * contexts, so after a few taps the app went silent forever. Everything now
 * runs through a single context with separate gain buses:
 *
 *   master
 *     ├── sfx      (pops, chimes, synth pads)
 *     └── ambient  (rain, waves, bowl, fire, crickets)
 *
 * Music is *not* routed here on purpose — it uses an <audio> element so it
 * keeps playing when the phone is locked (see lib/music/player.tsx).
 */

export type BusName = "master" | "sfx" | "ambient";

type AudioCtor = typeof AudioContext;

class AudioEngine {
  private ctx: AudioContext | null = null;
  private gains = new Map<BusName, GainNode>();
  private noise: AudioBuffer | null = null;
  private volumes: Record<BusName, number> = { master: 1, sfx: 0.9, ambient: 0.9 };
  private enabled = true;
  private armed = false;

  /** Lazily create the context. Safe to call from anywhere; returns null on the server. */
  ensure(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const Ctor: AudioCtor | undefined =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: AudioCtor }).webkitAudioContext;
      if (!Ctor) return null;
      try {
        this.ctx = new Ctor();
        const master = this.ctx.createGain();
        master.gain.value = this.enabled ? this.volumes.master : 0;
        master.connect(this.ctx.destination);

        for (const bus of ["sfx", "ambient"] as const) {
          const g = this.ctx.createGain();
          g.gain.value = this.volumes[bus];
          g.connect(master);
          this.gains.set(bus, g);
        }
        this.gains.set("master", master);
      } catch {
        this.ctx = null;
      }
    }
    if (this.ctx?.state === "suspended") void this.ctx.resume().catch(() => {});
    return this.ctx;
  }

  /** Attach one-shot listeners so the context wakes up on the first gesture. */
  arm() {
    if (this.armed || typeof window === "undefined") return;
    this.armed = true;
    const wake = () => {
      this.ensure();
      window.removeEventListener("pointerdown", wake);
      window.removeEventListener("keydown", wake);
    };
    window.addEventListener("pointerdown", wake, { passive: true });
    window.addEventListener("keydown", wake);
  }

  bus(name: BusName): GainNode | null {
    this.ensure();
    return this.gains.get(name) ?? null;
  }

  busForSfx(): GainNode | null {
    if (!this.enabled) return null;
    return this.bus("sfx");
  }

  busForAmbient(): GainNode | null {
    if (!this.enabled) return null;
    return this.bus("ambient");
  }

  setEnabled(on: boolean) {
    this.enabled = on;
    const master = this.gains.get("master");
    if (master && this.ctx) {
      master.gain.setTargetAtTime(on ? this.volumes.master : 0, this.ctx.currentTime, 0.02);
    }
  }

  setBusVolume(name: BusName, value: number) {
    const v = Math.min(1, Math.max(0, value));
    this.volumes[name] = v;
    const gain = this.gains.get(name);
    if (gain && this.ctx) {
      const target = name === "master" && !this.enabled ? 0 : v;
      gain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.02);
    }
  }

  /** 2s of looping white noise, reused by every ambient layer. */
  noiseBuffer(ctx: AudioContext): AudioBuffer {
    if (this.noise) return this.noise;
    const length = Math.floor(ctx.sampleRate * 2);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    this.noise = buffer;
    return buffer;
  }

  get now(): number {
    return this.ctx?.currentTime ?? 0;
  }
}

export const audio = new AudioEngine();

/** Short alias so call sites read nicely: `ctx = soundCtx()`. */
export function soundCtx(): AudioContext | null {
  return audio.ensure();
}
