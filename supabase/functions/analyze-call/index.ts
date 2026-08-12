import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface Line { t: number; speaker: "manager" | "client"; text: string }

/** base64 -> Uint8Array без переполнения стека */
function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** Транскрипция через ElevenLabs Scribe с диаризацией. */
async function transcribeWithElevenLabs(
  apiKey: string,
  bytes: Uint8Array,
  fileName: string,
): Promise<{ lines: Line[]; fullText: string; chars: number }> {
  const form = new FormData();
  form.append("file", new Blob([bytes]), fileName || "call.mp3");
  form.append("model_id", "scribe_v2");
  form.append("diarize", "true");
  form.append("tag_audio_events", "false");

  const resp = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
    method: "POST",
    headers: { "xi-api-key": apiKey },
    body: form,
  });

  if (!resp.ok) {
    const detail = await resp.text();
    console.error(`ElevenLabs STT failed [${resp.status}]: ${detail}`);
    throw Object.assign(new Error("elevenlabs_stt_failed"), { status: resp.status, detail });
  }

  const data = await resp.json();
  const words: any[] = Array.isArray(data?.words) ? data.words : [];
  const fullText = String(data?.text || "");

  // Собираем реплики по смене спикера
  const lines: Line[] = [];
  const speakers: string[] = [];
  for (const w of words) {
    if (w?.type && w.type !== "word" && w.type !== "spacing") continue;
    const sp = String(w?.speaker ?? "speaker_0");
    if (!speakers.includes(sp)) speakers.push(sp);
    const prev = lines[lines.length - 1];
    const isSame = prev && prev.speaker === (speakers.indexOf(sp) === 0 ? "manager" : "client");
    const role: "manager" | "client" = speakers.indexOf(sp) === 0 ? "manager" : "client";
    const text = String(w?.text ?? "");
    if (isSame) prev!.text = (prev!.text + " " + text).replace(/\s+/g, " ").trim();
    else lines.push({ t: Math.max(0, Math.round(Number(w?.start) || 0)), speaker: role, text: text.trim() });
  }

  if (!lines.length && fullText) lines.push({ t: 0, speaker: "manager", text: fullText });

  return { lines: lines.filter((l) => l.text), fullText: fullText || lines.map((l) => l.text).join(" "), chars: fullText.length };
}

/** Разбор звонка: ElevenLabs (транскрипт) -> LLM (скоринг). */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");

    const body = await req.json();
    const { audioBase64, audioFormat, manager, service, fileName } = body as {
      audioBase64?: string;
      audioFormat?: string;
      manager?: string;
      service?: string;
      fileName?: string;
    };

    if (!audioBase64) {
      return new Response(JSON.stringify({ error: "audioBase64 is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let transcript: Line[] = [];
    let transcriptText = "";
    let usedChars = 0;
    let sttProvider = "none";

    if (ELEVENLABS_API_KEY) {
      try {
        const bytes = b64ToBytes(audioBase64);
        const r = await transcribeWithElevenLabs(
          ELEVENLABS_API_KEY,
          bytes,
          fileName || `call.${audioFormat || "mp3"}`,
        );
        transcript = r.lines;
        transcriptText = r.fullText;
        usedChars = r.chars;
        sttProvider = "elevenlabs";
      } catch (e) {
        const err = e as any;
        return new Response(
          JSON.stringify({ error: "stt_error", status: err?.status ?? 502, detail: err?.detail ?? String(err?.message || err) }),
          { status: err?.status === 401 || err?.status === 429 ? err.status : 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    const system = `Ты — руководитель отдела продаж и коуч. Тебе дают расшифровку звонка менеджера (${manager || "[Имя менеджера]"}) по услуге «${service || "SEO-продвижение"}».
Разбери звонок по методологиям SPIN и BANT.
Отвечай СТРОГО валидным JSON без markdown-обёртки, по схеме:
{
  "discovery": [{"key": "SPIN-S-0"|"BANT-B-0"|..., "method": "SPIN"|"BANT", "label": string, "closed": boolean, "t": number|null, "note": string|null}],
  "objections": [{"objection": string, "category": string, "t": number, "quality": "good"|"medium"|"failed", "recommendation": string}],
  "moments": [{"t": number, "quote": string, "insight": string, "type": "signal"|"risk"|"win"|"miss"}],
  "score": number,
  "summary": string,
  "pipelineStageSuggestion": string,
  "nextSteps": [string]
}
Таймкоды (t) бери из расшифровки в секундах. Комментарии — на русском, конкретные, с опорой на цитаты.
В discovery включи 8-10 пунктов (SPIN: S/P/I/N, BANT: B/A/N/T). В moments — 3-5 карточек. score — 0..100.`;

    const transcriptForModel = transcript.length
      ? transcript.map((l) => `[${l.t}s] ${l.speaker === "manager" ? "Менеджер" : "Клиент"}: ${l.text}`).join("\n")
      : transcriptText;

    const userContent: any[] = transcriptForModel
      ? [{ type: "text", text: `Расшифровка звонка (файл: ${fileName || "call"}):\n\n${transcriptForModel}\n\nВерни только JSON.` }]
      : [
          { type: "text", text: `Расшифруй и разбери этот звонок (файл: ${fileName || "call"}). Верни только JSON, добавив в него поле "transcript": [{"t":number,"speaker":"manager"|"client","text":string}].` },
          { type: "input_audio", input_audio: { data: audioBase64, format: audioFormat || "mp3" } },
        ];

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: system },
          { role: "user", content: userContent },
        ],
      }),
    });

    if (!resp.ok) {
      const detail = await resp.text();
      return new Response(JSON.stringify({ error: "ai_error", status: resp.status, detail }), {
        status: resp.status === 429 || resp.status === 402 ? resp.status : 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const raw: string = data?.choices?.[0]?.message?.content ?? "";
    const cleaned = raw.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    const analysis = JSON.parse(start >= 0 ? cleaned.slice(start, end + 1) : cleaned);
    if (transcript.length) analysis.transcript = transcript;

    return new Response(JSON.stringify({ analysis, sttProvider, usedChars }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error).message || e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
