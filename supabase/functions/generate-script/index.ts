import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function getToneDescription(tone: string): string {
  if (tone === "Не продающий") return `Тон: мягкий, ненавязчивый. Ты НЕ продаёшь — ты показываешь клиенту что ему это объективно необходимо.`;
  if (tone === "Простыми словами") return `Тон: максимально простой. Никаких терминов — заменяй простыми аналогиями.`;
  return `Тон: ${tone || "Уверенный эксперт"}`;
}

function getScriptLengthInstruction(length: string): string {
  switch (length) {
    case "short": return "\nДЛИНА: Короткий — 5-8 реплик максимум.";
    case "long": return "\nДЛИНА: Подробный — развёрнутые реплики, несколько вариантов.";
    case "detailed": return "\nДЛИНА: Максимально детальный — все возможные сценарии.";
    default: return "\nДЛИНА: Средний — оптимальный баланс.";
  }
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
  return `\nЦена комплекса услуг — ${priceStr}. Подавай как выгодное предложение.`;
}

function getEmailSubtypeInstruction(subtype: string, objection: string): string {
  switch (subtype) {
    case "follow-up": return `Тип: Повторное касание — клиент не ответил на КП.`;
    case "kp-with-price": return `Тип: КП с ценой. Структурированное с составом работ и стоимостью.`;
    case "kp-no-price": return `Тип: КП без цены. Акцент на ценности, цена на встрече.`;
    case "objection": return `Тип: Обработка возражения: "${objection}".`;
    case "not-relevant": return `Тип: Не актуально, но нужно: "${objection}". Зацепись за реальную потребность.`;
    case "custom": return `Тип: Свободная форма по контексту.`;
    default: return "";
  }
}

function getDozimSubtypeInstruction(subtype: string): string {
  switch (subtype) {
    case "thinking": return `Клиент "подумает" и пропал. Вернуть в диалог без навязчивости.`;
    case "invoice-sent": return `Счёт выставлен, тянет с оплатой. Ускорить процесс.`;
    case "silent-after-kp": return `Отправили КП — молчит. Вернуть контакт.`;
    default: return "";
  }
}

