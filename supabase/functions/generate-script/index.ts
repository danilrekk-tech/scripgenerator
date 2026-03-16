import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function getToneDescription(tone: string): string {
  if (tone === "Не продающий") {
    return `Тон: мягкий, ненавязчивый. Ты НЕ продаёшь — ты показываешь клиенту что ему это объективно необходимо, и вы кстати можете с этим помочь по выгодной цене. Никакого давления, никаких прямых призывов купить. Подача: экспертная рекомендация, а не продажа.`;
  }
  return `Тон: ${tone || "Уверенный эксперт"}`;
}

function getPriceInstruction(priceRub: string, currency: string): string {
  if (!priceRub || Number(priceRub) <= 0) return "";
  
  const rates: Record<string, number> = { RUB: 1, UZS: 143.5, BYN: 0.0355, KZT: 5.35 };
  const symbols: Record<string, string> = { RUB: "₽", UZS: "сўм", BYN: "Br", KZT: "₸" };
  
  const rubAmount = Number(priceRub);
  let priceStr = `${rubAmount.toLocaleString("ru-RU")} ₽`;
  
  if (currency && currency !== "RUB" && rates[currency]) {
    const converted = Math.round(rubAmount * rates[currency]);
    priceStr = `${converted.toLocaleString("ru-RU")} ${symbols[currency]} (≈ ${priceStr})`;
  }
  
  return `\nВАЖНО: Цена комплекса услуг — ${priceStr}. Используй эту цену где уместно. Подавай цену как выгодное предложение.`;
}

function getEmailSubtypeInstruction(subtype: string, objection: string): string {
  switch (subtype) {
    case "follow-up":
      return `Тип письма: Повторное касание — клиент не ответил на коммерческое предложение. Нужно мягко напомнить, добавить ценность и создать повод для ответа.`;
    case "kp-with-price":
      return `Тип письма: Коммерческое предложение С указанием цены. Структурированное КП с описанием услуг, состава работ, сроков и стоимости.`;
    case "kp-no-price":
      return `Тип письма: Коммерческое предложение БЕЗ цены. Акцент на ценности, результатах и выгодах. Цена обсуждается на встрече/звонке.`;
    case "objection":
      return `Тип письма: Обработка возражения клиента в письме. Возражение клиента: "${objection}". Нужно мягко и аргументированно обработать это возражение.`;
    case "not-relevant":
      return `Тип письма: Клиент написал что услуга не актуальна, НО ему нужно что-то другое (полностью или частично). Контекст: "${objection}". Нужно зацепиться за реальную потребность и предложить альтернативное решение.`;
    case "custom":
      return `Тип письма: Свободная форма. Пиши письмо по контексту, указанному пользователем.`;
    default:
      return "";
  }
}

