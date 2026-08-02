import { useState, useMemo } from "react";
import { Slider } from "@/components/ui/slider";
import {
  ClipboardList, Target, MessageSquare, Link2, BarChart3,
  Mail, Smartphone, Phone, Megaphone,
  Mic, Ban,
  Package, Lightbulb, HelpCircle, BookOpen, Gem, CheckSquare, BookMarked, FolderKanban,
  Zap, ChevronDown, Search, AlertTriangle, Info, Sparkles, Users,
  Crosshair, type LucideIcon,
} from "lucide-react";
import { validateConfig, QUICK_OBJECTION_TEMPLATES } from "@/lib/scriptHelpers";
import { SCENARIO_TYPES, TEMPLATE_CATEGORIES, templatesFor, fillService, type TemplateCategory } from "@/lib/scenarioTemplates";
import type { ClientPersona } from "@/hooks/useClientPersonas";



export type GenerationMode = "script" | "service-info" | "arguments" | "buffer-questions" | "transcript-analysis" | "email" | "knowledge-base" | "dozim" | "messenger" | "touch-chain" | "funnel" | "anti-script" | "utp" | "sms" | "voicemail" | "social-posts" | "crm-template" | "checklist" | "glossary" | "objection-quick";
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
  personaId: string;
  quickTemplateId: string;
  backstory: string;
  clientSiteUrl: string;
  scenarioType: string;
  templateIds: string;
};


export type Currency = "RUB" | "UZS" | "BYN" | "KZT";

const CURRENCY_LABELS: Record<Currency, string> = { RUB: "₽ Рубль РФ", UZS: "сўм Узб. сум", BYN: "Br Бел. рубль", KZT: "₸ Тенге" };
const RATES_FROM_RUB: Record<Currency, number> = { RUB: 1, UZS: 143.5, BYN: 0.0355, KZT: 5.35 };

export function convertFromRub(amountRub: number, currency: Currency): number { return Math.round(amountRub * RATES_FROM_RUB[currency]); }
export function convertToRub(amount: number, currency: Currency): number { return currency === "RUB" ? amount : Math.round(amount / RATES_FROM_RUB[currency]); }

const SITUATIONS = ["Холодный звонок", "Отработка возражения", "Усиление аргументом", "Закрытие сделки", "Повторный контакт", "Уточнение потребностей"];
const TONES = ["Уверенный эксперт", "Мягкий консультант", "Агрессивный closer", "Дружеский партнёр", "Не продающий", "Простыми словами"];

type ModeGroup = { label: string; modes: { value: GenerationMode; label: string; Icon: LucideIcon }[] };

const MODE_GROUPS: ModeGroup[] = [
  { label: "Продажи", modes: [
    { value: "script", label: "Скрипт продаж", Icon: ClipboardList },
    { value: "objection-quick", label: "Точечный скрипт", Icon: Crosshair },
    { value: "dozim", label: "Дожим клиента", Icon: Target },
    { value: "messenger", label: "Мессенджер", Icon: MessageSquare },
    { value: "touch-chain", label: "Цепочка касаний", Icon: Link2 },
    { value: "funnel", label: "Воронка продаж", Icon: BarChart3 },
  ]},
  { label: "Контент", modes: [
    { value: "email", label: "Письма", Icon: Mail },
    { value: "sms", label: "SMS", Icon: Smartphone },
    { value: "voicemail", label: "Автоответчик", Icon: Phone },
    { value: "social-posts", label: "Посты для соцсетей", Icon: Megaphone },
  ]},
  { label: "Аналитика", modes: [
    { value: "transcript-analysis", label: "Анализ диалога", Icon: Mic },
    { value: "anti-script", label: "Антискрипт", Icon: Ban },
  ]},
  { label: "Материалы", modes: [
    { value: "service-info", label: "Инфо по услуге", Icon: Package },
    { value: "arguments", label: "Аргументы", Icon: Lightbulb },
    { value: "buffer-questions", label: "Буферные вопросы", Icon: HelpCircle },
    { value: "knowledge-base", label: "База знаний", Icon: BookOpen },
    { value: "utp", label: "Генератор УТП", Icon: Gem },
    { value: "checklist", label: "Чек-лист звонка", Icon: CheckSquare },
    { value: "glossary", label: "Глоссарий", Icon: BookMarked },
    { value: "crm-template", label: "Шаблоны CRM", Icon: FolderKanban },
  ]},
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
  "touch-chain": "Создать цепочку", funnel: "Создать воронку", "anti-script": "Создать антискрипт",
  utp: "Сгенерировать УТП", sms: "Сгенерировать SMS", voicemail: "Скрипт автоответчика",
  "social-posts": "Создать посты", "crm-template": "Шаблоны CRM", checklist: "Создать чек-лист",
  glossary: "Создать глоссарий", "objection-quick": "Создать ответ",
};

