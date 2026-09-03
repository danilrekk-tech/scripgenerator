import { useCallback, useEffect, useMemo, useState } from "react";

export type LiteModuleId =
  // Основные
  | "scripts" | "clients" | "history"
  // Продажи
  | "objections" | "follow-up" | "kp" | "upsell" | "battle-cards" | "discovery" | "value-calc"
  // Аналитика
  | "calls" | "site-audit" | "pre-call-brief" | "style-lab"
  // Обучение
  | "simulator" | "objection-trainer" | "quiz" | "cases"
  // Инструменты
  | "phrases" | "services" | "personas" | "armory" | "wiki" | "competitors";

export type LiteGroup = "core" | "sales" | "analytics" | "training" | "tools";

export const LITE_GROUP_LABELS: Record<LiteGroup, string> = {
  core: "Основные",
  sales: "Продажи",
  analytics: "Аналитика",
  training: "Обучение",
  tools: "Инструменты",
};

export interface LiteModuleMeta {
  id: LiteModuleId;
  label: string;
  description: string;
  group: LiteGroup;
  /** Модуль нельзя выключить — без него интерфейс теряет смысл */
  locked?: boolean;
}

export const LITE_MODULES: LiteModuleMeta[] = [
  { id: "scripts", label: "Скрипты", description: "Генерация скриптов продаж и материалов", group: "core", locked: true },
  { id: "clients", label: "Клиенты", description: "Карточки компаний, ЛПР и заметки", group: "core" },
  { id: "history", label: "История", description: "Все сохранённые генерации", group: "core" },

  { id: "objections", label: "Возражения", description: "Библиотека возражений и готовых ответов", group: "sales" },
  { id: "follow-up", label: "Follow-up", description: "Цепочка касаний после звонка", group: "sales" },
  { id: "kp", label: "КП-конструктор", description: "Коммерческое предложение за минуту", group: "sales" },
  { id: "upsell", label: "Допродажи", description: "Каталог допов и предложения сверху", group: "sales" },
  { id: "battle-cards", label: "Battle Cards", description: "Одностраничник по услуге: оффер и выгоды", group: "sales" },
  { id: "discovery", label: "Discovery Checklist", description: "Вопросы SPIN/BANT для выявления потребности", group: "sales" },
  { id: "value-calc", label: "Value Calculator", description: "Расчёт ожидаемого эффекта для клиента", group: "sales" },

  { id: "calls", label: "Анализ звонков", description: "Расшифровка и AI-анализ звонков", group: "analytics" },
  { id: "site-audit", label: "Анализ сайта", description: "Экспресс-аудит сайта клиента", group: "analytics" },
  { id: "pre-call-brief", label: "Pre-Call Brief", description: "Подготовка и план перед звонком", group: "analytics" },
  { id: "style-lab", label: "Анализ стиля продаж", description: "Обучение генератора вашему стилю", group: "analytics" },

  { id: "simulator", label: "Симулятор клиента", description: "Диалог с AI-клиентом и оценка", group: "training" },
  { id: "objection-trainer", label: "Тренировка возражений", description: "Отработка ответов на возражения", group: "training" },
  { id: "quiz", label: "Quiz", description: "Быстрые задачи на навык продаж", group: "training" },
  { id: "cases", label: "Кейсы", description: "Разборы реальных ситуаций", group: "training" },

  { id: "phrases", label: "Банк фраз", description: "Проверенные речевые модули", group: "tools" },
  { id: "services", label: "Услуги", description: "Каталог услуг для генерации", group: "tools" },
  { id: "personas", label: "Персоны клиентов", description: "Портреты ЛПР для адаптации тона", group: "tools" },
  { id: "armory", label: "Арсенал менеджера", description: "Приёмы и принципы продаж", group: "tools" },
  { id: "wiki", label: "База знаний", description: "Регламенты и шаблоны команды", group: "tools" },
  { id: "competitors", label: "Матрица конкурентов", description: "Мы vs конкуренты по нише", group: "tools" },
];

export type LiteEnabled = Record<LiteModuleId, boolean>;

