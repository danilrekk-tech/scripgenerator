import { useState, useEffect, useCallback } from "react";

export type ModuleId =
  | "pipeline"
  | "contacts"
  | "discovery"
  | "competitors"
  | "value-calc"
  | "follow-up"
  | "wiki"
  | "voice-rec"
  | "reframe"
  | "battle-cards";

export interface ModuleMeta {
  id: ModuleId;
  label: string;
  description: string;
  group: "sales" | "knowledge" | "ai-tools";
}

export const MODULE_CATALOG: ModuleMeta[] = [
  { id: "pipeline",     label: "Воронка сделок",      description: "Канбан этапов сделки от первого касания до закрытия", group: "sales" },
  { id: "contacts",     label: "Контакт-карточки",    description: "Лёгкая CRM: компания, ЛПР, заметки и история",        group: "sales" },
  { id: "discovery",    label: "Discovery-чеклист",   description: "Структурированные вопросы SPIN/BANT по услуге",       group: "sales" },
  { id: "competitors",  label: "Сравнение конкурентов", description: "AI-таблица мы vs конкуренты по нише",               group: "ai-tools" },
  { id: "value-calc",   label: "Калькулятор ценности", description: "Расчёт ожидаемого эффекта для клиента",              group: "sales" },
  { id: "follow-up",    label: "Follow-up серии",     description: "AI-цепочка из 3–5 касаний после звонка",              group: "ai-tools" },
  { id: "wiki",         label: "База знаний",         description: "Markdown-страницы с регламентами и шаблонами",        group: "knowledge" },
  { id: "voice-rec",    label: "Голосовая запись",    description: "Запись звонка и отправка во внешний транскрайбер",    group: "ai-tools" },
  { id: "reframe",      label: "Reframe-помощник",    description: "AI переформулирует выделенную фразу 3 способами",     group: "ai-tools" },
  { id: "battle-cards", label: "Battle-cards",        description: "Одностраничник по услуге: оффер, выгоды, возражения", group: "knowledge" },
];

const STORAGE_KEY = "scriptengine-modules";
const LAYOUT_KEY = "scriptengine-layout";

const DEFAULT_ENABLED: Record<ModuleId, boolean> = {
  pipeline: true,
  contacts: true,
  discovery: true,
  competitors: false,
  "value-calc": false,
  "follow-up": true,
  wiki: false,
  "voice-rec": false,
  reframe: true,
  "battle-cards": true,
};

export interface LayoutPrefs {
  startScreen: "generator" | "dashboard" | "bento";
  bentoToolsView: boolean;
  focusMode: boolean;
}

const DEFAULT_LAYOUT: LayoutPrefs = {
  startScreen: "dashboard",
  bentoToolsView: true,
  focusMode: false,
};

export function useModules() {
  const [enabled, setEnabled] = useState<Record<ModuleId, boolean>>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? { ...DEFAULT_ENABLED, ...JSON.parse(raw) } : DEFAULT_ENABLED;
    } catch { return DEFAULT_ENABLED; }
  });
  const [layout, setLayout] = useState<LayoutPrefs>(() => {
    try {
      const raw = localStorage.getItem(LAYOUT_KEY);
      return raw ? { ...DEFAULT_LAYOUT, ...JSON.parse(raw) } : DEFAULT_LAYOUT;
    } catch { return DEFAULT_LAYOUT; }
  });

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(enabled)); window.dispatchEvent(new CustomEvent("modules-changed")); }, [enabled]);
  useEffect(() => { localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout)); window.dispatchEvent(new CustomEvent("layout-changed")); }, [layout]);

  useEffect(() => {
    const sync = () => { try { const r = localStorage.getItem(STORAGE_KEY); if (r) setEnabled({ ...DEFAULT_ENABLED, ...JSON.parse(r) }); } catch {} };
    const syncL = () => { try { const r = localStorage.getItem(LAYOUT_KEY); if (r) setLayout({ ...DEFAULT_LAYOUT, ...JSON.parse(r) }); } catch {} };
    window.addEventListener("modules-changed", sync);
    window.addEventListener("layout-changed", syncL);
    return () => { window.removeEventListener("modules-changed", sync); window.removeEventListener("layout-changed", syncL); };
  }, []);

  const toggle = useCallback((id: ModuleId) => setEnabled((p) => ({ ...p, [id]: !p[id] })), []);
  const setAll = useCallback((v: boolean) => {
    setEnabled(Object.fromEntries(MODULE_CATALOG.map((m) => [m.id, v])) as Record<ModuleId, boolean>);
  }, []);
  const updateLayout = useCallback(<K extends keyof LayoutPrefs>(k: K, v: LayoutPrefs[K]) =>
    setLayout((p) => ({ ...p, [k]: v })), []);

  const isEnabled = (id: ModuleId) => !!enabled[id];

  return { enabled, isEnabled, toggle, setAll, layout, updateLayout };
}
