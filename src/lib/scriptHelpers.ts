/**
 * Replace common variable placeholders inside generated scripts with real values.
 * Handles many forms AI may emit:
 *   [Имя менеджера], [имя менеджера], {manager}, {{Имя менеджера}}, [МЕНЕДЖЕР], [Менеджер]
 *   [Имя клиента], [имя клиента], {client}, [КЛИЕНТ], [Клиент]
 */
export function fillVariables(text: string, manager: string, client: string): string {
  if (!text) return text;
  let out = text;

  const m = (manager || "").trim();
  const c = (client || "").trim();

  if (m) {
    out = out.replace(/\[\s*имя\s+менеджера\s*\]/gi, m);
    out = out.replace(/\[\s*менеджер\s*\]/gi, m);
    out = out.replace(/\{\{?\s*manager(?:Name)?\s*\}?\}/gi, m);
    out = out.replace(/\{\{?\s*имя\s+менеджера\s*\}?\}/gi, m);
  }
  if (c) {
    out = out.replace(/\[\s*имя\s+клиента\s*\]/gi, c);
    out = out.replace(/\[\s*клиент\s*\]/gi, c);
    out = out.replace(/\{\{?\s*client(?:Name)?\s*\}?\}/gi, c);
    out = out.replace(/\{\{?\s*имя\s+клиента\s*\}?\}/gi, c);
  }
  return out;
}

export interface ValidationIssue {
  level: "error" | "warning" | "info";
  field: string;
  message: string;
}

interface ValidateInput {
  mode: string;
  managerName?: string;
  clientName?: string;
  service?: string;
  context?: string;
  transcript?: string;
  emailSubtype?: string;
  emailObjection?: string;
  priceRub?: string;
  scriptLength?: string;
  personaId?: string;
  defaultManagerName?: string;
  defaultClientName?: string;
}

/**
 * Validates inputs before generation. Returns list of issues — `error` blocks generation,
 * `warning` is shown but doesn't block, `info` is a soft hint.
 */
export function validateConfig(cfg: ValidateInput): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const m = (cfg.managerName || cfg.defaultManagerName || "").trim();
  const c = (cfg.clientName || cfg.defaultClientName || "").trim();

  // Hard requirements per mode
  if (cfg.mode === "transcript-analysis") {
    if (!cfg.transcript || cfg.transcript.trim().length < 20) {
      issues.push({ level: "error", field: "transcript", message: "Вставьте транскрибацию (минимум 20 символов)" });
    }
  }
  if (cfg.mode === "email" && cfg.emailSubtype === "objection") {
    if (!cfg.emailObjection || cfg.emailObjection.trim().length < 3) {
      issues.push({ level: "error", field: "emailObjection", message: "Опишите возражение клиента" });
    }
  }
  if (cfg.mode === "objection-quick") {
    if (!cfg.context || cfg.context.trim().length < 3) {
      issues.push({ level: "error", field: "context", message: "Выберите шаблон возражения или опишите своё" });
    }
  }

  // Soft warnings — useful but optional
  const namesOptionalModes = new Set(["service-info", "arguments", "buffer-questions", "knowledge-base", "utp", "anti-script", "checklist", "glossary", "crm-template", "social-posts"]);
  if (!namesOptionalModes.has(cfg.mode)) {
    if (!m) issues.push({ level: "warning", field: "managerName", message: "Имя менеджера не задано — в скрипте останется [Имя менеджера]" });
    if (!c) issues.push({ level: "warning", field: "clientName", message: "Имя клиента не задано — в скрипте останется [Имя клиента]" });
  }

  if (!cfg.service || !cfg.service.trim()) {
    issues.push({ level: "warning", field: "service", message: "Не выбрана услуга — скрипт будет общим" });
  }

  if (!cfg.context || cfg.context.trim().length < 8) {
    if (cfg.mode !== "objection-quick" && cfg.mode !== "transcript-analysis") {
      issues.push({ level: "info", field: "context", message: "Добавьте контекст (бизнес клиента, боль, цель) — скрипт станет точнее" });
    }
  }

  const priceModes = new Set(["script", "email", "dozim", "messenger", "touch-chain", "funnel"]);
  if (priceModes.has(cfg.mode) && (!cfg.priceRub || Number(cfg.priceRub) <= 0)) {
    issues.push({ level: "info", field: "priceRub", message: "Не указана цена — будет общий блок без сумм" });
  }

  if (!cfg.personaId) {
    issues.push({ level: "info", field: "personaId", message: "Не выбрана персона клиента — тон не адаптируется автоматически" });
  }

  return issues;
}

