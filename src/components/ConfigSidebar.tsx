import { useState } from "react";

export type GenerationMode = "script" | "service-info" | "arguments" | "buffer-questions" | "transcript-analysis" | "email" | "knowledge-base";

export type EmailSubtype = "follow-up" | "kp-with-price" | "kp-no-price" | "objection" | "not-relevant" | "custom";

export type ScriptConfig = {
  managerName: string;
  clientName: string;
  service: string;
  situation: string;
  tone: string;
  context: string;
  mode: GenerationMode;
  transcript: string;
  priceRub: string;
  currency: Currency;
  emailSubtype: EmailSubtype;
  emailObjection: string;
};

export type Currency = "RUB" | "UZS" | "BYN" | "KZT";

const CURRENCY_LABELS: Record<Currency, string> = {
  RUB: "₽ Рубль РФ",
  UZS: "сўм Узб. сум",
  BYN: "Br Бел. рубль",
  KZT: "₸ Тенге",
};

// Approximate rates to RUB (1 RUB = X units)
const RATES_FROM_RUB: Record<Currency, number> = {
  RUB: 1,
  UZS: 143.5,
  BYN: 0.0355,
  KZT: 5.35,
};

export function convertFromRub(amountRub: number, currency: Currency): number {
  return Math.round(amountRub * RATES_FROM_RUB[currency]);
}

export function convertToRub(amount: number, currency: Currency): number {
  if (currency === "RUB") return amount;
  return Math.round(amount / RATES_FROM_RUB[currency]);
}

const SERVICES = [
  "SEO-продвижение",
  "AI-оптимизация (LLM/Answer Engines)",
  "Голосовой поиск",
  "Наполнение контентом",
  "Техническая оптимизация",
  "Комплексное продвижение",
  "SEO-оптимизация (разовая)",
  "Оптимизация под Нейропоиск",
  "Юридические правки (ФЗ-152/ФЗ-168)",
];

const SITUATIONS = [
  "Холодный звонок",
  "Отработка возражения",
  "Усиление аргументом",
  "Закрытие сделки",
  "Повторный контакт",
  "Уточнение потребностей",
];

const TONES = [
  "Уверенный эксперт",
  "Мягкий консультант",
  "Агрессивный closer",
  "Дружеский партнёр",
  "Не продающий",
];

const MODES: { value: GenerationMode; label: string; icon: string }[] = [
  { value: "script", label: "Скрипт продаж", icon: "📋" },
  { value: "service-info", label: "Инфо по услуге", icon: "📦" },
  { value: "arguments", label: "Аргументы и выгоды", icon: "💡" },
  { value: "buffer-questions", label: "Буферные вопросы", icon: "❓" },
  { value: "transcript-analysis", label: "Анализ диалога", icon: "🎙️" },
];

const MODE_LABELS: Record<GenerationMode, string> = {
  script: "Сгенерировать скрипт",
  "service-info": "Описать услугу",
  arguments: "Сгенерировать аргументы",
  "buffer-questions": "Сгенерировать вопросы",
  "transcript-analysis": "Проанализировать и сгенерировать",
};

interface Props {
  config: ScriptConfig;
  onChange: (config: ScriptConfig) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  className?: string;
}

