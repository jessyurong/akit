import { NextResponse } from "next/server";
import { MOCHI_MEMORY } from "../../../lib/mochi-memory";

/**
 * POST /api/mochi
 *
 * Takes a short base64 WAV voice note, asks Gemini what it heard and how Mochi
 * should answer, and returns { reply, heard }. The API key never leaves the
 * server.
 */

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_AUDIO_CHARS = 2_000_000;

const MOCHI_PROMPT = `Mochi is a gentle, playful strawberry companion in a stress-relief app. Reply in the same language as the user (English, Filipino, or Taglish). 1-3 short sentences, written to be spoken, warm and not preachy. Listen first and validate the feeling, then maybe offer ONE tiny idea. Not a therapist, no diagnoses or medical advice. If the audio is silent or unclear, ask them to repeat. If the user mentions wanting to hurt themselves or die, respond with real care, encourage reaching a trusted real person now, and mention the NCMH Crisis Hotline in the Philippines (1553 or 0917-899-8727, 24/7). No jokes in that case.`;

const MEMORY_BLOCK = `Things you know about your creator, Jessie. Use them only when the user asks about Jessie or when it's clearly relevant. Never invent facts beyond this list. If the answer isn't here, say you don't know that one yet. Stay in Mochi's voice (warm, 1-3 short sentences).
${MOCHI_MEMORY}`;

const SYSTEM_INSTRUCTION = `${MOCHI_PROMPT}\n${MEMORY_BLOCK}`;

/* --- rate limit: 10 voice notes per minute per IP, in memory --- */

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 10;
const HITS = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (HITS.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_REQUESTS) {
    HITS.set(ip, recent);
    return true;
  }
  recent.push(now);
  HITS.set(ip, recent);

  // Keep the map from growing forever on a long-lived server.
  if (HITS.size > 5_000) {
    for (const [key, times] of HITS) {
      if (!times.some((t) => now - t < WINDOW_MS)) HITS.delete(key);
    }
  }
  return false;
}

type GeminiPayload = {
  candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[];
};

const API_BASE = "https://generativelanguage.googleapis.com/v1beta";

/** One generateContent call with its own timeout. */
function genOnce(key: string, model: string, body: unknown, timeoutMs: number) {
  return fetch(`${API_BASE}/models/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
    cache: "no-store",
  });
}

function extractReply(payload: GeminiPayload): { reply: string; heard: string | null } | null {
  const parts = payload.candidates?.[0]?.content?.parts;
  const raw = (parts ?? [])
    .filter((part) => !part?.thought)
    .map((part) => (typeof part?.text === "string" ? part.text : ""))
    .join("")
    .trim();
  if (!raw) return null;

  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/```$/, "").trim();
  try {
    const parsed = JSON.parse(cleaned) as { reply?: unknown; heard?: unknown };
    if (typeof parsed.reply === "string" && parsed.reply.trim()) {
      return {
        reply: parsed.reply.trim(),
        heard: typeof parsed.heard === "string" && parsed.heard.trim() ? parsed.heard.trim() : null,
      };
    }
  } catch {
    /* model ignored the schema — fall back to the raw text */
  }
  return { reply: cleaned, heard: null };
}

type Trial = {
  label: string;
  status: number | string;
  ms: number;
  reply?: string;
  error?: string;
};

/** Probe limiter — each call fires a few tiny Gemini requests. */
const PROBE_HITS = new Map<string, number[]>();
function probeLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (PROBE_HITS.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= 6) {
    PROBE_HITS.set(ip, recent);
    return true;
  }
  recent.push(now);
  PROBE_HITS.set(ip, recent);
  return false;
}

async function trial(
  label: string,
  key: string,
  model: string,
  genConfig: Record<string, unknown>,
): Promise<Trial> {
  const started = Date.now();
  try {
    const res = await genOnce(
      key,
      model,
      {
        contents: [{ role: "user", parts: [{ text: "Reply with the single word: ok" }] }],
        generationConfig: { maxOutputTokens: 24, temperature: 0, ...genConfig },
      },
      12_000,
    );
    const ms = Date.now() - started;
    const raw = await res.text();
    if (!res.ok) return { label, status: res.status, ms, error: raw.slice(0, 240) };
    let reply = "(empty)";
    try {
      reply = extractReply(JSON.parse(raw) as GeminiPayload)?.reply ?? "(empty)";
    } catch {
      reply = raw.slice(0, 80);
    }
    return { label, status: res.status, ms, reply };
  } catch (error) {
    return {
      label,
      status: "network-error",
      ms: Date.now() - started,
      error: error instanceof Error ? `${error.name}: ${error.message}` : String(error),
    };
  }
}