/**
 * Quick objection templates — used by "точечный скрипт" mode.
 * Each template seeds the context with a specific objection and asks for several response variants.
 */
export interface QuickTemplate {
  id: string;
  category: "Цена" | "Время" | "Доверие" | "Конкуренты" | "Потребность" | "Решение";
  objection: string;
  hint: string;
}

export const QUICK_OBJECTION_TEMPLATES: QuickTemplate[] = [
  { id: "expensive", category: "Цена", objection: "Это дорого", hint: "Перевод в ценность, разбивка на пользу" },
  { id: "no-budget", category: "Цена", objection: "Нет бюджета", hint: "Этапность, рассрочка, ROI" },
  { id: "competitor-cheaper", category: "Цена", objection: "У конкурентов дешевле", hint: "Отстройка, что входит в цену" },
  { id: "discount", category: "Цена", objection: "Дайте скидку", hint: "Защита маржи, бонусы вместо скидки" },

  { id: "think", category: "Время", objection: "Я подумаю", hint: "Конкретизировать сомнение, дедлайн" },
  { id: "later", category: "Время", objection: "Не сейчас, позже", hint: "Цена ожидания, упущенная выгода" },
  { id: "busy", category: "Время", objection: "Нет времени на это", hint: "Минимум усилий клиента, всё под ключ" },
  { id: "season", category: "Время", objection: "Сейчас не сезон", hint: "Подготовка к сезону, фора над конкурентами" },

  { id: "no-trust", category: "Доверие", objection: "Не верю в результат", hint: "Кейсы, гарантии, KPI в договоре" },
  { id: "burned", category: "Доверие", objection: "Уже обжигался на подобном", hint: "Разбор причин, чем мы отличаемся" },
  { id: "show-cases", category: "Доверие", objection: "Покажите кейсы", hint: "Релевантные кейсы + цифры + процесс" },
  { id: "guarantees", category: "Доверие", objection: "А если не будет результата?", hint: "Гарантии, KPI, поэтапная оплата" },

  { id: "have-contractor", category: "Конкуренты", objection: "Уже есть подрядчик", hint: "Аудит без обязательств, второе мнение" },
  { id: "in-house", category: "Конкуренты", objection: "Делаем сами / есть свой отдел", hint: "Дополнение к команде, узкая экспертиза" },
  { id: "compare", category: "Конкуренты", objection: "Сравниваю с другими", hint: "Критерии выбора, чек-лист сравнения" },

  { id: "not-needed", category: "Потребность", objection: "Мне это не нужно", hint: "Раскрытие скрытой потребности через вопросы" },
  { id: "not-our-niche", category: "Потребность", objection: "Не наша ниша", hint: "Кейсы из смежных ниш, адаптация" },
  { id: "no-results-ssz", category: "Потребность", objection: "Не вижу проблемы", hint: "Диагностические вопросы, замер потерь" },

  { id: "not-decider", category: "Решение", objection: "Не я принимаю решение", hint: "Выход на ЛПР, материалы для презентации" },
  { id: "need-approval", category: "Решение", objection: "Нужно согласовать с руководством", hint: "Помощь в презентации руководству" },
  { id: "send-kp", category: "Решение", objection: "Пришлите КП на почту", hint: "Уточнение запроса перед отправкой" },
];
