import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/** Остаток квоты ElevenLabs (символы/«токены») для индикатора в UI. */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const apiKey = Deno.env.get("ELEVENLABS_API_KEY");
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "ElevenLabs is not connected to this project" }), {
      status: 503,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const resp = await fetch("https://api.elevenlabs.io/v1/user/subscription", {
      headers: { "xi-api-key": apiKey },
    });
    const text = await resp.text();
    if (!resp.ok) {
      console.error(`ElevenLabs subscription failed [${resp.status}]: ${text}`);
      return new Response(JSON.stringify({ error: "elevenlabs_error", status: resp.status, details: text }), {
        status: resp.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const s = JSON.parse(text);
    const used = Number(s?.character_count ?? 0);
    const limit = Number(s?.character_limit ?? 0);
    return new Response(
      JSON.stringify({
        used,
        limit,
        remaining: Math.max(0, limit - used),
        tier: String(s?.tier ?? ""),
        resetsAt: s?.next_character_count_reset_unix ? Number(s.next_character_count_reset_unix) * 1000 : null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error).message || e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