const allIds = LITE_MODULES.map((m) => m.id);

const build = (ids: LiteModuleId[]): LiteEnabled =>
  Object.fromEntries(allIds.map((id) => [id, ids.includes(id) || id === "scripts"])) as LiteEnabled;

export interface LitePreset {
  id: string;
  label: string;
  description: string;
  modules: LiteModuleId[];
}

export const LITE_PRESETS: LitePreset[] = [
  {
    id: "sales-manager",
    label: "Менеджер продаж",
    description: "Скрипты, клиенты, возражения, follow-up, КП",
    modules: ["scripts", "clients", "history", "objections", "follow-up", "kp", "phrases", "services"],
  },
  {
    id: "head-of-sales",
    label: "Руководитель отдела продаж",
    description: "Скрипты, клиенты, звонки, аналитика, обучение",
    modules: ["scripts", "clients", "history", "calls", "style-lab", "simulator", "quiz", "cases", "battle-cards"],
  },
  {
    id: "seo-digital",
    label: "SEO / Digital менеджер",
    description: "Скрипты, анализ сайта, Pre-Call Brief, клиенты, Value Calculator",
    modules: ["scripts", "site-audit", "pre-call-brief", "clients", "value-calc", "services", "history"],
  },
  {
    id: "generator-only",
    label: "Только генератор",
    description: "Скрипты, возражения, follow-up",
    modules: ["scripts", "objections", "follow-up", "history"],
  },
];

const DEFAULT_ENABLED = build(LITE_PRESETS[0].modules);

const KEY = "scriptengine-lite-modules";
const EVENT = "lite-modules-changed";

interface Stored {
  enabled: Partial<LiteEnabled>;
  presetChosen: boolean;
}

function read(): Stored {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { enabled: DEFAULT_ENABLED, presetChosen: false };
    const parsed = JSON.parse(raw) as Stored;
    return { enabled: { ...DEFAULT_ENABLED, ...(parsed.enabled || {}) }, presetChosen: !!parsed.presetChosen };
  } catch {
    return { enabled: DEFAULT_ENABLED, presetChosen: false };
  }
}

/** Централизованное состояние включённых модулей облегчённого режима. */
export function useLiteModules() {
  const [state, setState] = useState<Stored>(read);

  const persist = useCallback((next: Stored) => {
    setState(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
    window.dispatchEvent(new CustomEvent(EVENT));
  }, []);

  useEffect(() => {
    const sync = () => setState(read());
    window.addEventListener(EVENT, sync);
    window.addEventListener("cloud-data-restored", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("cloud-data-restored", sync);
    };
  }, []);

  const enabled = useMemo(() => ({ ...DEFAULT_ENABLED, ...state.enabled }) as LiteEnabled, [state.enabled]);

  const toggle = useCallback((id: LiteModuleId) => {
    const meta = LITE_MODULES.find((m) => m.id === id);
    if (meta?.locked) return;
    const current = read();
    const merged = { ...DEFAULT_ENABLED, ...current.enabled } as LiteEnabled;
    persist({ ...current, enabled: { ...merged, [id]: !merged[id] } });
  }, [persist]);

  const setAll = useCallback((value: boolean) => {
    const current = read();
    persist({
      ...current,
      enabled: Object.fromEntries(LITE_MODULES.map((m) => [m.id, m.locked ? true : value])) as LiteEnabled,
    });
  }, [persist]);

  const applyPreset = useCallback((presetId: string) => {
    const preset = LITE_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    persist({ enabled: build(preset.modules), presetChosen: true });
  }, [persist]);

  const markPresetChosen = useCallback(() => {
    const current = read();
    persist({ ...current, presetChosen: true });
  }, [persist]);

  const isEnabled = useCallback((id: LiteModuleId) => !!enabled[id], [enabled]);

  const enabledModules = useMemo(() => LITE_MODULES.filter((m) => enabled[m.id]), [enabled]);

  return { enabled, enabledModules, isEnabled, toggle, setAll, applyPreset, presetChosen: state.presetChosen, markPresetChosen };
}