/**
 * GET /api/mochi — setup check. Open it in the browser to see whether the key
 * is visible to the deployment, whether Gemini accepts it, and how fast each
 * model variant answers.
 */
export async function GET(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local";

  const key = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-flash-latest";
  if (!key) return NextResponse.json({ configured: false, model });
  if (probeLimited(ip)) {
    return NextResponse.json({ configured: true, error: "Probe limit reached. Wait a minute." }, { status: 429 });
  }

  let modelStatus: number | string = 0;
  let modelError: string | undefined;
  try {
    const meta = await fetch(`${API_BASE}/models/${encodeURIComponent(model)}`, {
      headers: { "x-goog-api-key": key },
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
    modelStatus = meta.status;
    if (!meta.ok) modelError = (await meta.text()).slice(0, 240);
  } catch {
    modelStatus = "network-error";
  }

  const noThink = { thinkingConfig: { thinkingBudget: 0 } };
  const tests = await Promise.all([
    trial(`${model} + no-think`, key, model, noThink),
    trial(`${model} + default thinking`, key, model, {}),
    trial("gemini-2.5-flash + no-think", key, "gemini-2.5-flash", noThink),
    trial("gemini-flash-lite-latest + no-think", key, "gemini-flash-lite-latest", noThink),
  ]);

  return NextResponse.json(
    {
      configured: true,
      key: {
        length: key.length,
        prefix: key.slice(0, 3),
        hasWhitespace: key !== key.trim(),
        looksLikeAIza: /^AIza[0-9A-Za-z_-]{20,}$/.test(key.trim()),
        looksLikeAQ: /^AQ\.[0-9A-Za-z._-]{10,}$/.test(key.trim()),
      },
      model,
      modelStatus,
      modelError,
      tests,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Send JSON like { \"audio\": \"...\" }." }, { status: 400 });
  }

  const audio = (body as { audio?: unknown } | null)?.audio;
  if (typeof audio !== "string" || !audio) {
    return NextResponse.json({ error: "Missing audio." }, { status: 400 });
  }
  if (audio.length > MAX_AUDIO_CHARS) {
    return NextResponse.json({ error: "That voice note is too long." }, { status: 413 });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local";
  if (rateLimited(ip)) {
    return NextResponse.json({ error: "Too many voice notes. Take a tiny breath." }, { status: 429 });
  }

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    console.error("Mochi voice: GEMINI_API_KEY is not set.");
    return NextResponse.json({ error: "Mochi's voice isn't configured yet." }, { status: 500 });
  }

  const model = process.env.GEMINI_MODEL || "gemini-flash-latest";

  const makeBody = (noThink: boolean) => ({
    systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { mimeType: "audio/wav", data: audio } },
          { text: "Voice message from the user. Reply as Mochi." },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.9,
      maxOutputTokens: 320,
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          heard: { type: "STRING" },
          reply: { type: "STRING" },
        },
        required: ["reply"],
      },
      // Mochi answers in 1-3 sentences; deep thinking just adds latency.
      ...(noThink ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
    },
  });

  try {
    let upstream = await genOnce(key, model, makeBody(true), 30_000);

    // Some models reject thinkingBudget — retry plainly if that was the complaint.
    if (upstream.status === 400) {
      const detail = await upstream.clone().text().catch(() => "");
      if (/thinking/i.test(detail)) {
        upstream = await genOnce(key, model, makeBody(false), 30_000);
      }
    }

    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => "");
      console.error(`Mochi voice: Gemini replied ${upstream.status}: ${detail.slice(0, 400)}`);
      return NextResponse.json({ error: "Mochi couldn't think of a reply." }, { status: 502 });
    }

    const payload = (await upstream.json()) as GeminiPayload;
    const result = extractReply(payload);
    if (!result) {
      return NextResponse.json({ error: "Mochi didn't catch that one." }, { status: 502 });
    }

    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Mochi voice: request failed", error);
    return NextResponse.json({ error: "Mochi couldn't hear that one." }, { status: 502 });
  }
}
