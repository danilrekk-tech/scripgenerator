import { useState } from "react";
import { Slider } from "@/components/ui/slider";

export type GenerationMode = "script" | "service-info" | "arguments" | "buffer-questions" | "transcript-analysis" | "email" | "knowledge-base" | "dozim" | "messenger";
export type EmailSubtype = "follow-up" | "kp-with-price" | "kp-no-price" | "objection" | "not-relevant" | "custom";
export type DozimSubtype = "thinking" | "invoice-sent" | "silent-after-kp";
export type TranscriptSubmode = "analysis" | "next-call";

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
  scriptLength: string;
  dozimSubtype: DozimSubtype;
  transcriptSubmode: TranscriptSubmode;
};

export type Currency = "RUB" | "UZS" | "BYN" | "KZT";

const CURRENCY_LABELS: Record<Currency, string> = { RUB: "₽ Рубль РФ", UZS: "сўм Узб. сум", BYN: "Br Бел. рубль", KZT: "₸ Тенге" };
const RATES_FROM_RUB: Record<Currency, number> = { RUB: 1, UZS: 143.5, BYN: 0.0355, KZT: 5.35 };

export function convertFromRub(amountRub: number, currency: Currency): number { return Math.round(amountRub * RATES_FROM_RUB[currency]); }
export function convertToRub(amount: number, currency: Currency): number { return currency === "RUB" ? amount : Math.round(amount / RATES_FROM_RUB[currency]); }

const SITUATIONS = ["Холодный звонок", "Отработка возражения", "Усиление аргументом", "Закрытие сделки", "Повторный контакт", "Уточнение потребностей"];
const TONES = ["Уверенный эксперт", "Мягкий консультант", "Агрессивный closer", "Дружеский партнёр", "Не продающий", "Простыми словами"];

const MODES: { value: GenerationMode; label: string; icon: string }[] = [
  { value: "script", label: "Скрипт продаж", icon: "📋" },
  { value: "dozim", label: "Дожим клиента", icon: "🎯" },
  { value: "messenger", label: "Мессенджер", icon: "💬" },
  { value: "email", label: "Письма", icon: "✉️" },
  { value: "service-info", label: "Инфо по услуге", icon: "📦" },
  { value: "arguments", label: "Аргументы", icon: "💡" },
  { value: "buffer-questions", label: "Буферные вопросы", icon: "❓" },
  { value: "transcript-analysis", label: "Анализ диалога", icon: "🎙️" },
  { value: "knowledge-base", label: "База знаний", icon: "📚" },
];

const EMAIL_SUBTYPES: { value: EmailSubtype; label: string }[] = [
  { value: "follow-up", label: "Не ответил на КП" }, { value: "kp-with-price", label: "КП с ценой" },
  { value: "kp-no-price", label: "КП без цены" }, { value: "objection", label: "Обработка возражения" },
  { value: "not-relevant", label: "Не актуально, но нужно…" }, { value: "custom", label: "Свой вариант" },
];

const DOZIM_SUBTYPES: { value: DozimSubtype; label: string; desc: string }[] = [
  { value: "thinking", label: "Клиент думает", desc: "«Подумает» и пропал" },
  { value: "invoice-sent", label: "Счёт выставлен", desc: "Ожидается оплата" },
  { value: "silent-after-kp", label: "Молчит после КП", desc: "Отправили КП — тишина" },
];

const TRANSCRIPT_SUBMODES: { value: TranscriptSubmode; label: string; desc: string }[] = [
  { value: "analysis", label: "Анализ + скрипт", desc: "Разбор ошибок и как надо было" },
  { value: "next-call", label: "Следующий звонок", desc: "Дожим на основе диалога" },
];

const SCRIPT_LENGTH_LABELS: Record<string, string> = { short: "Короткий", medium: "Средний", long: "Подробный", detailed: "Максимально детальный" };

const MODE_LABELS: Record<GenerationMode, string> = {
  script: "Сгенерировать скрипт", "service-info": "Описать услугу", arguments: "Сгенерировать аргументы",
  "buffer-questions": "Сгенерировать вопросы", "transcript-analysis": "Проанализировать", email: "Сгенерировать письмо",
  "knowledge-base": "Для базы знаний", dozim: "Сгенерировать дожим", messenger: "Для мессенджера",
};

// Quick templates
const TEMPLATES = [
  { label: "Холодный звонок по SEO", config: { mode: "script" as GenerationMode, service: "SEO-продвижение", situation: "Холодный звонок", tone: "Уверенный эксперт" } },
  { label: "Дожим после КП", config: { mode: "dozim" as GenerationMode, dozimSubtype: "silent-after-kp" as DozimSubtype } },
  { label: "Письмо: follow-up", config: { mode: "email" as GenerationMode, emailSubtype: "follow-up" as EmailSubtype } },
  { label: "Простыми словами", config: { mode: "script" as GenerationMode, tone: "Простыми словами", situation: "Уточнение потребностей" } },
];