function getSystemPrompt(mode: string, managerVar: string, clientVar: string, tone: string, priceRub: string, currency: string, emailSubtype: string, emailObjection: string) {
  const base = `Ты — опытный эксперт по продажам digital-услуг (SEO, AI-оптимизация, голосовой поиск, наполнение контентом, техническая оптимизация сайтов, оптимизация под нейропоиск, юридические правки ФЗ-152/ФЗ-168). Пиши на русском языке. Не используй эмодзи. Пиши профессионально.`;

  const priceInstr = getPriceInstruction(priceRub, currency);

  switch (mode) {
    case "objection-training":
      return `${base}

Ты генерируешь реалистичные возражения клиентов для тренировки менеджеров по продажам.

ФОРМАТ: Для каждого возражения дай:
1. Само возражение (как именно это скажет клиент, в разговорном стиле)
2. Скрытый мотив (почему клиент так говорит на самом деле)
3. Рекомендуемый ответ (краткий, 2-3 предложения)

Нумеруй возражения. Делай их реалистичными и разнообразными.`;

    case "client-simulation":
      return `Ты играешь роль клиента в телефонном разговоре с менеджером по продажам digital-услуг. Ты НЕ ИИ — ты реальный клиент.

ВАЖНО: Отвечай ТОЛЬКО как клиент. Без пояснений, без метакомментариев. Только реплики клиента.

Твои ответы должны быть короткими (1-3 предложения), как в реальном разговоре.`;

    case "email":
      return `${base}

Ты генерируешь профессиональные деловые письма для менеджера по продажам digital-услуг.

${getEmailSubtypeInstruction(emailSubtype, emailObjection)}
${getToneDescription(tone)}
${priceInstr}

ПРАВИЛА:
1. Письмо должно быть готово к отправке — тема, приветствие, основная часть, призыв к действию, подпись.
2. Используй [Имя менеджера] для подписи. Если указано — подставь "${managerVar}".
3. Используй [Имя клиента] для обращения. Если указано — подставь "${clientVar}".
4. Если имена НЕ указаны — оставь переменные в квадратных скобках.
5. Письмо должно быть убедительным, но не навязчивым.
6. Структура: Тема письма → Приветствие → Основная часть → Призыв к действию → Подпись.`;

    case "knowledge-base":
      return `${base}

Ты генерируешь контент для внутренней базы знаний отдела продаж. Контент должен помочь менеджерам:
1. Глубоко понимать услуги и терминологию digital-маркетинга.
2. Отвечать на технические вопросы клиентов.
3. Понимать как работы выполняются на практике.

ФОРМАТ ОТВЕТА:
## ОПИСАНИЕ УСЛУГИ
Подробное описание: что это, зачем нужно, кому подходит.

## КЛЮЧЕВЫЕ ТЕРМИНЫ
Глоссарий терминов с простыми объяснениями (минимум 8-10 терминов).

## КАК ЭТО РАБОТАЕТ
Пошаговое описание процесса работ.

## DIY-ИНСТРУКЦИЯ
Краткая инструкция как клиент может самостоятельно выполнить базовые работы по этой услуге (5-10 шагов). Укажи что профессиональное выполнение даёт лучший результат.

## ЧАСТЫЕ ВОПРОСЫ КЛИЕНТОВ
5-8 вопросов с готовыми ответами для менеджера.

Будь конкретен, давай цифры и примеры.`;

    case "transcript-analysis":
      return `${base}

Тебе будет предоставлена транскрибация реального диалога между менеджером и клиентом (2 спикера). 
Твоя задача:
1. Проанализировать диалог: выявить ошибки менеджера, упущенные возможности, слабые места.
2. Определить потребности и боли клиента из диалога.
3. Сгенерировать ИДЕАЛЬНЫЙ скрипт для этой же ситуации — как НУЖНО было вести диалог.
4. Скрипт должен учитывать все детали из транскрибации.

${getToneDescription(tone)}
${priceInstr}

СТРУКТУРА ОТВЕТА:
## АНАЛИЗ ДИАЛОГА
- Что было хорошо
- Ошибки и упущенные возможности
- Выявленные потребности клиента

## ИДЕАЛЬНЫЙ СКРИПТ
Полный скрипт от начала до конца, учитывающий контекст из диалога.

Используй переменную [Имя менеджера] в тексте где менеджер представляется. Если указано — подставь "${managerVar}".
Используй переменную [Имя клиента] где обращаешься к клиенту. Если указано — подставь "${clientVar}".
Если имена НЕ указаны — оставь переменные в квадратных скобках.`;

    case "service-info":
      return `${base}

Ты генерируешь подробное описание услуги для менеджера по продажам. Описание должно помочь менеджеру объяснить клиенту:
1. Что именно входит в услугу — конкретные работы и этапы.
2. Какой результат получит клиент — измеримые метрики.
3. Сроки и процесс работы.
4. Конкурентные преимущества данной услуги.
5. Типичные результаты (цифры, кейсы).
${priceInstr}

Структурируй ответ с заголовками. Будь конкретен, давай цифры и факты.`;

    case "arguments":
      return `${base}

Ты генерируешь аргументы, факты и выгоды для продажи digital-услуги. Формат:
1. АРГУМЕНТЫ — логические доводы почему клиенту нужна эта услуга (минимум 5).
2. ФАКТЫ — статистика, исследования, данные рынка (минимум 5).
3. ВЫГОДЫ — конкретные бизнес-выгоды для клиента (минимум 5).
${priceInstr}

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
6. ${getToneDescription(tone)}
7. Включай конкретные цифры, факты и выгоды.
8. Скрипт должен быть развёрнутым и детальным.
${priceInstr}`;
  }
}

