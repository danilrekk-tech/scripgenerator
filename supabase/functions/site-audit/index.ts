import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { url } = await req.json();
    if (!url) {
      return new Response(JSON.stringify({ error: "URL is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let targetUrl = url.trim();
    if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
      targetUrl = `https://${targetUrl}`;
    }

    let html = "";
    let fetchError = false;
    let statusCode = 0;
    let responseTime = 0;
    const startTime = Date.now();
    
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const resp = await fetch(targetUrl, {
        headers: { "User-Agent": "ScriptEngine-SEO-Audit/1.0" },
        signal: controller.signal,
        redirect: "follow",
      });
      clearTimeout(timeout);
      responseTime = Date.now() - startTime;
      statusCode = resp.status;
      html = await resp.text();
    } catch (e) {
      fetchError = true;
      responseTime = Date.now() - startTime;
    }

    const checks: { name: string; status: string; detail: string }[] = [];
    let score = 0;

    if (fetchError) {
      checks.push({ name: "Доступность сайта", status: "fail", detail: "Сайт недоступен или заблокировал запрос" });
      return new Response(JSON.stringify({
        url: targetUrl, score: 0, checks,
        summary: "Сайт недоступен. Проверьте правильность URL.",
        recommendations: ["Проверьте правильность URL", "Убедитесь что сайт работает"],
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Status code
    if (statusCode === 200) {
      checks.push({ name: "HTTP-статус", status: "pass", detail: "200 OK" });
      score += 8;
    } else {
      checks.push({ name: "HTTP-статус", status: "fail", detail: `Код ответа: ${statusCode}` });
    }

    // Response time
    if (responseTime < 1000) {
      checks.push({ name: "Скорость ответа", status: "pass", detail: `${responseTime}мс — отлично` });
      score += 8;
    } else if (responseTime < 3000) {
      checks.push({ name: "Скорость ответа", status: "warn", detail: `${responseTime}мс — можно улучшить` });
      score += 4;
    } else {
      checks.push({ name: "Скорость ответа", status: "fail", detail: `${responseTime}мс — слишком медленно` });
    }

    // Title tag
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch && titleMatch[1].trim()) {
      const titleLen = titleMatch[1].trim().length;
      if (titleLen >= 30 && titleLen <= 70) {
        checks.push({ name: "Title тег", status: "pass", detail: `"${titleMatch[1].trim().slice(0, 60)}..." (${titleLen} симв.)` });
        score += 8;
      } else {
        checks.push({ name: "Title тег", status: "warn", detail: `Длина ${titleLen} симв. (рекомендуется 30-70)` });
        score += 4;
      }
    } else {
      checks.push({ name: "Title тег", status: "fail", detail: "Отсутствует" });
    }

    // Meta description
    const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) ||
                       html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
    if (descMatch && descMatch[1].trim()) {
      const descLen = descMatch[1].trim().length;
      if (descLen >= 100 && descLen <= 160) {
        checks.push({ name: "Meta Description", status: "pass", detail: `${descLen} симв. — оптимально` });
        score += 8;
      } else {
        checks.push({ name: "Meta Description", status: "warn", detail: `${descLen} симв. (рекомендуется 100-160)` });
        score += 4;
      }
    } else {
      checks.push({ name: "Meta Description", status: "fail", detail: "Отсутствует" });
    }

    // H1
    const h1Match = html.match(/<h1[^>]*>([^<]*)<\/h1>/i);
    if (h1Match) {
      checks.push({ name: "Тег H1", status: "pass", detail: `Найден: "${h1Match[1].trim().slice(0, 50)}"` });
      score += 7;
    } else {
      checks.push({ name: "Тег H1", status: "fail", detail: "Отсутствует на главной странице" });
    }

    // Viewport meta
    const viewportMatch = html.match(/<meta[^>]+name=["']viewport["']/i);
    if (viewportMatch) {
      checks.push({ name: "Адаптивность (viewport)", status: "pass", detail: "Мета-тег viewport настроен" });
      score += 7;
    } else {
      checks.push({ name: "Адаптивность (viewport)", status: "fail", detail: "Мета-тег viewport отсутствует" });
    }

    // HTTPS
    if (targetUrl.startsWith("https://")) {
      checks.push({ name: "HTTPS", status: "pass", detail: "Сайт использует HTTPS" });
      score += 7;
    } else {
      checks.push({ name: "HTTPS", status: "fail", detail: "Сайт не использует HTTPS" });
    }

    // Images without alt
    const imgTags = html.match(/<img[^>]*>/gi) || [];
    const imgsNoAlt = imgTags.filter((t) => !t.match(/alt=["'][^"']+["']/i));
    if (imgTags.length === 0) {
      checks.push({ name: "Alt-теги изображений", status: "warn", detail: "Изображений не обнаружено" });
      score += 4;
    } else if (imgsNoAlt.length === 0) {
      checks.push({ name: "Alt-теги изображений", status: "pass", detail: `Все ${imgTags.length} изображений имеют alt` });
      score += 7;
    } else {
      checks.push({ name: "Alt-теги изображений", status: "warn", detail: `${imgsNoAlt.length} из ${imgTags.length} без alt-тега` });
      score += 3;
    }

    // Open Graph
    const ogMatch = html.match(/<meta[^>]+property=["']og:/i);
    if (ogMatch) {
      checks.push({ name: "Open Graph теги", status: "pass", detail: "OG-разметка настроена" });
      score += 5;
    } else {
      checks.push({ name: "Open Graph теги", status: "warn", detail: "OG-разметка отсутствует" });
    }

    // Canonical
    const canonicalMatch = html.match(/<link[^>]+rel=["']canonical["']/i);
    if (canonicalMatch) {
      checks.push({ name: "Canonical URL", status: "pass", detail: "Canonical тег установлен" });
      score += 5;
    } else {
      checks.push({ name: "Canonical URL", status: "warn", detail: "Canonical тег не найден" });
    }

    // Schema.org microdata
    const schemaJsonLd = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>/gi) || [];
    const schemaMicrodata = html.match(/itemscope|itemtype=["']https?:\/\/schema\.org/gi) || [];
    const schemaRdfa = html.match(/typeof=["'][^"']*schema\.org/gi) || [];
    const totalSchemaMarkers = schemaJsonLd.length + schemaMicrodata.length + schemaRdfa.length;
    
    if (totalSchemaMarkers > 0) {
      const types: string[] = [];
      // Extract JSON-LD types
      const jsonLdBlocks = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
      for (const block of jsonLdBlocks) {
        const typeMatch = block.match(/"@type"\s*:\s*"([^"]+)"/);
        if (typeMatch) types.push(typeMatch[1]);
      }
      // Extract microdata types
      const microdataTypes = html.match(/itemtype=["']https?:\/\/schema\.org\/([^"']+)["']/gi) || [];
      for (const mt of microdataTypes) {
        const m = mt.match(/schema\.org\/([^"']+)/i);
        if (m) types.push(m[1]);
      }
      
      const typesStr = types.length > 0 ? ` (${types.slice(0, 5).join(", ")})` : "";
      checks.push({ name: "Schema.org микроразметка", status: "pass", detail: `Найдено ${totalSchemaMarkers} блок(ов)${typesStr}` });
      score += 7;
    } else {
      checks.push({ name: "Schema.org микроразметка", status: "fail", detail: "Микроразметка Schema.org не обнаружена — критично для SEO и AI-поиска" });
    }

    // Neuro-search optimization markers
    let neuroScore = 0;
    const neuroDetails: string[] = [];
    
    // Check for FAQ schema (important for AI answers)
    const hasFaqSchema = html.match(/FAQPage|faqpage/i);
    if (hasFaqSchema) { neuroScore++; neuroDetails.push("FAQ Schema"); }
    
    // Check for HowTo schema
    const hasHowTo = html.match(/HowTo/i) && (schemaJsonLd.length > 0 || schemaMicrodata.length > 0);
    if (hasHowTo) { neuroScore++; neuroDetails.push("HowTo Schema"); }
    
    // Check for structured headings (h2, h3 hierarchy)
    const h2Count = (html.match(/<h2[^>]*>/gi) || []).length;
    const h3Count = (html.match(/<h3[^>]*>/gi) || []).length;
    if (h2Count >= 3 && h3Count >= 2) { neuroScore++; neuroDetails.push(`Иерархия заголовков (${h2Count}×H2, ${h3Count}×H3)`); }
    
    // Check for structured lists
    const listCount = (html.match(/<(?:ul|ol)[^>]*>/gi) || []).length;
    if (listCount >= 2) { neuroScore++; neuroDetails.push(`Структурированные списки (${listCount})`); }
    
    // Check for data tables
    const tableCount = (html.match(/<table[^>]*>/gi) || []).length;
    if (tableCount > 0) { neuroScore++; neuroDetails.push("Табличные данные"); }

    // Check for Article/WebPage/Organization schema
    const hasArticle = html.match(/"@type"\s*:\s*"(Article|NewsArticle|BlogPosting|WebPage|Organization)"/i);
    if (hasArticle) { neuroScore++; neuroDetails.push(`${hasArticle[1]} Schema`); }

    if (neuroScore >= 4) {
      checks.push({ name: "Оптимизация под Нейропоиск", status: "pass", detail: `Хорошая оптимизация: ${neuroDetails.join(", ")}` });
      score += 7;
    } else if (neuroScore >= 2) {
      checks.push({ name: "Оптимизация под Нейропоиск", status: "warn", detail: `Частичная: ${neuroDetails.length > 0 ? neuroDetails.join(", ") : "мало структурированных данных"}. Добавьте FAQ Schema, HowTo, структурированные заголовки.` });
      score += 3;
    } else {
      checks.push({ name: "Оптимизация под Нейропоиск", status: "fail", detail: "Не оптимизирован для AI/нейропоиска. Нет FAQ Schema, HowTo, мало структурированных данных." });
    }

    // HTML size
    const sizeKb = Math.round(html.length / 1024);
    if (sizeKb < 100) {
      checks.push({ name: "Размер HTML", status: "pass", detail: `${sizeKb} КБ — оптимально` });
      score += 4;
    } else if (sizeKb < 300) {
      checks.push({ name: "Размер HTML", status: "warn", detail: `${sizeKb} КБ — можно оптимизировать` });
      score += 2;
    } else {
      checks.push({ name: "Размер HTML", status: "fail", detail: `${sizeKb} КБ — слишком большой` });
    }

    // Copyright / creation year
    const yearMatch = html.match(/(?:©|&copy;|copyright)\s*(\d{4})/i) || html.match(/(\d{4})\s*[-–]\s*(\d{4})/);
    if (yearMatch) {
      checks.push({ name: "Год создания/копирайт", status: "pass", detail: `Найдено: ${yearMatch[0]}` });
      score += 4;
    } else {
      checks.push({ name: "Год создания/копирайт", status: "warn", detail: "Не удалось определить" });
    }

    // FZ-152 (privacy policy)
    const privacyMatch = html.match(/политик[аи]\s*(конфиденциальности|обработки\s*персональных)/i) ||
                         html.match(/персональн(ых|ые)\s*данн/i) ||
                         html.match(/152-?ФЗ|ФЗ-?152/i);
    if (privacyMatch) {
      checks.push({ name: "Соответствие ФЗ-152", status: "pass", detail: "Упоминание политики конфиденциальности найдено" });
      score += 5;
    } else {
      checks.push({ name: "Соответствие ФЗ-152", status: "fail", detail: "Политика конфиденциальности не обнаружена" });
    }

    score = Math.min(score, 100);

    // Build recommendations using AI
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    let summary = `SEO-оценка сайта: ${score}/100.`;
    let recommendations: string[] = [];

    if (LOVABLE_API_KEY) {
      try {
        const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            messages: [
              { role: "system", content: "Ты SEO-эксперт. Дай краткое резюме и 5-7 рекомендаций на основе результатов аудита. Ответ в JSON: {\"summary\": \"...\", \"recommendations\": [\"...\"]}" },
              { role: "user", content: `Результаты аудита сайта ${targetUrl} (оценка ${score}/100):\n${checks.map(c => `${c.name}: ${c.status} — ${c.detail}`).join("\n")}` },
            ],
          }),
        });

        if (aiResp.ok) {
          const aiData = await aiResp.json();
          const content = aiData.choices?.[0]?.message?.content || "";
          try {
            const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
            const parsed = JSON.parse(cleaned);
            summary = parsed.summary || summary;
            recommendations = parsed.recommendations || [];
          } catch {
            summary = content.slice(0, 300);
          }
        }
      } catch (e) {
        console.error("AI summary error:", e);
      }
    }

    if (recommendations.length === 0) {
      recommendations = checks.filter(c => c.status !== "pass").map(c => `Исправить: ${c.name} — ${c.detail}`);
    }

    return new Response(JSON.stringify({
      url: targetUrl, score, checks, summary, recommendations,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e) {
    console.error("site-audit error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