const TEMPLATES = [
  { label: "Холодный звонок по SEO", config: { mode: "script" as GenerationMode, service: "SEO-продвижение", situation: "Холодный звонок", tone: "Уверенный эксперт" } },
  { label: "Дожим после КП", config: { mode: "dozim" as GenerationMode, dozimSubtype: "silent-after-kp" as DozimSubtype } },
  { label: "Письмо: follow-up", config: { mode: "email" as GenerationMode, emailSubtype: "follow-up" as EmailSubtype } },
  { label: "Цепочка касаний", config: { mode: "touch-chain" as GenerationMode } },
  { label: "Антискрипт (ошибки)", config: { mode: "anti-script" as GenerationMode } },
  { label: "Чек-лист звонка", config: { mode: "checklist" as GenerationMode } },
];

interface Props {
  config: ScriptConfig;
  onChange: (config: ScriptConfig) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  serviceNames: string[];
  className?: string;
  transcriberUrl?: string;
  defaultManagerName?: string;
  defaultClientName?: string;
  personas?: ClientPersona[];
  onPreviewContext?: () => void;
}


type SectionKey = "what" | "who" | "how" | "details";

export default function ConfigSidebar({ config, onChange, onGenerate, isGenerating, serviceNames, className, transcriberUrl, defaultManagerName = "", defaultClientName = "", personas = [] }: Props) {
  const [showTemplates, setShowTemplates] = useState(false);
  const [modeSearch, setModeSearch] = useState("");
  const [openSections, setOpenSections] = useState<Set<SectionKey>>(new Set(["what", "who", "how"]));

  const update = (key: keyof ScriptConfig, value: string) => onChange({ ...config, [key]: value });
  const toggleSection = (k: SectionKey) => setOpenSections(prev => {
    const next = new Set(prev);
    if (next.has(k)) next.delete(k); else next.add(k);
    return next;
  });

  const showSituation = config.mode === "script" || config.mode === "buffer-questions";
  const showTone = ["script", "transcript-analysis", "email", "dozim", "messenger", "touch-chain", "funnel", "voicemail", "objection-quick"].includes(config.mode);
  const showNames = ["script", "transcript-analysis", "email", "dozim", "messenger", "touch-chain", "funnel", "objection-quick"].includes(config.mode);
  const showTranscript = config.mode === "transcript-analysis";
  const showPrice = ["script", "transcript-analysis", "email", "dozim", "messenger", "touch-chain", "funnel"].includes(config.mode);
  const showEmail = config.mode === "email";
  const showDozim = config.mode === "dozim";
  const showLength = ["script", "dozim", "messenger", "touch-chain", "funnel"].includes(config.mode);
  const showTranscriptSubmode = config.mode === "transcript-analysis";
  const showQuick = config.mode === "objection-quick";
  const showPersonas = personas.length > 0 && ["script", "objection-quick", "email", "dozim", "messenger", "touch-chain", "funnel", "transcript-analysis"].includes(config.mode);

  const lengthIdx = ["short", "medium", "long", "detailed"].indexOf(config.scriptLength);

  // Validation
  const issues = useMemo(() => validateConfig({
    mode: config.mode,
    managerName: config.managerName,
    clientName: config.clientName,
    service: config.service,
    context: config.context,
    transcript: config.transcript,
    emailSubtype: config.emailSubtype,
    emailObjection: config.emailObjection,
    priceRub: config.priceRub,
    scriptLength: config.scriptLength,
    personaId: config.personaId,
    defaultManagerName,
    defaultClientName,
  }), [config, defaultManagerName, defaultClientName]);

  const hasError = issues.some(i => i.level === "error");
  const warnings = issues.filter(i => i.level === "warning");
  const infos = issues.filter(i => i.level === "info");

  // Filter modes by search
  const filteredGroups = useMemo(() => {
    const q = modeSearch.trim().toLowerCase();
    if (!q) return MODE_GROUPS;
    return MODE_GROUPS
      .map(g => ({ ...g, modes: g.modes.filter(m => m.label.toLowerCase().includes(q)) }))
      .filter(g => g.modes.length > 0);
  }, [modeSearch]);

  const groupedQuick = useMemo(() => {
    const groups: Record<string, typeof QUICK_OBJECTION_TEMPLATES> = {};
    QUICK_OBJECTION_TEMPLATES.forEach(t => { (groups[t.category] ||= []).push(t); });
    return groups;
  }, []);

  return (
    <aside className={`w-80 shrink-0 border-r border-border/50 glass-panel flex flex-col h-full min-h-0 ${className || ""}`}>
      {/* Header — fixed top */}
      <div className="flex items-center justify-between p-4 pb-2 shrink-0">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-foreground mb-0.5">Конфигурация</h2>
          <p className="text-[10px] text-muted-foreground">Параметры генерации</p>
        </div>
        <button onClick={() => setShowTemplates(!showTemplates)}
          className={`text-[10px] px-2.5 py-1 rounded-lg border transition-all btn-tactile inline-flex items-center gap-1 ${showTemplates ? "chip-active" : "chip-inactive"}`}>
          <Sparkles className="w-3 h-3" /> Шаблоны
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 pb-[max(2rem,env(safe-area-inset-bottom))] flex flex-col gap-3" style={{ WebkitOverflowScrolling: "touch" }}>


        {showTemplates && (
          <div className="flex flex-col gap-1 -mt-1 p-2 rounded-xl border border-border/40 bg-muted/20">
            {TEMPLATES.map((t) => (
              <button key={t.label} onClick={() => { onChange({ ...config, ...t.config }); setShowTemplates(false); }}
                className="text-left text-xs px-3 py-2 rounded-lg hover:bg-accent/50 transition-all btn-tactile text-foreground">
                {t.label}
              </button>
            ))}
          </div>
        )}

      {/* === Section: What to generate === */}
      <Section open={openSections.has("what")} onToggle={() => toggleSection("what")} label="Что генерируем" badge={MODE_LABELS[config.mode]}>
        <div className="relative mb-2">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
          <input value={modeSearch} onChange={(e) => setModeSearch(e.target.value)} placeholder="Поиск режима..."
            className="w-full glass-input border border-border/50 rounded-lg pl-7 pr-2 py-1.5 text-[11px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30" />
        </div>
        <div className="space-y-2.5">
          {filteredGroups.map((group) => {
            const isActiveGroup = group.modes.some(m => m.value === config.mode);
            return (
              <div key={group.label}>
                <div className="flex items-center gap-2 mb-1 px-0.5">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{group.label}</p>
                  <div className="h-px flex-1 bg-border/40" />
                  {isActiveGroup && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {group.modes.map((m) => {
                    const Icon = m.Icon;
                    const active = config.mode === m.value;
                    return (
                      <button key={m.value} onClick={() => update("mode", m.value)} title={m.label}
                        className={`group relative text-left px-2 py-2 rounded-lg border transition-all btn-tactile flex flex-col gap-1 min-h-[58px] ${
                          active
                            ? "border-primary/40 bg-primary/10 shadow-[0_0_0_1px_hsl(var(--primary)/0.2)]"
                            : "border-border/50 bg-card/40 hover:border-primary/30 hover:bg-accent/40"
                        }`}>
                        <Icon className={`w-3.5 h-3.5 ${active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`} />
                        <span className={`text-[11px] leading-tight font-medium ${active ? "text-primary" : "text-foreground"}`}>
                          {m.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Sub-mode controls */}
        {showQuick && (
          <Field label="Шаблон возражения" className="mt-3">
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {Object.entries(groupedQuick).map(([cat, items]) => (
                <div key={cat}>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-1">{cat}</p>
                  <div className="flex flex-wrap gap-1">
                    {items.map(t => (
                      <button key={t.id} title={t.hint}
                        onClick={() => onChange({ ...config, quickTemplateId: t.id, context: t.objection, situation: t.objection })}
                        className={`text-[11px] px-2 py-1 rounded-lg border transition-all btn-tactile ${config.quickTemplateId === t.id ? "chip-active" : "chip-inactive"}`}>
                        {t.objection}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Или опишите возражение в поле «Контекст» ниже</p>
          </Field>
        )}

        {showDozim && (
          <Field label="Тип дожима" className="mt-3">
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
          <Field label="Тип письма" className="mt-3">
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
          <Field label={config.emailSubtype === "objection" ? "Возражение клиента" : "Что нужно клиенту?"} className="mt-3">
            <textarea className="w-full glass-input border border-border/50 rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none h-20"
              placeholder={config.emailSubtype === "objection" ? "Опишите возражение..." : "Например: нужны юридические правки..."}
              value={config.emailObjection} onChange={(e) => update("emailObjection", e.target.value)} />
          </Field>
        )}

        {showTranscriptSubmode && (
          <Field label="Что сгенерировать" className="mt-3">
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
          <Field label="Транскрибация диалога" className="mt-3">
            {transcriberUrl && (
              <a href={transcriberUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[11px] text-primary hover:text-primary/80 mb-2 transition-colors">
                <span>Открыть транскрибатор</span>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
              </a>
            )}
            <textarea className="w-full glass-input border border-border/50 rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none h-40 font-mono"
              placeholder={"Спикер 1: Добрый день...\nСпикер 2: Здравствуйте..."} value={config.transcript} onChange={(e) => update("transcript", e.target.value)} />
            <p className="text-[10px] text-muted-foreground">Минимум 20 символов{!transcriberUrl && ". URL транскрибатора → Настройки"}</p>
          </Field>
        )}
      </Section>

      {/* === Section: Who === */}
      {(showNames || showPersonas) && (
        <Section open={openSections.has("who")} onToggle={() => toggleSection("who")} label="Кому продаём" badge={config.personaId && personas.find(p => p.id === config.personaId)?.name}>
          {showPersonas && (
            <Field label="Персона клиента (тон адаптируется)">
              <div className="grid grid-cols-2 gap-1">
                <button onClick={() => update("personaId", "")}
                  className={`text-[11px] px-2 py-1.5 rounded-lg border transition-all btn-tactile ${!config.personaId ? "chip-active" : "chip-inactive"}`}>
                  Не выбрано
                </button>
                {personas.map(p => (
                  <button key={p.id} onClick={() => update("personaId", p.id)} title={`${p.role}\n${p.communication}`}
                    className={`text-[11px] px-2 py-1.5 rounded-lg border transition-all btn-tactile flex items-center gap-1 ${config.personaId === p.id ? "chip-active" : "chip-inactive"}`}>
                    <Users className="w-3 h-3 shrink-0" />
                    <span className="truncate">{p.name}</span>
                  </button>
                ))}
              </div>
            </Field>
          )}
          {showNames && (
            <>
              <Field label="Имя менеджера">
                <input className="w-full glass-input border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  placeholder={defaultManagerName || "Алексей"} value={config.managerName} onChange={(e) => update("managerName", e.target.value)} />
                {!config.managerName && defaultManagerName && (
                  <p className="text-[10px] text-muted-foreground">По умолчанию: {defaultManagerName}</p>
                )}
              </Field>
              <Field label="Имя клиента">
                <input className="w-full glass-input border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  placeholder={defaultClientName || "Иван Петрович"} value={config.clientName} onChange={(e) => update("clientName", e.target.value)} />
                {!config.clientName && defaultClientName && (
                  <p className="text-[10px] text-muted-foreground">По умолчанию: {defaultClientName}</p>
                )}
              </Field>
            </>
          )}
        </Section>
      )}

      {/* === Section: How === */}
      <Section open={openSections.has("how")} onToggle={() => toggleSection("how")} label="Как и о чём" badge={config.service}>
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
      </Section>

      {/* === Section: Details === */}
      <Section open={openSections.has("details")} onToggle={() => toggleSection("details")} label="Детали" badge={config.priceRub ? `${Number(config.priceRub).toLocaleString("ru-RU")} ₽` : undefined}>
        {showPrice && (
          <Field label="Цена комплекса услуг">
            <div className="flex gap-2">
              <input type="number" className="flex-1 glass-input border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
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

        <Field label="Предыстория взаимодействия">
          <textarea className="w-full glass-input border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none h-20"
            placeholder="Например: уже общались 2 недели назад, клиент запросил КП, но пропал. Ранее работал с конкурентом..."
            value={config.backstory || ""} onChange={(e) => update("backstory", e.target.value)} />
          <p className="text-[10px] text-muted-foreground">Скрипт адаптируется под контекст предыдущих касаний</p>
        </Field>

        <Field label="Сайт клиента (для анализа тематики)">
          <input type="url" className="w-full glass-input border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            placeholder="https://client-site.ru"
            value={config.clientSiteUrl || ""} onChange={(e) => update("clientSiteUrl", e.target.value)} />
          <p className="text-[10px] text-muted-foreground">Если указан — перед генерацией AI проанализирует сайт и адаптирует скрипт под тематику клиента. Пусто — обычная генерация.</p>
        </Field>
      </Section>

      {/* Validation panel */}
      {(warnings.length > 0 || infos.length > 0 || hasError) && (
        <div className="space-y-1">
          {issues.filter(i => i.level === "error").map((i, idx) => (
            <div key={idx} className="flex items-start gap-2 text-[11px] text-destructive bg-destructive/10 border border-destructive/30 rounded-lg px-2.5 py-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" /><span>{i.message}</span>
            </div>
          ))}
          {warnings.map((i, idx) => (
            <div key={idx} className="flex items-start gap-2 text-[11px] text-foreground/80 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-2.5 py-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-yellow-600" /><span>{i.message}</span>
            </div>
          ))}
          {infos.map((i, idx) => (
            <div key={idx} className="flex items-start gap-2 text-[10px] text-muted-foreground bg-muted/30 border border-border/40 rounded-lg px-2.5 py-1.5">
              <Info className="w-3 h-3 shrink-0 mt-0.5" /><span>{i.message}</span>
            </div>
          ))}
        </div>
      )}

        <button onClick={onGenerate} disabled={isGenerating || hasError}
          className="w-full bg-primary text-primary-foreground font-medium py-3 rounded-xl transition-all btn-tactile shadow-glow hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-sm tracking-wide">
          {isGenerating ? "Генерация..." : MODE_LABELS[config.mode]}
        </button>
      </div>
    </aside>
  );
}

function Section({ label, badge, children }: { open?: boolean; onToggle?: () => void; label: string; badge?: string | false; children: React.ReactNode }) {
  return (
    <div className="border border-border/40 rounded-xl glass-card overflow-visible">
      <div className="w-full flex items-center gap-2 px-3 py-2 bg-accent/10">
        <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-foreground flex-1 text-left">{label}</span>
        {badge && <span className="text-[10px] text-muted-foreground truncate max-w-[140px]">{badge}</span>}
      </div>
      <div className="p-3 pt-2 space-y-3 border-t border-border/30">{children}</div>
    </div>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}
