/**
 * Hold-to-talk recording.
 *
 * MediaRecorder gives us webm on Chrome and mp4 on Safari, neither of which
 * Gemini accepts as audio/wav — so we decode the blob, re-render it through an
 * OfflineAudioContext at 16 kHz mono, and hand-encode a tiny PCM WAV.
 */

export const MAX_RECORD_MS = 20_000;
export const MIN_RECORD_MS = 500;

const TARGET_RATE = 16_000;

const MIME_CANDIDATES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/ogg;codecs=opus",
];

export type VoiceRecording = {
  /** Stops the mic and resolves with the WAV as base64 (null if it was cancelled). */
  stop: () => Promise<{ base64: string; durationMs: number } | null>;
  /** Stops immediately and throws the audio away. */
  cancel: () => void;
};

type AudioContextCtor = typeof AudioContext;
type OfflineContextCtor = typeof OfflineAudioContext;

function audioContextCtor(): AudioContextCtor | null {
  if (typeof window === "undefined") return null;
  const g = globalThis as typeof globalThis & { webkitAudioContext?: AudioContextCtor };
  return g.AudioContext ?? g.webkitAudioContext ?? null;
}

function offlineContextCtor(): OfflineContextCtor | null {
  if (typeof window === "undefined") return null;
  const g = globalThis as typeof globalThis & { webkitOfflineAudioContext?: OfflineContextCtor };
  return g.OfflineAudioContext ?? g.webkitOfflineAudioContext ?? null;
}

export function canRecord(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  return Boolean(navigator.mediaDevices?.getUserMedia) && typeof window.MediaRecorder !== "undefined";
}

export async function startRecording(): Promise<VoiceRecording> {
  if (!canRecord()) throw new Error("Recording is not supported in this browser.");

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      channelCount: 1,
      echoCancellation: true,
      noiseSuppression: true,
    },
  });

  const mimeType = MIME_CANDIDATES.find((type) => {
    try {
      return MediaRecorder.isTypeSupported(type);
    } catch {
      return false;
    }
  });

  let recorder: MediaRecorder;
  try {
    recorder = new MediaRecorder(stream, mimeType ? { mimeType, audioBitsPerSecond: 64_000 } : undefined);
  } catch {
    recorder = new MediaRecorder(stream);
  }

  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) chunks.push(event.data);
  };

  const stopped = new Promise<Blob>((resolve) => {
    const finish = () =>
      resolve(new Blob(chunks, { type: recorder.mimeType || mimeType || "audio/webm" }));
    recorder.onstop = finish;
    recorder.onerror = finish;
  });

  const stopTracks = () => {
    for (const track of stream.getTracks()) track.stop();
  };

  const startedAt = performance.now();
  recorder.start(250);

  let settled = false;

  return {
    stop: async () => {
      if (settled) return null;
      settled = true;
      const durationMs = Math.round(performance.now() - startedAt);
      if (recorder.state !== "inactive") {
        try {
          recorder.stop();
        } catch {
          /* already stopped */
        }
      }
      const blob = await stopped;
      stopTracks();
      if (!blob.size) return null;
      const base64 = await wavBase64(blob);
      return { base64, durationMs };
    },
    cancel: () => {
      if (settled) return;
      settled = true;
      try {
        if (recorder.state !== "inactive") recorder.stop();
      } catch {
        /* already stopped */
      }
      stopTracks();
    },
  };
}

async function wavBase64(blob: Blob): Promise<string> {
  const AudioCtor = audioContextCtor();
  const OfflineCtor = offlineContextCtor();
  if (!AudioCtor || !OfflineCtor) throw new Error("This browser can't process audio.");

  const arrayBuffer = await blob.arrayBuffer();

  const decodeCtx = new AudioCtor();
  let decoded: AudioBuffer;
  try {
    decoded = await decodeCtx.decodeAudioData(arrayBuffer.slice(0));
  } finally {
    void decodeCtx.close().catch(() => undefined);
  }

  const frames = Math.max(1, Math.ceil(decoded.duration * TARGET_RATE));
  const offline = new OfflineCtor(1, frames, TARGET_RATE);
  const source = offline.createBufferSource();
  source.buffer = decoded;
  source.connect(offline.destination);
  source.start(0);

  const rendered = await offline.startRendering();
  const samples = rendered.getChannelData(0);
  const wav = encodeWav(samples, TARGET_RATE);

  return toBase64(wav);
}

function encodeWav(samples: Float32Array, sampleRate: number): Uint8Array {
  const bytes = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(bytes);

  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeAscii(view, 8, "WAVE");
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeAscii(view, 36, "data");
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i += 1) {
    const sample = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    offset += 2;
  }

  return new Uint8Array(bytes);
}

function writeAscii(view: DataView, offset: number, text: string) {
  for (let i = 0; i < text.length; i += 1) view.setUint8(offset + i, text.charCodeAt(i));
}

/** Chunked so a 20 s note never blows the argument stack. */
function toBase64(bytes: Uint8Array): string {
  const chunk = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}