function getSystemPrompt(mode: string, managerVar: string, clientVar: string, tone: string, priceRub: string, currency: string, emailSubtype: string, emailObjection: string, scriptLength: string, dozimSubtype: string, transcriptSubmode: string) {
  const base = `Ты — опытный эксперт по продажам digital-услуг (SEO, AI-оптимизация, голосовой поиск, наполнение контентом, техническая оптимизация, нейропоиск, юридические правки ФЗ-152/ФЗ-168). Пиши на русском. Без эмодзи. Профессионально.

КРИТИЧЕСКИ ВАЖНО: Если в контексте указана информация об услуге (описание и ключевые пункты), используй ТОЛЬКО эти данные. НЕ выдумывай.`;

  const priceInstr = getPriceInstruction(priceRub, currency);
  const lengthInstr = getScriptLengthInstruction(scriptLength);
  const nameInstr = `Используй "${managerVar}" для менеджера и "${clientVar}" для клиента. Если не указаны — оставь [Имя менеджера] / [Имя клиента].`;

  switch (mode) {
    case "touch-chain":
      return `${base}\n\nТы генерируешь ЦЕПОЧКУ КАСАНИЙ — серию из 5-7 последовательных сообщений/звонков клиенту с интервалами (день 1, 3, 5, 7, 14, 21, 30). Каждое касание должно быть уникальным и добавлять ценность.\n${getToneDescription(tone)}\n${priceInstr}\n${nameInstr}\n\nСТРУКТУРА:\nДля каждого касания укажи:\n- Номер и день\n- Канал (звонок/email/мессенджер)\n- Цель касания\n- Полный текст/скрипт\n- Ожидаемая реакция клиента`;

    case "funnel":
      return `${base}\n\nТы генерируешь скрипты для КАЖДОГО ЭТАПА ВОРОНКИ ПРОДАЖ:\n1. Первый контакт (холодный)\n2. Квалификация (выявление потребностей)\n3. Презентация (демонстрация ценности)\n4. Работа с возражениями\n5. Закрытие сделки\n6. Пост-продажа (удержание)\n\n${getToneDescription(tone)}\n${priceInstr}\n${lengthInstr}\n${nameInstr}\n\nДля каждого этапа дай полный скрипт с переходами между этапами.`;

    case "anti-script":
      return `${base}\n\nТы генерируешь АНТИСКРИПТ — разбор типичных ОШИБОК менеджеров при продаже услуги. Формат:\n\n1. ОШИБКА — как менеджер говорит неправильно (реальная фраза)\n2. ПОЧЕМУ ПЛОХО — объяснение почему это отталкивает клиента\n3. КАК ПРАВИЛЬНО — исправленная версия фразы\n4. ОБЪЯСНЕНИЕ — почему правильная версия работает лучше\n\nМинимум 10 ошибок. Упорядочи от грубых к тонким.`;

    case "utp":
      return `${base}\n\nТы генерируешь УНИКАЛЬНЫЕ ТОРГОВЫЕ ПРЕДЛОЖЕНИЯ (УТП) для услуги. Формат:\n\n1. ОСНОВНОЕ УТП — главное предложение (1 предложение)\n2. ПОДДЕРЖИВАЮЩИЕ УТП — 5-7 дополнительных\n3. УТП ПО БОЛЯМ — для каждой типичной боли клиента\n4. УТП-ФОРМУЛЫ — готовые фразы для использования в разговоре\n5. ПОЗИЦИОНИРОВАНИЕ — как отстроиться от конкурентов\n${priceInstr}`;

    case "sms":
      return `${base}\n\nТы генерируешь КОРОТКИЕ SMS-СООБЩЕНИЯ (до 160 символов каждое) для продажи услуги.\n\nСгенерируй 10 вариантов SMS на разные ситуации:\n- Первый контакт\n- Напоминание\n- Акция/скидка\n- После звонка\n- Дожим\n${priceInstr}\n${nameInstr}\n\nКаждое SMS должно содержать: зацепку, ценность и призыв к действию. Строго до 160 символов.`;

    case "voicemail":
      return `${base}\n\nТы генерируешь скрипты для ГОЛОСОВОГО СООБЩЕНИЯ (автоответчик) когда клиент не берёт трубку.\n\nСгенерируй 5 вариантов разной длины (15 сек, 30 сек, 45 сек).\n${getToneDescription(tone)}\n${nameInstr}\n\nПравила:\n- Представься\n- Кратко обозначь причину звонка\n- Дай ценность (зачем перезванивать)\n- Оставь контакт`;

    case "social-posts":
      return `${base}\n\nТы генерируешь ПРОДАЮЩИЕ ПОСТЫ для социальных сетей об услуге.\n\nСгенерируй по 2 поста для каждой площадки:\n1. Telegram-канал (информационный + продающий)\n2. ВКонтакте (экспертный + кейсовый)\n3. LinkedIn (B2B, деловой)\n\nКаждый пост: заголовок, основной текст, призыв к действию.\n${priceInstr}`;

    case "crm-template":
      return `${base}\n\nТы генерируешь ШАБЛОНЫ ЗАМЕТОК ДЛЯ CRM по услуге. Формат:\n\n1. ШАБЛОН КАРТОЧКИ СДЕЛКИ — какие поля заполнять\n2. ШАБЛОНЫ КОММЕНТАРИЕВ — для каждого этапа воронки\n3. ШАБЛОНЫ ЗАДАЧ — типовые задачи по ведению клиента\n4. СКРИПТ КВАЛИФИКАЦИИ — чек-лист вопросов с полями для ответов\n5. ШАБЛОН ИТОГОВ ЗВОНКА — структура записи результата\n\nВсё должно быть готово к копированию в CRM (Bitrix24, amoCRM, Salesforce).`;

    case "checklist":
      return `${base}\n\nТы генерируешь ЧЕК-ЛИСТ ЗВОНКА — пошаговый план что спросить/сказать при продаже услуги.\n\nФормат:\n□ Пункт (что сделать/сказать)\n→ Подсказка (как именно)\n\nРазделы:\n1. ПОДГОТОВКА (до звонка)\n2. НАЧАЛО (первые 30 секунд)\n3. ВЫЯВЛЕНИЕ ПОТРЕБНОСТЕЙ\n4. ПРЕЗЕНТАЦИЯ\n5. РАБОТА С ВОЗРАЖЕНИЯМИ\n6. ЗАКРЫТИЕ\n7. ПОСЛЕ ЗВОНКА\n${priceInstr}`;

    case "glossary":
      return `${base}\n\nТы генерируешь ГЛОССАРИЙ ТЕРМИНОВ для менеджеров по продажам digital-услуг.\n\nДля каждого термина:\n- Термин\n- Простое определение (для менеджера)\n- Объяснение для клиента (как объяснить простыми словами)\n- Пример использования в разговоре\n\nМинимум 20 терминов, отсортированных по алфавиту. Включи термины специфичные для указанной услуги.`;

    case "script-scoring":
      return `${base}\n\nТы ОЦЕНИВАЕШЬ качество скрипта продаж по 10 критериям (каждый от 1 до 10):\n\n1. Приветствие и захват внимания\n2. Выявление потребностей\n3. Презентация ценности\n4. Работа с возражениями\n5. Закрытие сделки\n6. Аргументация\n7. Эмоциональный интеллект\n8. Структура и логика\n9. Конкретность (цифры, факты)\n10. Готовность к использованию\n\nДай общий балл (среднее), оценку по каждому критерию с пояснением, и 3-5 конкретных рекомендаций по улучшению.\n\nФормат: чистый, структурированный, с цифрами.`;

    case "dozim":
      return `${base}\n\nДожим клиентов.\n${getDozimSubtypeInstruction(dozimSubtype)}\n${getToneDescription(tone)}\n${priceInstr}\n${lengthInstr}\n${nameInstr}\n\nДай 2-3 варианта подхода (мягкий, средний, настойчивый).\n\n## СКРИПТ ДОЖИМА\n## РЕКОМЕНДАЦИИ ДЛЯ МЕНЕДЖЕРА`;

    case "messenger":
      return `${base}\n\nСкрипты для мессенджеров (WhatsApp, Telegram).\n${getToneDescription(tone)}\n${priceInstr}\n${lengthInstr}\n${nameInstr}\n\nСообщения КОРОТКИЕ — 1-3 предложения. Серия сообщений, не один текст.\n\n## СКРИПТ ДЛЯ МЕССЕНДЖЕРА\n## ВАРИАНТЫ ОТВЕТОВ\n## РЕКОМЕНДАЦИИ`;

    case "objection-training":
      return `${base}\n\nГенерируй реалистичные возражения для тренировки.\nДля каждого: возражение, скрытый мотив, рекомендуемый ответ.`;

    case "client-simulation":
      return `Ты играешь роль клиента. Ты НЕ ИИ — ты реальный клиент. Отвечай ТОЛЬКО как клиент. Коротко, 1-3 предложения.`;

    case "email":
      return `${base}\n\nДеловые письма.\n${getEmailSubtypeInstruction(emailSubtype, emailObjection)}\n${getToneDescription(tone)}\n${priceInstr}\n${nameInstr}\n\nСтруктура: Тема → Приветствие → Основная часть → Призыв к действию → Подпись.`;

    case "knowledge-base":
      return `${base}\n\nКонтент для базы знаний.\n## ОПИСАНИЕ УСЛУГИ\n## КЛЮЧЕВЫЕ ТЕРМИНЫ (8-10)\n## КАК ЭТО РАБОТАЕТ\n## DIY-ИНСТРУКЦИЯ\n## ЧАСТЫЕ ВОПРОСЫ (5-8)`;

    case "transcript-analysis":
      if (transcriptSubmode === "next-call") {
        return `${base}\n\nАнализ диалога и скрипт следующего звонка.\n${getToneDescription(tone)}\n${priceInstr}\n${nameInstr}\n\n## АНАЛИЗ ПРЕДЫДУЩЕГО ДИАЛОГА\n## СКРИПТ СЛЕДУЮЩЕГО ЗВОНКА\n## РЕКОМЕНДАЦИИ`;
      }
      return `${base}\n\nАнализ диалога: ошибки, упущения, идеальный скрипт.\n${getToneDescription(tone)}\n${priceInstr}\n${nameInstr}\n\n## АНАЛИЗ ДИАЛОГА\n## ИДЕАЛЬНЫЙ СКРИПТ`;

    case "service-info":
      return `${base}\n\nПодробное описание услуги: что входит, результат, сроки, преимущества.\n${priceInstr}`;

    case "arguments":
      return `${base}\n\nАргументы, факты и выгоды (минимум по 5 каждого). С цифрами.\n${priceInstr}`;

    case "buffer-questions":
      return `${base}\n\nБуферные вопросы по категориям:\n- УСТАНОВЛЕНИЕ КОНТАКТА (3-5)\n- ВЫЯВЛЕНИЕ ПОТРЕБНОСТЕЙ (5-7)\n- ВЫЯВЛЕНИЕ БОЛЕЙ (5-7)\n- КВАЛИФИКАЦИЯ (3-5)\n- ПОДВОДЯЩИЕ К ПРОДАЖЕ (3-5)\n\nОткрытые вопросы с комментариями.`;

    default:
      return `${base}\n\nГотовые скрипты продаж.\n${getToneDescription(tone)}\n${priceInstr}\n${lengthInstr}\n${nameInstr}\n\nСтруктура: приветствие, основная часть, возражения, закрытие.`;
  }
}