export default function ConfigSidebar({ config, onChange, onGenerate, isGenerating, className }: Props) {
  const update = (key: keyof ScriptConfig, value: string) =>
    onChange({ ...config, [key]: value });

  const showSituation = config.mode === "script" || config.mode === "buffer-questions";
  const showTone = config.mode === "script" || config.mode === "transcript-analysis";
  const showNames = config.mode === "script" || config.mode === "transcript-analysis";
  const showTranscript = config.mode === "transcript-analysis";
  const showPrice = config.mode === "script" || config.mode === "transcript-analysis";

  const canGenerate = config.mode !== "transcript-analysis" || config.transcript.trim().length > 20;

  return (
    <aside className={`w-80 shrink-0 border-r border-border bg-card p-6 flex flex-col gap-5 overflow-y-auto ${className || ""}`}>
      <div>
        <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1">
          Конфигурация
        </h2>
        <p className="text-[10px] text-muted-foreground">Настрой параметры генерации</p>
      </div>

      {/* Mode */}
      <Field label="Режим генерации">
        <div className="flex flex-col gap-1.5">
          {MODES.map((m) => (
            <button
              key={m.value}
              onClick={() => update("mode", m.value)}
              className={`text-left text-xs px-3 py-2 rounded-md border transition-all duration-200 btn-tactile flex items-center gap-2 ${
                config.mode === m.value
                  ? "bg-primary/15 text-primary border-primary/30"
                  : "bg-secondary border-border text-secondary-foreground hover:border-primary/20"
              }`}
            >
              <span>{m.icon}</span>
              <span>{m.label}</span>
            </button>
          ))}
        </div>
      </Field>

      {/* Transcript input */}
      {showTranscript && (
        <Field label="Транскрибация диалога">
          <textarea
            className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all duration-200 resize-none h-40 font-mono text-xs"
            placeholder={"Спикер 1: Добрый день, меня зовут Алексей...\nСпикер 2: Здравствуйте, слушаю вас...\nСпикер 1: Я звоню по поводу..."}
            value={config.transcript}
            onChange={(e) => update("transcript", e.target.value)}
          />
          <p className="text-[10px] text-muted-foreground">
            Вставьте текст диалога с 2 спикерами. Минимум 20 символов.
          </p>
        </Field>
      )}

      {/* Names */}
      {showNames && (
        <>
          <Field label="Имя менеджера">
            <input
              className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all duration-200"
              placeholder="Например: Алексей"
              value={config.managerName}
              onChange={(e) => update("managerName", e.target.value)}
            />
          </Field>
          <Field label="Имя клиента">
            <input
              className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all duration-200"
              placeholder="Например: Иван Петрович"
              value={config.clientName}
              onChange={(e) => update("clientName", e.target.value)}
            />
          </Field>
        </>
      )}

      {/* Service */}
      <Field label="Услуга">
        <div className="flex flex-wrap gap-1.5">
          {SERVICES.map((s) => (
            <button
              key={s}
              onClick={() => update("service", s)}
              className={`text-xs px-2.5 py-1.5 rounded-sm border transition-all duration-200 btn-tactile ${
                config.service === s
                  ? "bg-primary/15 text-primary border-primary/30"
                  : "bg-secondary border-border text-secondary-foreground hover:border-primary/20"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </Field>

      {/* Situation */}
      {showSituation && (
        <Field label="Ситуация">
          <div className="flex flex-wrap gap-1.5">
            {SITUATIONS.map((s) => (
              <button
                key={s}
                onClick={() => update("situation", s)}
                className={`text-xs px-2.5 py-1.5 rounded-sm border transition-all duration-200 btn-tactile ${
                  config.situation === s
                    ? "bg-primary/15 text-primary border-primary/30"
                    : "bg-secondary border-border text-secondary-foreground hover:border-primary/20"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </Field>
      )}

      {/* Tone */}
      {showTone && (
        <Field label="Тон">
          <div className="flex flex-wrap gap-1.5">
            {TONES.map((t) => (
              <button
                key={t}
                onClick={() => update("tone", t)}
                className={`text-xs px-2.5 py-1.5 rounded-sm border transition-all duration-200 btn-tactile ${
                  config.tone === t
                    ? "bg-primary/15 text-primary border-primary/30"
                    : "bg-secondary border-border text-secondary-foreground hover:border-primary/20"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </Field>
      )}

      {/* Price */}
      {showPrice && (
        <Field label="Цена комплекса услуг">
          <div className="flex gap-2">
            <input
              type="number"
              className="flex-1 bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all duration-200"
              placeholder="Сумма"
              value={config.priceRub}
              onChange={(e) => update("priceRub", e.target.value)}
            />
            <select
              value={config.currency}
              onChange={(e) => onChange({ ...config, currency: e.target.value as Currency })}
              className="bg-input border border-border rounded-md px-2 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all duration-200"
            >
              {(Object.keys(CURRENCY_LABELS) as Currency[]).map((c) => (
                <option key={c} value={c}>{CURRENCY_LABELS[c]}</option>
              ))}
            </select>
          </div>
          {config.currency !== "RUB" && config.priceRub && (
            <p className="text-[10px] text-muted-foreground mt-1">
              ≈ {convertFromRub(Number(config.priceRub), config.currency).toLocaleString("ru-RU")} {config.currency} (конвертация приблизительная)
            </p>
          )}
          <p className="text-[10px] text-muted-foreground">
            Указывается в рублях РФ. При другой валюте — автоконвертация.
          </p>
        </Field>
      )}

      {/* Context */}
      <Field label="Дополнительный контекст">
        <textarea
          className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all duration-200 resize-none h-20"
          placeholder="Возражение клиента, детали бизнеса, особенности..."
          value={config.context}
          onChange={(e) => update("context", e.target.value)}
        />
      </Field>

      {/* Generate Button */}
      <button
        onClick={onGenerate}
        disabled={isGenerating || !canGenerate}
        className="w-full bg-primary text-primary-foreground font-medium py-3 rounded-md transition-all duration-200 btn-tactile shadow-glow hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-sm tracking-wide"
      >
        {isGenerating ? "Генерация..." : MODE_LABELS[config.mode]}
      </button>
    </aside>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </label>
      {children}
    </div>
  );
}
