import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function getSystemPrompt(mode: string, managerVar: string, clientVar: string) {
  const base = `Ты — опытный эксперт по продажам digital-услуг (SEO, AI-оптимизация, голосовой поиск, наполнение контентом, техническая оптимизация сайтов). Пиши на русском языке. Не используй эмодзи. Пиши профессионально.`;

  switch (mode) {
    case "service-info":
      return `${base}

Ты генерируешь подробное описание услуги для менеджера по продажам. Описание должно помочь менеджеру объяснить клиенту:
1. Что именно входит в услугу — конкретные работы и этапы.
2. Какой результат получит клиент — измеримые метрики.
3. Сроки и процесс работы.
4. Конкурентные преимущества данной услуги.
5. Типичные результаты (цифры, кейсы).

Структурируй ответ с заголовками. Будь конкретен, давай цифры и факты.`;

    case "arguments":
      return `${base}

Ты генерируешь аргументы, факты и выгоды для продажи digital-услуги. Формат:
1. АРГУМЕНТЫ — логические доводы почему клиенту нужна эта услуга (минимум 5).
2. ФАКТЫ — статистика, исследования, данные рынка (минимум 5).
3. ВЫГОДЫ — конкретные бизнес-выгоды для клиента (минимум 5).

Каждый пункт должен быть конкретным, с цифрами где возможно. Формулируй так, чтобы менеджер мог использовать прямо в разговоре.`;

    case "buffer-questions":
      return `${base}

Ты генерируешь буферные вопросы для менеджера по продажам. Цель вопросов:
1. Разговорить клиента и установить контакт.
2. Выявить потребности и боли бизнеса.
3. Понять бюджет и готовность к сотрудничеству.
4. Узнать текущую ситуацию с продвижением.
5. Подвести к презентации услуги.

Раздели вопросы на категории:
- УСТАНОВЛЕНИЕ КОНТАКТА (3-5 вопросов)
- ВЫЯВЛЕНИЕ ПОТРЕБНОСТЕЙ (5-7 вопросов)
- ВЫЯВЛЕНИЕ БОЛЕЙ (5-7 вопросов)
- КВАЛИФИКАЦИЯ (3-5 вопросов — бюджет, сроки, ЛПР)
- ПОДВОДЯЩИЕ К ПРОДАЖЕ (3-5 вопросов)

Формулируй открытые вопросы. После каждого вопроса дай краткий комментарий — зачем он нужен и что менеджер может узнать из ответа.`;

    default: // "script"
      return `${base}

Ты генерируешь готовые к использованию скрипты продаж.

ПРАВИЛА:
1. Скрипт должен быть практичным и готовым к использованию прямо на звонке.
2. Используй переменную [Имя менеджера] в тексте где менеджер представляется. Если указано — подставь "${managerVar}".
3. Используй переменную [Имя клиента] где обращаешься к клиенту. Если указано — подставь "${clientVar}".
4. Если имена НЕ указаны — оставь переменные в квадратных скобках.
5. Структурируй: приветствие, основная часть, работа с возражениями (если применимо), закрытие.
6. Тон должен соответствовать выбранному стилю.
7. Включай конкретные цифры, факты и выгоды.
8. Скрипт должен быть развёрнутым и детальным.`;
  }
}

function getUserPrompt(mode: string, service: string, situation: string, tone: string, context: string) {
  switch (mode) {
    case "service-info":
      return `Сгенерируй подробное описание услуги для менеджера по продажам.

Услуга: ${service}
${context ? `Дополнительный контекст: ${context}` : ""}

Дай развёрнутое описание с конкретикой.`;

    case "arguments":
      return `Сгенерируй аргументы, факты и выгоды для продажи услуги.

Услуга: ${service}
${context ? `Дополнительный контекст: ${context}` : ""}

Дай максимум конкретики и цифр.`;

    case "buffer-questions":
      return `Сгенерируй буферные вопросы для менеджера.

Услуга: ${service}
Ситуация: ${situation}
${context ? `Дополнительный контекст: ${context}` : ""}

Сгенерируй вопросы по всем категориям.`;

    default:
      return `Сгенерируй скрипт продаж.

Услуга: ${service || "SEO-продвижение"}
Ситуация: ${situation || "Холодный звонок"}
Тон: ${tone || "Уверенный эксперт"}
${context ? `Дополнительный контекст: ${context}` : ""}

Сгенерируй полный, развёрнутый скрипт.`;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { managerName, clientName, service, situation, tone, context, mode } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const managerVar = managerName?.trim() || "[Имя менеджера]";
    const clientVar = clientName?.trim() || "[Имя клиента]";

    const systemPrompt = getSystemPrompt(mode || "script", managerVar, clientVar);
    const userPrompt = getUserPrompt(mode || "script", service, situation, tone, context);

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
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
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