interface Props {
  config: ScriptConfig;
  onChange: (config: ScriptConfig) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  serviceNames: string[];
  className?: string;
  transcriberUrl?: string;
}

export default function ConfigSidebar({ config, onChange, onGenerate, isGenerating, serviceNames, className, transcriberUrl }: Props) {
  const [showTemplates, setShowTemplates] = useState(false);
  const update = (key: keyof ScriptConfig, value: string) => onChange({ ...config, [key]: value });

  const showSituation = config.mode === "script" || config.mode === "buffer-questions";
  const showTone = ["script", "transcript-analysis", "email", "dozim", "messenger"].includes(config.mode);
  const showNames = ["script", "transcript-analysis", "email", "dozim", "messenger"].includes(config.mode);
  const showTranscript = config.mode === "transcript-analysis";
  const showPrice = ["script", "transcript-analysis", "email", "dozim", "messenger"].includes(config.mode);
  const showEmail = config.mode === "email";
  const showDozim = config.mode === "dozim";
  const showLength = ["script", "dozim", "messenger"].includes(config.mode);
  const showTranscriptSubmode = config.mode === "transcript-analysis";

  const lengthIdx = ["short", "medium", "long", "detailed"].indexOf(config.scriptLength);
  const canGenerate = (() => {
    if (config.mode === "transcript-analysis") return config.transcript.trim().length > 20;
    if (config.mode === "email" && config.emailSubtype === "objection") return config.emailObjection.trim().length > 3;
    return true;
  })();

  return (
    <aside className={`w-80 shrink-0 border-r border-border/50 glass-panel p-6 flex flex-col gap-5 overflow-y-auto ${className || ""}`}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1">Конфигурация</h2>
          <p className="text-[10px] text-muted-foreground">Параметры генерации</p>
        </div>
        <button
          onClick={() => setShowTemplates(!showTemplates)}
          className={`text-[10px] px-2.5 py-1 rounded-lg border transition-all btn-tactile ${showTemplates ? "chip-active" : "chip-inactive"}`}
        >
          ⚡ Шаблоны
        </button>
      </div>

      {/* Quick templates */}
      {showTemplates && (
        <div className="flex flex-col gap-1.5 -mt-2">
          {TEMPLATES.map((t) => (
            <button
              key={t.label}
              onClick={() => { onChange({ ...config, ...t.config }); setShowTemplates(false); }}
              className="text-left text-xs px-3 py-2 rounded-lg border border-border/50 glass-card hover:bg-accent/50 transition-all btn-tactile text-foreground"
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Mode */}
      <Field label="Режим генерации">
        <div className="grid grid-cols-1 gap-1.5">
          {MODES.map((m) => (
            <button key={m.value} onClick={() => update("mode", m.value)}
              className={`text-left text-xs px-3 py-2 rounded-lg border transition-all btn-tactile flex items-center gap-2 ${
                config.mode === m.value ? "chip-active" : "chip-inactive"
              }`}>
              <span>{m.icon}</span><span>{m.label}</span>
            </button>
          ))}
        </div>
      </Field>

      {showDozim && (
        <Field label="Тип дожима">
          <div className="flex flex-col gap-1.5">
            {DOZIM_SUBTYPES.map((ds) => (
              <button key={ds.value} onClick={() => update("dozimSubtype", ds.value)}
                className={`text-left text-xs px-3 py-2 rounded-lg border transition-all btn-tactile ${config.dozimSubtype === ds.value ? "chip-active" : "chip-inactive"}`}>
                <span className="block font-medium">{ds.label}</span>
                <span className="block text-[10px] text-muted-foreground mt-0.5">{ds.desc}</span>
              </button>
            ))}
          </div>
        </Field>
      )}

      {showEmail && (
        <Field label="Тип письма">
          <div className="flex flex-col gap-1.5">
            {EMAIL_SUBTYPES.map((es) => (
              <button key={es.value} onClick={() => update("emailSubtype", es.value)}
                className={`text-left text-xs px-3 py-2 rounded-lg border transition-all btn-tactile ${config.emailSubtype === es.value ? "chip-active" : "chip-inactive"}`}>
                {es.label}
              </button>
            ))}
          </div>
        </Field>
      )}

      {showEmail && (config.emailSubtype === "objection" || config.emailSubtype === "not-relevant") && (
        <Field label={config.emailSubtype === "objection" ? "Возражение клиента" : "Что нужно клиенту?"}>
          <textarea className="w-full glass-input border border-border/50 rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none h-20"
            placeholder={config.emailSubtype === "objection" ? "Опишите возражение..." : "Например: нужны юридические правки..."}
            value={config.emailObjection} onChange={(e) => update("emailObjection", e.target.value)} />
        </Field>
      )}

      {showTranscriptSubmode && (
        <Field label="Что сгенерировать">
          <div className="flex flex-col gap-1.5">
            {TRANSCRIPT_SUBMODES.map((ts) => (
              <button key={ts.value} onClick={() => update("transcriptSubmode", ts.value)}
                className={`text-left text-xs px-3 py-2 rounded-lg border transition-all btn-tactile ${config.transcriptSubmode === ts.value ? "chip-active" : "chip-inactive"}`}>
                <span className="block font-medium">{ts.label}</span>
                <span className="block text-[10px] text-muted-foreground mt-0.5">{ts.desc}</span>
              </button>
            ))}
          </div>
        </Field>
      )}

      {showTranscript && (
        <Field label="Транскрибация диалога">
          {transcriberUrl && (
            <a href={transcriberUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[11px] text-primary hover:text-primary/80 mb-2 transition-colors">
              <span>Открыть транскрибатор</span>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
            </a>
          )}
          <textarea className="w-full glass-input border border-border/50 rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none h-40 font-mono"
            placeholder={"Спикер 1: Добрый день...\nСпикер 2: Здравствуйте..."} value={config.transcript} onChange={(e) => update("transcript", e.target.value)} />
          <p className="text-[10px] text-muted-foreground">Минимум 20 символов{!transcriberUrl && ". URL транскрибатора → Настройки"}</p>
        </Field>
      )}

      {showNames && (
        <>
          <Field label="Имя менеджера">
            <input className="w-full glass-input border border-border/50 rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              placeholder="Алексей" value={config.managerName} onChange={(e) => update("managerName", e.target.value)} />
          </Field>
          <Field label="Имя клиента">
            <input className="w-full glass-input border border-border/50 rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              placeholder="Иван Петрович" value={config.clientName} onChange={(e) => update("clientName", e.target.value)} />
          </Field>
        </>
      )}

      <Field label="Услуга">
        <div className="flex flex-wrap gap-1.5">
          {serviceNames.map((s) => (
            <button key={s} onClick={() => update("service", s)}
              className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all btn-tactile ${config.service === s ? "chip-active" : "chip-inactive"}`}>
              {s}
            </button>
          ))}
        </div>
      </Field>

      {showSituation && (
        <Field label="Ситуация">
          <div className="flex flex-wrap gap-1.5">
            {SITUATIONS.map((s) => (
              <button key={s} onClick={() => update("situation", s)}
                className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all btn-tactile ${config.situation === s ? "chip-active" : "chip-inactive"}`}>
                {s}
              </button>
            ))}
          </div>
        </Field>
      )}

      {showTone && (
        <Field label="Тон">
          <div className="flex flex-wrap gap-1.5">
            {TONES.map((t) => (
              <button key={t} onClick={() => update("tone", t)}
                className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all btn-tactile ${config.tone === t ? "chip-active" : "chip-inactive"}`}>
                {t}
              </button>
            ))}
          </div>
        </Field>
      )}

      {showLength && (
        <Field label={`Длина: ${SCRIPT_LENGTH_LABELS[config.scriptLength]}`}>
          <Slider value={[lengthIdx >= 0 ? lengthIdx : 1]} min={0} max={3} step={1}
            onValueChange={([v]) => update("scriptLength", ["short", "medium", "long", "detailed"][v])} />
          <div className="flex justify-between text-[10px] text-muted-foreground -mt-1"><span>Кратко</span><span>Детально</span></div>
        </Field>
      )}

      {showPrice && (
        <Field label="Цена комплекса услуг">
          <div className="flex gap-2">
            <input type="number" className="flex-1 glass-input border border-border/50 rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              placeholder="Сумма" value={config.priceRub} onChange={(e) => update("priceRub", e.target.value)} />
            <select value={config.currency} onChange={(e) => onChange({ ...config, currency: e.target.value as Currency })}
              className="glass-input border border-border/50 rounded-lg px-2 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all">
              {(Object.keys(CURRENCY_LABELS) as Currency[]).map((c) => (<option key={c} value={c}>{CURRENCY_LABELS[c]}</option>))}
            </select>
          </div>
          {config.currency !== "RUB" && config.priceRub && (
            <p className="text-[10px] text-muted-foreground mt-1">≈ {convertFromRub(Number(config.priceRub), config.currency).toLocaleString("ru-RU")} {config.currency}</p>
          )}
        </Field>
      )}

      <Field label="Дополнительный контекст">
        <textarea className="w-full glass-input border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none h-20"
          placeholder="Возражение, детали бизнеса..." value={config.context} onChange={(e) => update("context", e.target.value)} />
      </Field>

      <button onClick={onGenerate} disabled={isGenerating || !canGenerate}
        className="w-full bg-primary text-primary-foreground font-medium py-3 rounded-xl transition-all btn-tactile shadow-glow hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-sm tracking-wide">
        {isGenerating ? "Генерация..." : MODE_LABELS[config.mode]}
      </button>
    </aside>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}
