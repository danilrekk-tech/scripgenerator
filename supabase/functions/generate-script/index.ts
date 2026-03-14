import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { managerName, clientName, service, situation, tone, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const managerVar = managerName?.trim() || "[Имя менеджера]";
    const clientVar = clientName?.trim() || "[Имя клиента]";

    const systemPrompt = `Ты — опытный скриптолог для продаж digital-услуг (SEO, AI-оптимизация, голосовой поиск, наполнение контентом, техническая оптимизация сайтов). Ты генерируешь готовые к использованию скрипты продаж.

ПРАВИЛА:
1. Пиши на русском языке.
2. Скрипт должен быть практичным и готовым к использованию прямо на звонке.
3. Используй переменную [Имя менеджера] в тексте где менеджер представляется или ссылается на себя. Если имя менеджера указано — подставь "${managerVar}".
4. Используй переменную [Имя клиента] в тексте где обращаешься к клиенту. Если имя клиента указано — подставь "${clientVar}".
5. Если имена НЕ указаны — оставь переменные [Имя менеджера] и [Имя клиента] как есть в квадратных скобках.
6. Структурируй скрипт: приветствие, основная часть, работа с возражениями (если применимо), закрытие.
7. Тон должен соответствовать выбранному стилю.
8. Включай конкретные цифры, факты и выгоды для клиента.
9. Не используй эмодзи. Пиши профессионально.
10. Скрипт должен быть развёрнутым и детальным, покрывая все этапы разговора.`;

    const userPrompt = `Сгенерируй скрипт продаж.

Услуга: ${service || "SEO-продвижение"}
Ситуация: ${situation || "Холодный звонок"}
Тон: ${tone || "Уверенный эксперт"}
${context ? `Дополнительный контекст: ${context}` : ""}

Сгенерируй полный, развёрнутый скрипт.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("generate-script error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