function getUserPrompt(mode: string, service: string, situation: string, tone: string, context: string, transcript: string, emailSubtype: string, emailObjection: string, extraParams?: Record<string, string>) {
  switch (mode) {
    case "objection-training": {
      const difficulty = extraParams?.difficulty || "medium";
      const count = extraParams?.count || "5";
      const diffLabel = difficulty === "easy" ? "простые, базовые" : difficulty === "hard" ? "сложные, нестандартные, каверзные" : "средней сложности, типичные";
      return `Сгенерируй ${count} реалистичных возражений клиента при продаже услуги "${service}".

Сложность: ${diffLabel}.
${context ? `Дополнительный контекст: ${context}` : ""}

Для каждого возражения дай: само возражение, скрытый мотив и рекомендуемый ответ.`;
    }

    case "client-simulation": {
      let simContext: any = {};
      try { simContext = JSON.parse(context || "{}"); } catch {}
      return `Ты — ${simContext.clientType || "клиент"}. Настроение: ${simContext.mood || "нейтральное"}. Бюджет: ${simContext.budget || "неизвестен"}. Уровень возражений: ${simContext.objectionLevel || "средний"}.

Менеджер продаёт услугу: ${service}.

История диалога:
${simContext.history || "Диалог только начался."}

Ответь как клиент. Коротко, 1-3 предложения. Веди себя естественно.`;
    }

    case "email":
      return `Сгенерируй деловое письмо клиенту.

Услуга: ${service}
${context ? `Дополнительный контекст: ${context}` : ""}
${emailSubtype === "objection" ? `Возражение: ${emailObjection}` : ""}
${emailSubtype === "not-relevant" ? `Что нужно клиенту: ${emailObjection}` : ""}

Сгенерируй готовое к отправке письмо.`;

    case "knowledge-base":
      return `Сгенерируй контент для базы знаний.

Услуга: ${service}
${context ? `Дополнительный контекст: ${context}` : ""}

Дай максимально полное описание с терминами, процессом работ, DIY-инструкцией и FAQ.`;

    case "transcript-analysis":
      return `Проанализируй следующую транскрибацию диалога и сгенерируй идеальный скрипт.

Услуга: ${service}
${context ? `Дополнительный контекст: ${context}` : ""}

ТРАНСКРИБАЦИЯ ДИАЛОГА:
${transcript}

Дай детальный анализ и полный идеальный скрипт.`;

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
${tone ? `Тон: ${tone}` : ""}
${context ? `Дополнительный контекст: ${context}` : ""}

Сгенерируй полный, развёрнутый скрипт.`;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { managerName, clientName, service, situation, tone, context, mode, transcript, priceRub, currency, emailSubtype, emailObjection } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const managerVar = managerName?.trim() || "[Имя менеджера]";
    const clientVar = clientName?.trim() || "[Имя клиента]";

    const systemPrompt = getSystemPrompt(mode || "script", managerVar, clientVar, tone, priceRub, currency, emailSubtype || "follow-up", emailObjection || "");
    const userPrompt = getUserPrompt(mode || "script", service, situation, tone, context, transcript, emailSubtype || "follow-up", emailObjection || "");

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