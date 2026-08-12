import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/** Разбор звонка: аудио -> транскрипт + скоринг (Discovery / возражения / моменты). */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

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

    const system = `Ты — руководитель отдела продаж и коуч. Тебе дают запись звонка менеджера (${manager || "[Имя менеджера]"}) по услуге «${service || "SEO-продвижение"}».
Сначала расшифруй звонок с разделением на спикеров (manager / client) и таймкодами в секундах.
Затем разбери его по методологиям SPIN и BANT.
Отвечай СТРОГО валидным JSON без markdown-обёртки, по схеме:
{
  "transcript": [{"t": number, "speaker": "manager"|"client", "text": string}],
  "discovery": [{"key": "SPIN-S-0"|"BANT-B-0"|..., "method": "SPIN"|"BANT", "label": string, "closed": boolean, "t": number|null, "note": string|null}],
  "objections": [{"objection": string, "category": string, "t": number, "quality": "good"|"medium"|"failed", "recommendation": string}],
  "moments": [{"t": number, "quote": string, "insight": string, "type": "signal"|"risk"|"win"|"miss"}],
  "score": number,
  "summary": string,
  "pipelineStageSuggestion": string,
  "nextSteps": [string]
}
Комментарии и рекомендации — на русском, конкретные, с опорой на цитаты из звонка. score — 0..100.
В discovery включи 8-10 пунктов (по SPIN: S/P/I/N, по BANT: B/A/N/T). В moments — 3-5 карточек.`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: system },
          {
            role: "user",
            content: [
              { type: "text", text: `Разбери этот звонок (файл: ${fileName || "call"}). Верни только JSON.` },
              { type: "input_audio", input_audio: { data: audioBase64, format: audioFormat || "mp3" } },
            ],
          },
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

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error).message || e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
