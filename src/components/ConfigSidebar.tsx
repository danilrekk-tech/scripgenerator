import { useState } from "react";

export type ScriptConfig = {
  managerName: string;
  clientName: string;
  service: string;
  situation: string;
  tone: string;
  context: string;
};

const SERVICES = [
  "SEO-продвижение",
  "AI-оптимизация (LLM/Answer Engines)",
  "Голосовой поиск",
  "Наполнение контентом",
  "Техническая оптимизация",
  "Комплексное продвижение",
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
];

interface Props {
  config: ScriptConfig;
  onChange: (config: ScriptConfig) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

export default function ConfigSidebar({ config, onChange, onGenerate, isGenerating }: Props) {
  const update = (key: keyof ScriptConfig, value: string) =>
    onChange({ ...config, [key]: value });

  return (
    <aside className="w-80 shrink-0 border-r border-border bg-card p-6 flex flex-col gap-6 overflow-y-auto">
      <div>
        <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1">
          Конфигурация
        </h2>
        <p className="text-[10px] text-muted-foreground">Настрой параметры скрипта</p>
      </div>

      {/* Manager Name */}
      <Field label="Имя менеджера">
        <input
          className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all duration-200"
          placeholder="Например: Алексей"
          value={config.managerName}
          onChange={(e) => update("managerName", e.target.value)}
        />
      </Field>

      {/* Client Name */}
      <Field label="Имя клиента">
        <input
          className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all duration-200"
          placeholder="Например: Иван Петрович"
          value={config.clientName}
          onChange={(e) => update("clientName", e.target.value)}
        />
      </Field>

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

      {/* Tone */}
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
        disabled={isGenerating}
        className="w-full bg-primary text-primary-foreground font-medium py-3 rounded-md transition-all duration-200 btn-tactile shadow-glow hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-sm tracking-wide"
      >
        {isGenerating ? "Генерация..." : "Сгенерировать скрипт"}
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