function getUserPrompt(mode: string, service: string, situation: string, tone: string, context: string, transcript: string, emailSubtype: string, emailObjection: string, extraParams?: Record<string, string>) {
  const ctx = context ? `\nДополнительный контекст: ${context}` : "";
  
  switch (mode) {
    case "touch-chain":
      return `Сгенерируй цепочку из 5-7 касаний для продажи услуги "${service}".${ctx}`;
    case "funnel":
      return `Сгенерируй скрипты для каждого этапа воронки продаж услуги "${service}".${ctx}`;
    case "anti-script":
      return `Сгенерируй антискрипт: типичные ошибки менеджеров при продаже "${service}".${ctx}`;
    case "utp":
      return `Сгенерируй УТП для услуги "${service}".${ctx}`;
    case "sms":
      return `Сгенерируй 10 SMS-сообщений (до 160 символов каждое) для продажи "${service}".${ctx}`;
    case "voicemail":
      return `Сгенерируй скрипты голосовых сообщений для автоответчика при продаже "${service}".${ctx}`;
    case "social-posts":
      return `Сгенерируй продающие посты для соцсетей об услуге "${service}".${ctx}`;
    case "crm-template":
      return `Сгенерируй шаблоны для CRM по услуге "${service}".${ctx}`;
    case "checklist":
      return `Сгенерируй чек-лист звонка при продаже "${service}".${ctx}`;
    case "glossary":
      return `Сгенерируй глоссарий терминов для менеджеров по продажам "${service}".${ctx}`;
    case "script-scoring":
      return `Оцени следующий скрипт продаж по 10 критериям:\n\n${context || transcript || "Скрипт не предоставлен"}`;
    case "dozim":
      return `Сгенерируй скрипт дожима.\nУслуга: ${service}\n${tone ? `Тон: ${tone}` : ""}${ctx}`;
    case "messenger":
      return `Скрипт для мессенджеров.\nУслуга: ${service}\nСитуация: ${situation || "Первое сообщение"}${ctx}`;
    case "objection-training": {
      const difficulty = extraParams?.difficulty || "medium";
      const count = extraParams?.count || "5";
      const diffLabel = difficulty === "easy" ? "простые" : difficulty === "hard" ? "сложные, каверзные" : "средней сложности";
      return `Сгенерируй ${count} возражений (${diffLabel}) при продаже "${service}".${ctx}`;
    }
    case "client-simulation": {
      let simContext: any = {};
      try { simContext = JSON.parse(context || "{}"); } catch {}
      return `Ты — ${simContext.clientType || "клиент"}. Настроение: ${simContext.mood || "нейтральное"}. Бюджет: ${simContext.budget || "неизвестен"}. Уровень возражений: ${simContext.objectionLevel || "средний"}.\nМенеджер продаёт: ${service}.\n\nИстория:\n${simContext.history || "Диалог начался."}\n\nОтветь как клиент. Коротко.`;
    }
    case "email":
      return `Деловое письмо.\nУслуга: ${service}${ctx}\n${emailSubtype === "objection" ? `Возражение: ${emailObjection}` : ""}${emailSubtype === "not-relevant" ? `Что нужно: ${emailObjection}` : ""}`;
    case "knowledge-base":
      return `Контент для базы знаний.\nУслуга: ${service}${ctx}`;
    case "transcript-analysis":
      return `Анализ диалога.\nУслуга: ${service}${ctx}\n\nТРАНСКРИБАЦИЯ:\n${transcript}`;
    case "service-info":
      return `Описание услуги "${service}" для менеджера.${ctx}`;
    case "arguments":
      return `Аргументы, факты и выгоды для "${service}".${ctx}`;
    case "buffer-questions":
      return `Буферные вопросы для "${service}". Ситуация: ${situation}${ctx}`;
    default:
      return `Скрипт продаж.\nУслуга: ${service || "SEO-продвижение"}\nСитуация: ${situation || "Холодный звонок"}\n${tone ? `Тон: ${tone}` : ""}${ctx}`;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { managerName, clientName, service, situation, tone, context, mode, transcript, priceRub, currency, emailSubtype, emailObjection, difficulty, count, scriptLength, dozimSubtype, transcriptSubmode } = body;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const managerVar = managerName?.trim() || "[Имя менеджера]";
    const clientVar = clientName?.trim() || "[Имя клиента]";

    const systemPrompt = getSystemPrompt(mode || "script", managerVar, clientVar, tone, priceRub, currency, emailSubtype || "follow-up", emailObjection || "", scriptLength || "medium", dozimSubtype || "thinking", transcriptSubmode || "analysis");
    const userPrompt = getUserPrompt(mode || "script", service, situation, tone, context, transcript, emailSubtype || "follow-up", emailObjection || "", { difficulty, count });

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
        stream: true,
        max_tokens: 8192,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "Payment required" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(response.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
  } catch (e) {
    console.error("generate-script error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
