import { useState, useCallback, useEffect, useMemo } from "react";
import { toast } from "sonner";
import ConfigSidebar, { type ScriptConfig, type GenerationMode } from "@/components/ConfigSidebar";
import ScriptOutput from "@/components/ScriptOutput";
import ContextPreview from "@/components/ContextPreview";
import { buildContextSections, sectionsToPrompt } from "@/lib/contextBuilder";
import { useArmoryItems } from "@/hooks/useArmoryItems";
import Armory from "@/components/Armory";

import DisplaySettingsPanel from "@/components/DisplaySettingsPanel";
import SiteAudit from "@/components/SiteAudit";
import ObjectionTrainer from "@/components/ObjectionTrainer";
import ClientSimulator from "@/components/ClientSimulator";
import ServicesManager from "@/components/ServicesManager";
import GenerationHistory from "@/components/GenerationHistory";
import ThemePicker from "@/components/ThemePicker";
import AuthDialog from "@/components/AuthDialog";
import QuizMode from "@/components/QuizMode";
import CaseLibrary from "@/components/CaseLibrary";

import PhraseBank from "@/components/PhraseBank";
import ClientPersonasPanel from "@/components/ClientPersonasPanel";
import ScenarioBuilder from "@/components/ScenarioBuilder";
import LiveCallAssistant from "@/components/LiveCallAssistant";
import PreCallBrief from "@/components/PreCallBrief";
import ObjectionLibrary from "@/components/ObjectionLibrary";
import SalesStyleLab from "@/components/SalesStyleLab";
import CallAnalyzer from "@/components/CallAnalyzer";
import KPConstructor from "@/components/KPConstructor";
import CommandCenter from "@/components/CommandCenter";
import BentoTools from "@/components/BentoTools";
import CallIntelligence, { type CallIntelView } from "@/components/CallIntelligence";
import ModulesPanel from "@/components/ModulesPanel";
import PipelinePanel from "@/components/modules/PipelinePanel";
import ContactCards from "@/components/modules/ContactCards";
import DiscoveryChecklist from "@/components/modules/DiscoveryChecklist";
import CompetitorMatrix from "@/components/modules/CompetitorMatrix";
import ValueCalculator from "@/components/modules/ValueCalculator";
import FollowUpComposer from "@/components/modules/FollowUpComposer";
import WikiKnowledge from "@/components/modules/WikiKnowledge";
import VoiceRecorder from "@/components/modules/VoiceRecorder";
import ReframeHelper from "@/components/modules/ReframeHelper";
import BattleCards from "@/components/modules/BattleCards";
import { useModules, MODULE_CATALOG, type ModuleId } from "@/hooks/useModules";
import { streamScript } from "@/lib/streamChat";
import { useTheme } from "@/hooks/useTheme";
import { useDisplaySettings } from "@/hooks/useDisplaySettings";
import { useServices } from "@/hooks/useServices";
import { useHistory } from "@/hooks/useHistory";
import { useGeneratorPresets } from "@/hooks/useGeneratorPresets";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useAuth } from "@/hooks/useAuth";
import { useCloudBackup } from "@/hooks/useCloudBackup";
import { useFavorites } from "@/hooks/useFavorites";
import { usePhraseBank } from "@/hooks/usePhraseBank";
import { useClientPersonas } from "@/hooks/useClientPersonas";
import { useScriptNotes } from "@/hooks/useScriptNotes";
import { useUpsells } from "@/hooks/useUpsells";
import UpsellManager from "@/components/UpsellManager";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  FileText, Globe, Zap, MessageCircle, Package, History,
  Save, Trash2, SlidersHorizontal, User, LogOut,
  Menu, Star, Settings, ChevronRight, Brain, BookOpen,
  BookMarked, Users, PanelLeftClose, PanelLeftOpen,
  GitBranch, Headphones, FileSearch, Shield, Palette, Plus, Mic,
  LayoutGrid, Home, Briefcase, ListChecks, GitCompare, Calculator, Send, Sparkles, ShieldCheck, Boxes,
  UploadCloud, BarChart3,
} from "lucide-react";

const SALES_STYLE_KEY = "scriptengine-sales-style";

const defaultConfig: ScriptConfig = {
  managerName: "", clientName: "", service: "SEO-продвижение", situation: "Холодный звонок",
  tone: "Уверенный эксперт", context: "", mode: "script", transcript: "", priceRub: "",
  currency: "RUB", emailSubtype: "follow-up", emailObjection: "", scriptLength: "medium",
  dozimSubtype: "thinking", transcriptSubmode: "analysis", personaId: "", quickTemplateId: "",
  backstory: "", clientSiteUrl: "", scenarioType: "", templateIds: "",
};

type ModulePanel = `mod-${ModuleId}`;
type MobileTab = "config" | "output" | "armory" | "display-settings" | "audit" | "objections" | "simulator" | "services" | "history" | "favorites" | "quiz" | "cases" | "phrases" | "personas" | "scenario-builder" | "live-call" | "pre-call-brief" | "objection-library" | "sales-style" | "call-analyzer" | "kp-constructor" | "dashboard" | "bento" | ModulePanel;
type DesktopPanel = "main" | "armory" | "audit" | "objections" | "simulator" | "services" | "history" | "favorites" | "settings" | "quiz" | "cases" | "phrases" | "personas" | "scenario-builder" | "live-call" | "pre-call-brief" | "objection-library" | "sales-style" | "call-analyzer" | "kp-constructor" | "dashboard" | "bento" | ModulePanel;

export default function Index() {
  const [config, setConfig] = useState<ScriptConfig>(defaultConfig);
  const [script, setScript] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isScoring, setIsScoring] = useState(false);
  const { theme, setTheme } = useTheme();
  const { settings: displaySettings, update: updateDisplay, reset: resetDisplay } = useDisplaySettings();
  const { services, serviceNames, addService, updateService, deleteService, resetToDefaults, getServiceContext } = useServices();
  const { history, addToHistory, deleteFromHistory, clearHistory } = useHistory();
  const { presets, savePreset, deletePreset } = useGeneratorPresets();
  const { appSettings, updateAppSetting } = useAppSettings();
  const { user, signIn, signUp, signOut } = useAuth();
  const { favorites, addFavorite, removeFavorite, isFavorite } = useFavorites();
  const { phrases, addPhrase, removePhrase } = usePhraseBank();
  const { personas, addPersona, updatePersona, removePersona } = useClientPersonas();
  const { notes, addNote, removeNote, clearNotes } = useScriptNotes();
  const { syncNow } = useCloudBackup(user?.id ?? null);
  const { enabled: modulesEnabled, isEnabled: isModuleEnabled, toggle: _toggleMod, setAll: _setAllMod, layout, updateLayout } = useModules();
  const { items: upsells } = useUpsells();
  const [showUpsellManager, setShowUpsellManager] = useState(false);
  void _toggleMod; void _setAllMod;
  const isMobile = useIsMobile();

  const initialPanel: DesktopPanel = layout.startScreen === "dashboard" ? "dashboard" : layout.startScreen === "bento" ? "bento" : "main";
  const [mobileTab, setMobileTab] = useState<MobileTab>(layout.startScreen === "dashboard" ? "dashboard" : layout.startScreen === "bento" ? "bento" : "config");
  const [desktopPanel, setDesktopPanel] = useState<DesktopPanel>(initialPanel);
  const [pendingHistorySave, setPendingHistorySave] = useState(false);
  const [showPresetSave, setShowPresetSave] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [showDesktopSettings, setShowDesktopSettings] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [, setShowToolsSheet] = useState(false); void setShowToolsSheet;
  const [showMenuSheet, setShowMenuSheet] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // For simulator tool overlay - preserve simulator state while viewing tools
  const [simulatorToolOverlay, setSimulatorToolOverlay] = useState<string | null>(null);
  const [showContextPreview, setShowContextPreview] = useState(false);
  const { items: armoryItems } = useArmoryItems();
  // AI Call Intelligence («Разбор звонков») — отдельный режим, по умолчанию выключен
  const [appMode, setAppMode] = useState<"sales" | "training">("sales");
  const [ciView, setCiView] = useState<CallIntelView>("upload");

  const personaSummary = useMemo(() => {
    const p = personas.find((x) => x.id === config.personaId);
    if (!p) return "";
    return `${p.name} — ${p.role}. Стиль общения: ${p.communication}`;
  }, [personas, config.personaId]);

  const contextSections = useMemo(() => buildContextSections({
    service: config.service,
    serviceContext: getServiceContext(config.service),
    scenarioType: config.scenarioType,
    templateIds: config.templateIds,
    backstory: config.backstory,
    clientSiteUrl: config.clientSiteUrl,
    userContext: config.context,
    personaSummary,
    salesStyle: (() => {
      try {
        const raw = localStorage.getItem(SALES_STYLE_KEY);
        return raw ? (JSON.parse(raw)?.recommendations || "") : "";
      } catch { return ""; }
    })(),
    armory: armoryItems,
  }), [config, getServiceContext, personaSummary, armoryItems]);

  // Deep-link из Chrome-расширения: ?service=&situation=&tone=&site=&context=&autostart=1
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (![...p.keys()].length) return;
    const patch: Partial<ScriptConfig> = {};
    if (p.get("service")) patch.service = p.get("service")!;
    if (p.get("situation")) patch.situation = p.get("situation")!;
    if (p.get("tone")) patch.tone = p.get("tone")!;
    if (p.get("site")) patch.clientSiteUrl = p.get("site")!;
    if (p.get("context")) patch.context = p.get("context")!;
    if (Object.keys(patch).length) {
      setConfig((prev) => ({ ...prev, ...patch }));
      toast.success("Параметры получены из расширения");
    }
    window.history.replaceState({}, "", window.location.pathname);
  }, []);


  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      const key = e.key.toLowerCase();
      if (key === "g") { e.preventDefault(); generate(); }
      if (key === "s") { e.preventDefault(); if (script) { navigator.clipboard.writeText(script); toast.success("Скопировано"); } }
      if (key === "e") { e.preventDefault(); if (script) { const blob = new Blob([script], { type: "text/plain" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `script-${Date.now()}.txt`; a.click(); URL.revokeObjectURL(url); } }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [script]);

  useEffect(() => {
    if (pendingHistorySave && !isGenerating && script) {
      addToHistory({ mode: config.mode, service: config.service, label: script.slice(0, 100).replace(/\n/g, " "), content: script });
      setPendingHistorySave(false);
    }
  }, [pendingHistorySave, isGenerating, script]);

  const generate = useCallback(async (overrideContext?: string) => {
    if (isGenerating) return;
    setIsGenerating(true); setScript(""); setPendingHistorySave(true); clearNotes();
    if (isMobile) setMobileTab("output");
    if (desktopPanel !== "main") setDesktopPanel("main");

    let siteSummary = "";
    if (config.clientSiteUrl?.trim()) {
      try {
        toast.loading("Анализируем сайт клиента...", { id: "site-analysis" });
        const AUDIT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/site-audit`;
        const resp = await fetch(AUDIT_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
          body: JSON.stringify({ url: config.clientSiteUrl.trim() }),
        });
        if (resp.ok) {
          const data = await resp.json();
          const findDetail = (name: string) => data.checks?.find((c: any) => c.name === name)?.detail || "";
          siteSummary = [
            `URL: ${data.url}`,
            `Title: ${findDetail("Title тег")}`,
            `H1: ${findDetail("Тег H1")}`,
            `Description: ${findDetail("Meta Description")}`,
            `Резюме: ${data.summary}`,
          ].filter(Boolean).join("\n");
          toast.success("Сайт проанализирован", { id: "site-analysis" });
        } else {
          toast.error("Не удалось проанализировать сайт — генерируем без него", { id: "site-analysis" });
        }
      } catch {
        toast.dismiss("site-analysis");
      }
    }

    let salesStyle = "";
    try {
      const styleRaw = localStorage.getItem(SALES_STYLE_KEY);
      if (styleRaw) salesStyle = JSON.parse(styleRaw)?.recommendations || "";
    } catch {}

    const sections = buildContextSections({
      service: config.service,
      serviceContext: getServiceContext(config.service),
      scenarioType: config.scenarioType,
      templateIds: config.templateIds,
      backstory: config.backstory,
      clientSiteUrl: config.clientSiteUrl,
      siteSummary,
      userContext: overrideContext || config.context,
      personaSummary,
      salesStyle,
      armory: armoryItems,
    });

    const payload: Record<string, string> = { ...config, context: sectionsToPrompt(sections) };
    streamScript({
      config: payload,
      onDelta: (chunk) => setScript((prev) => prev + chunk),
      onDone: () => setIsGenerating(false),
      onError: (msg) => { toast.error(msg); setIsGenerating(false); setPendingHistorySave(false); },
    });
  }, [config, isGenerating, isMobile, desktopPanel, getServiceContext, clearNotes, personaSummary, armoryItems]);


  const handleCompanionGenerate = useCallback((type: "objections" | "arguments" | "benefits" | "dozim" | "upsell", upsellIds?: string[]) => {
    if (isGenerating || !script) return;
    const typeLabels = { objections: "возможные возражения клиента и ответы", arguments: "дополнительные аргументы", benefits: "конкретные выгоды клиента", dozim: "фразы для дожима", upsell: "логичные предложения допродаж" };
    // Enforce structured markdown output
    const structureHint = type === "upsell"
      ? `Верни СТРОГО структуру в markdown:
## 💼 Что предлагаем сверху
- список выбранных допов, каждый одной строкой (название — 1 предложение ценности)

## 🎯 Мостик из основного скрипта
- 2-3 варианта фраз для естественного перехода от основной услуги к допам (используй имена [Имя менеджера], [Имя клиента])

## 🗣️ Готовые формулировки предложения
- по одной "речёвке" на каждый доп: контекст → выгода → цена → мягкий вопрос-закрытие

## 🛡️ Ответы на "нам это не нужно"
- 2 короткие реплики на каждое возражение против допов

Пиши без воды, каждый пункт максимум 2 предложения.`
      : `Верни СТРОГО структуру в markdown с разделами и списками:
## 🎯 Суть
- 1-2 предложения контекста
## 📋 ${type === "objections" ? "Возражения и ответы" : type === "arguments" ? "Аргументы" : type === "benefits" ? "Выгоды" : "Приёмы дожима"}
- 5 нумерованных пунктов, каждый: **заголовок** — ответ/формулировка 1-2 предложения
## 💬 Готовые фразы менеджера
- 3-5 коротких реплик с [Имя менеджера] и [Имя клиента]
## ➡️ Следующий шаг
- одна фраза-мост к продолжению разговора

Продолжай логику основного скрипта, не повторяй уже сказанное.`;

    let extra = "";
    if (type === "upsell") {
      const chosen = (upsells || []).filter((u) => (upsellIds && upsellIds.length ? upsellIds.includes(u.id) : true));
      if (chosen.length > 0) {
        extra = `\n\nКАТАЛОГ ДОПРОДАЖ (используй ИМЕННО их, не выдумывай):\n` + chosen.map((u, i) => `${i + 1}. ${u.name}${u.price ? ` — ${u.price}` : ""}\n   ${u.description}${u.bestFor ? `\n   Когда: ${u.bestFor}` : ""}`).join("\n");
      } else {
        extra = `\n\nКлиент не задал каталог — предложи 2-3 логичных допродажи под услугу "${config.service}".`;
      }
    }

    const companionContext = `ОСНОВНОЙ СКРИПТ:\n${script}\n\nЗАДАЧА: Сгенерируй ${typeLabels[type]}. Это ЛОГИЧЕСКОЕ ПРОДОЛЖЕНИЕ ОДНОГО разговора, а не новый скрипт.${extra}\n\n${structureHint}`;
    setIsGenerating(true); setScript((prev) => prev + "\n\n---\n\n"); setPendingHistorySave(true);
    const svcContext = getServiceContext(config.service);
    const enrichedContext = svcContext ? `${svcContext}\n\n${companionContext}` : companionContext;
    const mode = type === "dozim" ? "dozim" : type === "upsell" ? "arguments" : "arguments";
    const payload: Record<string, string> = { ...config, mode, context: enrichedContext };
    streamScript({ config: payload, onDelta: (chunk) => setScript((prev) => prev + chunk), onDone: () => setIsGenerating(false), onError: (msg) => { toast.error(msg); setIsGenerating(false); setPendingHistorySave(false); } });
  }, [config, isGenerating, script, getServiceContext, upsells]);

  const handleScoreScript = useCallback(() => {
    if (!script || isScoring) return;
    setIsScoring(true);
    setScript((prev) => prev + "\n\n---\n\n## ОЦЕНКА СКРИПТА\n\n");
    const payload: Record<string, string> = { ...config, mode: "script-scoring", context: script };
    streamScript({ config: payload, onDelta: (chunk) => setScript((prev) => prev + chunk), onDone: () => setIsScoring(false), onError: (msg) => { toast.error(msg); setIsScoring(false); } });
  }, [script, isScoring, config]);

  const handleArmorySelect = useCallback((prompt: string) => generate(prompt), [generate]);
  const handleAuditGenerate = useCallback((ctx: string) => { setConfig((p) => ({ ...p, context: ctx })); generate(ctx); }, [generate]);
  const handleHistoryLoad = useCallback((content: string) => { setScript(content); if (isMobile) setMobileTab("output"); if (desktopPanel !== "main") setDesktopPanel("main"); }, [isMobile, desktopPanel]);
  const handleSavePreset = () => { if (!presetName.trim()) return; savePreset(presetName.trim(), config); setPresetName(""); setShowPresetSave(false); toast.success("Пресет сохранён"); };
  const handleLoadPreset = (presetConfig: Partial<ScriptConfig>) => { setConfig((prev) => ({ ...prev, ...presetConfig })); toast.success("Пресет загружен"); };
  const handleScriptEdit = useCallback((newScript: string) => setScript(newScript), []);

  const handleToggleFavorite = useCallback(() => {
    if (!script) return;
    if (isFavorite(script)) { const fav = favorites.find((f) => f.content === script); if (fav) removeFavorite(fav.id); toast.success("Удалено из избранного"); }
    else { addFavorite({ label: script.slice(0, 80).replace(/\n/g, " "), content: script, mode: config.mode, service: config.service }); toast.success("Добавлено в избранное"); }
  }, [script, isFavorite, favorites, addFavorite, removeFavorite, config]);

  const handleCopyPhrase = useCallback((text: string) => { navigator.clipboard.writeText(text); toast.success("Фраза скопирована"); }, []);

  // Handler for simulator tool overlay
  const handleSimulatorOpenTool = useCallback((toolId: string) => {
    setSimulatorToolOverlay(toolId);
  }, []);


  type NavGroup = { label: string; items: { value: DesktopPanel; label: string; icon: React.ReactNode; beta?: boolean }[] };

  const MOD_ICON: Record<ModuleId, React.ReactNode> = {
    pipeline: <Briefcase className="w-4 h-4" />,
    contacts: <Users className="w-4 h-4" />,
    discovery: <ListChecks className="w-4 h-4" />,
    competitors: <GitCompare className="w-4 h-4" />,
    "value-calc": <Calculator className="w-4 h-4" />,
    "follow-up": <Send className="w-4 h-4" />,
    wiki: <BookOpen className="w-4 h-4" />,
    "voice-rec": <Mic className="w-4 h-4" />,
    reframe: <Sparkles className="w-4 h-4" />,
    "battle-cards": <ShieldCheck className="w-4 h-4" />,
  };

  const enabledModuleNavItems = MODULE_CATALOG
    .filter((m) => isModuleEnabled(m.id))
    .map((m) => ({ value: `mod-${m.id}` as DesktopPanel, label: m.label, icon: MOD_ICON[m.id] }));

  const navGroups: NavGroup[] = [
    { label: "Начало", items: [
      { value: "dashboard", label: "Дашборд", icon: <Home className="w-4 h-4" /> },
      { value: "bento", label: "Все инструменты", icon: <LayoutGrid className="w-4 h-4" /> },
    ]},
    { label: "Основное", items: [
      { value: "main", label: "Генератор", icon: <FileText className="w-4 h-4" /> },
      { value: "armory", label: "Арсенал", icon: <Zap className="w-4 h-4" /> },
      { value: "history", label: "История", icon: <History className="w-4 h-4" /> },
      { value: "favorites", label: "Избранное", icon: <Star className="w-4 h-4" /> },
    ]},
    { label: "AI Studio", items: [
      { value: "scenario-builder", label: "Сценарии", icon: <GitBranch className="w-4 h-4" /> },
      { value: "live-call", label: "Суфлёр", icon: <Headphones className="w-4 h-4" /> },
      { value: "pre-call-brief", label: "Бриф", icon: <FileSearch className="w-4 h-4" /> },
      { value: "objection-library", label: "Возражения", icon: <Shield className="w-4 h-4" /> },
      { value: "sales-style", label: "Стиль", icon: <Palette className="w-4 h-4" /> },
      { value: "call-analyzer", label: "AI-Аналитик", icon: <Mic className="w-4 h-4" />, beta: true },
      { value: "kp-constructor", label: "Конструктор КП", icon: <FileText className="w-4 h-4" />, beta: true },
    ]},
    { label: "Тренировка", items: [
      { value: "simulator", label: "Симулятор", icon: <MessageCircle className="w-4 h-4" /> },
      { value: "objections", label: "Тренажёр", icon: <Zap className="w-4 h-4" /> },
      { value: "quiz", label: "Квиз", icon: <Brain className="w-4 h-4" /> },
    ]},
    ...(enabledModuleNavItems.length > 0 ? [{ label: "Модули", items: enabledModuleNavItems }] : []),
    { label: "Библиотека", items: [
      { value: "cases", label: "Кейсы", icon: <BookOpen className="w-4 h-4" /> },
      { value: "phrases", label: "Банк фраз", icon: <BookMarked className="w-4 h-4" /> },
      { value: "personas", label: "Персоны", icon: <Users className="w-4 h-4" /> },
      { value: "services", label: "Услуги", icon: <Package className="w-4 h-4" /> },
    ]},
  ];

  // Desktop layout
  if (!isMobile) {
    return (
      <TooltipProvider delayDuration={400}>
      <div className="flex overflow-hidden" style={{ height: "100dvh" }}>
        {/* Left sidebar navigation */}
        <aside className={`shrink-0 glass-panel border-r border-border/50 flex flex-col transition-all duration-300 ${sidebarCollapsed ? "w-14" : "w-48"}`}>
          <div className="px-3 py-3 border-b border-border/30 flex items-center gap-2">
            <div className="relative shrink-0 group cursor-pointer">
              <div className="absolute inset-0 rounded-xl blur-md opacity-60 group-hover:opacity-100 transition-opacity" style={{ background: 'var(--accent-gradient)' }} />
              <div className="relative w-8 h-8 rounded-xl border border-border/40 flex items-center justify-center overflow-hidden" style={{ background: 'hsl(var(--background))' }}>
                <span className="font-display font-extrabold text-transparent bg-clip-text text-[13px] tracking-tight" style={{ backgroundImage: 'var(--accent-gradient)' }}>SE</span>
              </div>
            </div>
            {!sidebarCollapsed && (
              <h1 className="font-display text-xs font-bold tracking-tight text-foreground truncate">ScriptEngine</h1>
            )}
          </div>

          <div className={`border-b border-border/30 ${sidebarCollapsed ? "px-1.5 py-2" : "px-2 py-2"}`}>
            <ModeSwitch mode={appMode} onChange={setAppMode} compact={sidebarCollapsed} />
          </div>

          <nav className="flex-1 overflow-y-auto py-2 px-1.5 space-y-3">
            {((appMode === "training" ? TRAINING_NAV_GROUPS : navGroups) as { label: string; items: { value: string; label: string; icon: React.ReactNode }[] }[]).map((group) => (
              <div key={group.label}>
                {!sidebarCollapsed && (
                  <p className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground font-medium px-2 mb-1">{group.label}</p>
                )}
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const training = appMode === "training";
                    const isActive = training ? ciView === (item.value as CallIntelView) : desktopPanel === item.value;
                    const btn = (
                      <button
                        key={item.value}
                        onClick={() => training ? setCiView(item.value as CallIntelView) : setDesktopPanel(item.value as DesktopPanel)}
                        className={`w-full flex items-center gap-2 rounded-lg transition-all duration-200 btn-tactile ${
                          sidebarCollapsed ? "justify-center p-2" : "px-2 py-1.5"
                        } ${
                          isActive
                            ? "bg-primary/10 text-primary shadow-sm"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                        }`}
                      >
                        <span className="shrink-0">{item.icon}</span>
                        {!sidebarCollapsed && (
                          <span className="text-xs font-medium truncate">{item.label}</span>
                        )}
                      </button>
                    );

                    if (sidebarCollapsed) {
                      return (
                        <Tooltip key={item.value}>
                          <TooltipTrigger asChild>{btn}</TooltipTrigger>
                          <TooltipContent side="right" className="text-xs">{item.label}</TooltipContent>
                        </Tooltip>
                      );
                    }
                    return <div key={item.value}>{btn}</div>;
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="border-t border-border/30 p-1.5 space-y-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={() => setDesktopPanel("settings")}
                  className={`w-full flex items-center gap-2 rounded-lg transition-all btn-tactile ${
                    sidebarCollapsed ? "justify-center p-2" : "px-2 py-1.5"
                  } ${desktopPanel === "settings" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"}`}>
                  <Settings className="w-4 h-4 shrink-0" />
                  {!sidebarCollapsed && <span className="text-xs font-medium">Настройки</span>}
                </button>
              </TooltipTrigger>
              {sidebarCollapsed && <TooltipContent side="right" className="text-xs">Настройки</TooltipContent>}
            </Tooltip>


            {user ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button onClick={signOut} className={`w-full flex items-center gap-2 rounded-lg transition-all btn-tactile ${sidebarCollapsed ? "justify-center p-2" : "px-2 py-1.5"} text-muted-foreground hover:text-foreground hover:bg-accent/50`}>
                    <LogOut className="w-4 h-4 shrink-0" />
                    {!sidebarCollapsed && <span className="text-xs font-medium">Выйти</span>}
                  </button>
                </TooltipTrigger>
                {sidebarCollapsed && <TooltipContent side="right" className="text-xs">Выйти</TooltipContent>}
              </Tooltip>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button onClick={() => setShowAuthDialog(true)} className={`w-full flex items-center gap-2 rounded-lg transition-all btn-tactile ${sidebarCollapsed ? "justify-center p-2" : "px-2 py-1.5"} text-muted-foreground hover:text-foreground hover:bg-accent/50`}>
                    <User className="w-4 h-4 shrink-0" />
                    {!sidebarCollapsed && <span className="text-xs font-medium">Войти</span>}
                  </button>
                </TooltipTrigger>
                {sidebarCollapsed && <TooltipContent side="right" className="text-xs">Войти</TooltipContent>}
              </Tooltip>
            )}

            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className={`w-full flex items-center gap-2 rounded-lg transition-all btn-tactile ${sidebarCollapsed ? "justify-center p-2" : "px-2 py-1.5"} text-muted-foreground hover:text-foreground hover:bg-accent/50`}>
                  {sidebarCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
                  {!sidebarCollapsed && <span className="text-xs font-medium">Свернуть</span>}
                </button>
              </TooltipTrigger>
              {sidebarCollapsed && <TooltipContent side="right" className="text-xs">Развернуть</TooltipContent>}
            </Tooltip>
          </div>
        </aside>

        {/* Main content area */}
        {appMode === "training" ? (
          <div className="flex-1 min-w-0 glass-panel m-2 rounded-xl overflow-hidden">
            <CallIntelligence view={ciView} onViewChange={setCiView} serviceNames={serviceNames} className="h-full" />
          </div>
        ) : (
        <div className="flex-1 flex min-w-0">
          {/* Generator config sidebar moved to RIGHT side — see below */}

          <div className="flex-1 flex flex-col min-w-0">
            {/* Compact top bar */}
            {desktopPanel === "main" && (
              <div className="glass-panel border-b border-border/50 px-4 py-1.5 flex items-center justify-end gap-1 shrink-0">
                <div className="relative">
                  <button onClick={() => setShowPresetSave(!showPresetSave)} className="p-1.5 rounded-lg hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-colors" title="Пресеты"><Save className="w-3.5 h-3.5" /></button>
                  {showPresetSave && (
                    <div className="absolute right-0 top-full mt-1 w-72 glass-card border border-border/50 rounded-xl shadow-lg z-50 p-3">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Сохранить пресет</p>
                      <div className="flex gap-1.5 mb-3">
                        <input className="flex-1 glass-input border border-border/50 rounded-lg px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30" placeholder="Название..." value={presetName} onChange={(e) => setPresetName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSavePreset()} />
                        <button onClick={handleSavePreset} disabled={!presetName.trim()} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:opacity-90 disabled:opacity-30 btn-tactile">Сохранить</button>
                      </div>
                      {presets.length > 0 && (
                        <>
                          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Загрузить</p>
                          <div className="max-h-40 overflow-y-auto space-y-1">
                            {presets.map((p) => (
                              <div key={p.id} className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg hover:bg-accent/50 group">
                                <button onClick={() => { handleLoadPreset(p.config); setShowPresetSave(false); }} className="flex-1 text-left text-xs text-foreground truncate">{p.name}</button>
                                <button onClick={() => deletePreset(p.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"><Trash2 className="w-3 h-3" /></button>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
                <button onClick={() => setShowDesktopSettings(!showDesktopSettings)} className={`p-1.5 rounded-lg hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-colors ${showDesktopSettings ? "bg-accent text-foreground" : ""}`} title="Настройки отображения">
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="flex flex-1 min-h-0">
              {desktopPanel === "main" && (
                <>
                  {showDesktopSettings && (<div className="w-72 shrink-0 border-r border-border/50 glass-panel p-5 overflow-y-auto"><DisplaySettingsPanel settings={displaySettings} onUpdate={updateDisplay} onReset={resetDisplay} currentTheme={theme} onThemeChange={setTheme} /></div>)}
                  <ScriptOutput script={script} isGenerating={isGenerating} mode={config.mode} displaySettings={displaySettings}
                    onCompanionGenerate={handleCompanionGenerate} onScoreScript={handleScoreScript} isScoring={isScoring}
                    isFavorite={isFavorite(script)} onToggleFavorite={handleToggleFavorite}
                    onScriptEdit={handleScriptEdit} notes={notes} onAddNote={addNote} onRemoveNote={removeNote}
                    upsells={upsells} onOpenUpsellManager={() => setShowUpsellManager(true)} />
                  <ConfigSidebar config={config} onChange={setConfig} onGenerate={() => generate()} isGenerating={isGenerating}
                    personas={personas} onPreviewContext={() => setShowContextPreview(true)}
                    serviceNames={serviceNames} transcriberUrl={appSettings.transcriberUrl} className="glass-panel border-l border-border/50" />

                </>
              )}
              {desktopPanel === "armory" && <div className="flex-1 glass-panel m-2 rounded-xl overflow-hidden"><Armory onSelect={handleArmorySelect} isGenerating={isGenerating} className="!w-full !border-l-0 h-full" /></div>}
              {desktopPanel === "audit" && <div className="flex-1 glass-panel m-2 rounded-xl overflow-hidden"><SiteAudit onGenerateScript={handleAuditGenerate} isGenerating={isGenerating} serviceNames={serviceNames} className="h-full" /></div>}
              {desktopPanel === "objections" && <div className="flex-1 glass-panel m-2 rounded-xl overflow-hidden"><ObjectionTrainer serviceNames={serviceNames} className="h-full" /></div>}
              {desktopPanel === "simulator" && (
                <div className="flex-1 glass-panel m-2 rounded-xl overflow-hidden relative">
                  <ClientSimulator serviceNames={serviceNames} className="h-full" onOpenTool={handleSimulatorOpenTool} />
                </div>
              )}
              {desktopPanel === "services" && <div className="flex-1 glass-panel m-2 rounded-xl overflow-hidden"><ServicesManager services={services} onAdd={addService} onUpdate={updateService} onDelete={deleteService} onReset={resetToDefaults} className="h-full" /></div>}
              {desktopPanel === "history" && <div className="flex-1 glass-panel m-2 rounded-xl overflow-hidden"><GenerationHistory history={history} onLoad={handleHistoryLoad} onDelete={deleteFromHistory} onClear={clearHistory} className="h-full" /></div>}
              {desktopPanel === "favorites" && <div className="flex-1 glass-panel m-2 rounded-xl overflow-hidden"><FavoritesPanel favorites={favorites} onLoad={handleHistoryLoad} onRemove={removeFavorite} /></div>}
              {desktopPanel === "quiz" && <div className="flex-1 glass-panel m-2 rounded-xl overflow-hidden"><QuizMode serviceNames={serviceNames} className="h-full" /></div>}
              {desktopPanel === "cases" && <div className="flex-1 glass-panel m-2 rounded-xl overflow-hidden"><CaseLibrary className="h-full" /></div>}
              {desktopPanel === "phrases" && <div className="flex-1 glass-panel m-2 rounded-xl overflow-hidden"><PhraseBank phrases={phrases} onAdd={addPhrase} onRemove={removePhrase} onCopy={handleCopyPhrase} className="h-full" /></div>}
              {desktopPanel === "personas" && <div className="flex-1 glass-panel m-2 rounded-xl overflow-hidden"><ClientPersonasPanel personas={personas} onAdd={addPersona} onUpdate={updatePersona} onRemove={removePersona} className="h-full" /></div>}
              {desktopPanel === "scenario-builder" && <div className="flex-1 glass-panel m-2 rounded-xl overflow-hidden"><ScenarioBuilder serviceNames={serviceNames} className="h-full" /></div>}
              {desktopPanel === "live-call" && <div className="flex-1 glass-panel m-2 rounded-xl overflow-hidden"><LiveCallAssistant serviceNames={serviceNames} className="h-full" /></div>}
              {desktopPanel === "pre-call-brief" && <div className="flex-1 glass-panel m-2 rounded-xl overflow-hidden"><PreCallBrief serviceNames={serviceNames} className="h-full" /></div>}
              {desktopPanel === "objection-library" && <div className="flex-1 glass-panel m-2 rounded-xl overflow-hidden"><ObjectionLibrary serviceNames={serviceNames} className="h-full" /></div>}
              {desktopPanel === "sales-style" && <div className="flex-1 glass-panel m-2 rounded-xl overflow-hidden"><SalesStyleLab className="h-full" /></div>}
              {desktopPanel === "call-analyzer" && <div className="flex-1 glass-panel m-2 rounded-xl overflow-hidden"><CallAnalyzer serviceNames={serviceNames} className="h-full" /></div>}
              {desktopPanel === "kp-constructor" && <div className="flex-1 glass-panel m-2 rounded-xl overflow-hidden"><KPConstructor serviceNames={serviceNames} className="h-full" /></div>}
              {desktopPanel === "dashboard" && <div className="flex-1 glass-panel m-2 rounded-xl overflow-hidden"><CommandCenter historyCount={history.length} favoritesCount={favorites.length} recentItems={history as any} onQuickGenerate={() => setDesktopPanel("main")} onOpenPanel={(p) => setDesktopPanel(p as DesktopPanel)} onLoadHistory={handleHistoryLoad} modulesEnabled={modulesEnabled} userName={user?.email?.split("@")[0]} /></div>}
              {desktopPanel === "bento" && <div className="flex-1 glass-panel m-2 rounded-xl overflow-hidden"><BentoTools onOpen={(id) => setDesktopPanel(id as DesktopPanel)} enabledModules={modulesEnabled} /></div>}
              {desktopPanel === "mod-pipeline" && <div className="flex-1 glass-panel m-2 rounded-xl overflow-hidden"><PipelinePanel className="h-full" /></div>}
              {desktopPanel === "mod-contacts" && <div className="flex-1 glass-panel m-2 rounded-xl overflow-hidden"><ContactCards className="h-full" /></div>}
              {desktopPanel === "mod-discovery" && <div className="flex-1 glass-panel m-2 rounded-xl overflow-hidden"><DiscoveryChecklist className="h-full" /></div>}
              {desktopPanel === "mod-competitors" && <div className="flex-1 glass-panel m-2 rounded-xl overflow-hidden"><CompetitorMatrix serviceNames={serviceNames} className="h-full" /></div>}
              {desktopPanel === "mod-value-calc" && <div className="flex-1 glass-panel m-2 rounded-xl overflow-hidden"><ValueCalculator className="h-full" /></div>}
              {desktopPanel === "mod-follow-up" && <div className="flex-1 glass-panel m-2 rounded-xl overflow-hidden"><FollowUpComposer serviceNames={serviceNames} className="h-full" /></div>}
              {desktopPanel === "mod-wiki" && <div className="flex-1 glass-panel m-2 rounded-xl overflow-hidden"><WikiKnowledge className="h-full" /></div>}
              {desktopPanel === "mod-voice-rec" && <div className="flex-1 glass-panel m-2 rounded-xl overflow-hidden"><VoiceRecorder transcriberUrl={appSettings.transcriberUrl} className="h-full" /></div>}
              {desktopPanel === "mod-reframe" && <div className="flex-1 glass-panel m-2 rounded-xl overflow-hidden"><ReframeHelper className="h-full" /></div>}
              {desktopPanel === "mod-battle-cards" && <div className="flex-1 glass-panel m-2 rounded-xl overflow-hidden"><BattleCards serviceNames={serviceNames} className="h-full" /></div>}
              {desktopPanel === "settings" && <div className="flex-1 glass-panel m-2 rounded-xl overflow-hidden"><AppSettingsPanel transcriberUrl={appSettings.transcriberUrl} onTranscriberUrlChange={(v) => updateAppSetting("transcriberUrl", v)} appSettings={appSettings} onUpdateAppSetting={updateAppSetting} currentTheme={theme} onThemeChange={setTheme} user={user} onSignIn={() => setShowAuthDialog(true)} onSignOut={signOut} onSyncNow={syncNow} displaySettings={displaySettings} onUpdateDisplay={updateDisplay} onResetDisplay={resetDisplay} /></div>}
            </div>
          </div>
        </div>
        )}

        {/* Simulator tool overlay - shows tools without losing simulator progress */}
        <Sheet open={!!simulatorToolOverlay} onOpenChange={(open) => !open && setSimulatorToolOverlay(null)}>
          <SheetContent side="right" className="glass-panel w-[400px] sm:w-[500px] p-0">
            <SheetHeader className="px-4 py-3 border-b border-border/50">
              <SheetTitle className="text-sm">
                {simulatorToolOverlay === "armory" && "Арсенал возражений"}
                {simulatorToolOverlay === "objection-library" && "Библиотека возражений"}
                {simulatorToolOverlay === "phrases" && "Банк фраз"}
                {simulatorToolOverlay === "live-call" && "Суфлёр"}
              </SheetTitle>
            </SheetHeader>
            <div className="h-[calc(100%-52px)] overflow-y-auto">
              {simulatorToolOverlay === "armory" && <Armory onSelect={handleArmorySelect} isGenerating={isGenerating} className="!w-full !border-l-0" />}
              {simulatorToolOverlay === "objection-library" && <ObjectionLibrary serviceNames={serviceNames} className="h-full" />}
              {simulatorToolOverlay === "phrases" && <PhraseBank phrases={phrases} onAdd={addPhrase} onRemove={removePhrase} onCopy={handleCopyPhrase} className="h-full" />}
              {simulatorToolOverlay === "live-call" && <LiveCallAssistant serviceNames={serviceNames} className="h-full" />}
            </div>
          </SheetContent>
        </Sheet>

        <AuthDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} onSignIn={signIn} onSignUp={signUp} />
      </div>
      </TooltipProvider>
    );
  }

  // Mobile
  // Mobile menu items below

  const menuItems = [
    { tab: "services" as MobileTab, label: "Услуги", icon: <Package className="w-5 h-5" /> },
    { tab: "history" as MobileTab, label: "История", icon: <History className="w-5 h-5" /> },
    { tab: "favorites" as MobileTab, label: "Избранное", icon: <Star className="w-5 h-5" /> },
  ];

  // Mobile: режим «Обучение» (Разбор звонков) — отдельный экран, обычный режим не затрагивается
  if (appMode === "training") {
    return (
      <div className="flex flex-col overflow-hidden" style={{ height: "100dvh", paddingTop: "env(safe-area-inset-top, 0px)" }}>
        <header className="glass-panel border-b border-border/50 px-3 py-2.5 shrink-0 space-y-2">
          <ModeSwitch mode={appMode} onChange={setAppMode} />
          <div className="inline-flex w-full glass-card border border-border/50 rounded-xl p-0.5">
            {CI_VIEWS.map((v) => (
              <button key={v.value} onClick={() => setCiView(v.value)}
                className={`flex-1 px-2 py-1.5 rounded-lg text-[11px] font-medium transition-all ${ciView === v.value ? "bg-primary/15 text-primary" : "text-muted-foreground"}`}>
                {v.label}
              </button>
            ))}
          </div>
        </header>
        <div className="flex-1 min-h-0">
          <CallIntelligence view={ciView} onViewChange={setCiView} serviceNames={serviceNames} className="h-full" />
        </div>
      </div>
    );
  }

  return (
    <>
    {showUpsellManager && <UpsellManager onClose={() => setShowUpsellManager(false)} serviceNames={serviceNames} />}
    {showContextPreview && (
      <ContextPreview sections={contextSections} isGenerating={isGenerating}
        onClose={() => setShowContextPreview(false)} onGenerate={() => generate()} />
    )}

    <div
      className="flex flex-col overflow-hidden"
      style={{
        height: "100dvh",
        paddingTop: "env(safe-area-inset-top, 0px)",
      }}
    >
      <header className="glass-panel border-b border-border/50 flex items-center justify-between px-3 py-2.5 shrink-0 z-10 gap-2">
        <button onClick={() => setMobileTab("config")} className="flex items-center gap-2 shrink-0">
          <div className="relative shrink-0">
            <div className="absolute inset-0 rounded-xl blur-md opacity-60" style={{ background: 'var(--accent-gradient)' }} />
            <div className="relative w-8 h-8 rounded-xl border border-border/40 flex items-center justify-center overflow-hidden" style={{ background: 'hsl(var(--background))' }}>
              <span className="font-display font-extrabold text-transparent bg-clip-text text-[13px]" style={{ backgroundImage: 'var(--accent-gradient)' }}>SE</span>
            </div>
          </div>
          <h1 className="font-display text-sm font-semibold tracking-tight text-foreground hidden xs:inline">ScriptEngine</h1>
        </button>
        <div className="flex-1 flex justify-center min-w-0">
          <ModeSwitch mode={appMode} onChange={setAppMode} size="sm" />
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {user ? (<button onClick={signOut} className="p-2 rounded-lg hover:bg-accent/50 text-muted-foreground"><LogOut className="w-4 h-4" /></button>)
            : (<button onClick={() => setShowAuthDialog(true)} className="p-2 rounded-lg hover:bg-accent/50 text-muted-foreground"><User className="w-4 h-4" /></button>)}
        </div>
      </header>

      <div
        className="flex-1 min-h-0 overflow-hidden"
        style={{ paddingBottom: "calc(64px + env(safe-area-inset-bottom, 8px))" }}
      >
        {mobileTab === "config" && <ConfigSidebar config={config} onChange={setConfig} onGenerate={() => generate()} isGenerating={isGenerating} serviceNames={serviceNames} personas={personas} onPreviewContext={() => setShowContextPreview(true)} className="!w-full !border-r-0 h-full glass-panel" transcriberUrl={appSettings.transcriberUrl} />}
        {mobileTab === "output" && <ScriptOutput script={script} isGenerating={isGenerating} mode={config.mode} displaySettings={displaySettings} className="h-full" onCompanionGenerate={handleCompanionGenerate} onScoreScript={handleScoreScript} isScoring={isScoring} isFavorite={isFavorite(script)} onToggleFavorite={handleToggleFavorite} onScriptEdit={handleScriptEdit} notes={notes} onAddNote={addNote} onRemoveNote={removeNote} upsells={upsells} onOpenUpsellManager={() => setShowUpsellManager(true)} />}
        {mobileTab === "armory" && <Armory onSelect={handleArmorySelect} isGenerating={isGenerating} className="!w-full !border-l-0 h-full" />}
        {mobileTab === "display-settings" && <div className="h-full overflow-y-auto p-6"><DisplaySettingsPanel settings={displaySettings} onUpdate={updateDisplay} onReset={resetDisplay} currentTheme={theme} onThemeChange={setTheme} /></div>}
        {mobileTab === "audit" && <SiteAudit onGenerateScript={handleAuditGenerate} isGenerating={isGenerating} serviceNames={serviceNames} className="h-full" />}
        {mobileTab === "objections" && <ObjectionTrainer serviceNames={serviceNames} className="h-full" />}
        {mobileTab === "simulator" && <ClientSimulator serviceNames={serviceNames} className="h-full" onOpenTool={(id) => setSimulatorToolOverlay(id)} />}
        {mobileTab === "services" && <ServicesManager services={services} onAdd={addService} onUpdate={updateService} onDelete={deleteService} onReset={resetToDefaults} className="h-full" />}
        {mobileTab === "history" && <GenerationHistory history={history} onLoad={handleHistoryLoad} onDelete={deleteFromHistory} onClear={clearHistory} className="h-full" />}
        {mobileTab === "favorites" && <FavoritesPanel favorites={favorites} onLoad={handleHistoryLoad} onRemove={removeFavorite} />}
        {mobileTab === "quiz" && <QuizMode serviceNames={serviceNames} className="h-full" />}
        {mobileTab === "cases" && <CaseLibrary className="h-full" />}
        {mobileTab === "phrases" && <PhraseBank phrases={phrases} onAdd={addPhrase} onRemove={removePhrase} onCopy={handleCopyPhrase} className="h-full" />}
        {mobileTab === "personas" && <ClientPersonasPanel personas={personas} onAdd={addPersona} onUpdate={updatePersona} onRemove={removePersona} className="h-full" />}
        {mobileTab === "scenario-builder" && <ScenarioBuilder serviceNames={serviceNames} className="h-full" />}
        {mobileTab === "live-call" && <LiveCallAssistant serviceNames={serviceNames} className="h-full" />}
        {mobileTab === "pre-call-brief" && <PreCallBrief serviceNames={serviceNames} className="h-full" />}
        {mobileTab === "objection-library" && <ObjectionLibrary serviceNames={serviceNames} className="h-full" />}
        {mobileTab === "sales-style" && <SalesStyleLab className="h-full" />}
        {mobileTab === "call-analyzer" && <CallAnalyzer serviceNames={serviceNames} className="h-full" />}
        {mobileTab === "kp-constructor" && <KPConstructor serviceNames={serviceNames} className="h-full" />}
        {mobileTab === "dashboard" && <CommandCenter historyCount={history.length} favoritesCount={favorites.length} recentItems={history as any} onQuickGenerate={() => setMobileTab("config")} onOpenPanel={(p) => setMobileTab(p as MobileTab)} onLoadHistory={handleHistoryLoad} modulesEnabled={modulesEnabled} userName={user?.email?.split("@")[0]} />}
        {mobileTab === "bento" && <BentoTools onOpen={(id) => setMobileTab(id as MobileTab)} enabledModules={modulesEnabled} />}
        {mobileTab === "mod-pipeline" && <PipelinePanel className="h-full" />}
        {mobileTab === "mod-contacts" && <ContactCards className="h-full" />}
        {mobileTab === "mod-discovery" && <DiscoveryChecklist className="h-full" />}
        {mobileTab === "mod-competitors" && <CompetitorMatrix serviceNames={serviceNames} className="h-full" />}
        {mobileTab === "mod-value-calc" && <ValueCalculator className="h-full" />}
        {mobileTab === "mod-follow-up" && <FollowUpComposer serviceNames={serviceNames} className="h-full" />}
        {mobileTab === "mod-wiki" && <WikiKnowledge className="h-full" />}
        {mobileTab === "mod-voice-rec" && <VoiceRecorder transcriberUrl={appSettings.transcriberUrl} className="h-full" />}
        {mobileTab === "mod-reframe" && <ReframeHelper className="h-full" />}
        {mobileTab === "mod-battle-cards" && <BattleCards serviceNames={serviceNames} className="h-full" />}
      </div>

      {/* Mobile tool overlay for simulator */}
      <Sheet open={!!simulatorToolOverlay} onOpenChange={(open) => !open && setSimulatorToolOverlay(null)}>
        <SheetContent side="bottom" className="glass-panel border-border/50 rounded-t-2xl max-h-[85dvh] p-0">
          <SheetHeader className="px-4 py-3 border-b border-border/50 sticky top-0 glass-panel z-10">
            <SheetTitle className="text-sm">
              {simulatorToolOverlay === "armory" && "Арсенал возражений"}
              {simulatorToolOverlay === "objection-library" && "Библиотека возражений"}
              {simulatorToolOverlay === "phrases" && "Банк фраз"}
              {simulatorToolOverlay === "live-call" && "Суфлёр"}
            </SheetTitle>
          </SheetHeader>
          <div className="pb-[env(safe-area-inset-bottom,0px)]">
            {simulatorToolOverlay === "armory" && <Armory onSelect={handleArmorySelect} isGenerating={isGenerating} className="!w-full !border-l-0" />}
            {simulatorToolOverlay === "objection-library" && <ObjectionLibrary serviceNames={serviceNames} />}
            {simulatorToolOverlay === "phrases" && <PhraseBank phrases={phrases} onAdd={addPhrase} onRemove={removePhrase} onCopy={handleCopyPhrase} />}
            {simulatorToolOverlay === "live-call" && <LiveCallAssistant serviceNames={serviceNames} />}
          </div>
        </SheetContent>
      </Sheet>

      {/* Floating Quick Generation Button */}
      <button
        onClick={() => setMobileTab("config")}
        className="fixed z-30 right-4 rounded-2xl bg-primary text-primary-foreground shadow-glow flex items-center justify-center btn-tactile hover:opacity-90 transition-all"
        style={{
          bottom: "calc(70px + env(safe-area-inset-bottom, 8px))",
          width: "56px", height: "56px",
        }}
        aria-label="Быстрая генерация"
        title="Быстрая генерация"
      >
        <Plus className="w-7 h-7" />
      </button>

      {/* Fixed bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 glass-panel border-t border-border/50 flex items-center justify-around py-1.5 z-20" style={{ paddingBottom: "env(safe-area-inset-bottom, 6px)" }}>
        <MobileNavBtn active={mobileTab === "config"} onClick={() => setMobileTab("config")} icon={<Settings className="w-5 h-5" />} label="Генератор" />
        <MobileNavBtn active={mobileTab === "output"} onClick={() => setMobileTab("output")} icon={<FileText className="w-5 h-5" />} label="Результат" />
        <MobileNavBtn active={mobileTab === "simulator"} onClick={() => setMobileTab("simulator")} icon={<MessageCircle className="w-5 h-5" />} label="Симулятор" />
        <MobileNavBtn active={["armory", "audit", "objections", "quiz", "cases", "phrases", "personas", "scenario-builder", "live-call", "pre-call-brief", "objection-library", "sales-style", "call-analyzer", "kp-constructor", "services", "history", "favorites", "display-settings"].includes(mobileTab)} onClick={() => setShowMenuSheet(true)} icon={<Menu className="w-5 h-5" />} label="Меню" />
      </nav>

      <Sheet open={showMenuSheet} onOpenChange={setShowMenuSheet}>
        <SheetContent side="bottom" className="glass-panel border-border/50 rounded-t-2xl max-h-[85dvh]">
          <SheetHeader><SheetTitle className="text-base">Меню</SheetTitle></SheetHeader>
          <div className="flex flex-col gap-3 py-3">
            <div className="grid grid-cols-2 gap-2 px-4">
              <button onClick={() => { setMobileTab("dashboard"); setShowMenuSheet(false); }} className="glass-card border border-border/50 rounded-xl p-3 flex items-center gap-2 hover:border-primary/40 transition">
                <Home className="w-4 h-4 text-primary" /><span className="text-sm font-medium text-foreground">Дашборд</span>
              </button>
              <button onClick={() => { setMobileTab("bento"); setShowMenuSheet(false); }} className="glass-card border border-border/50 rounded-xl p-3 flex items-center gap-2 hover:border-primary/40 transition">
                <LayoutGrid className="w-4 h-4 text-primary" /><span className="text-sm font-medium text-foreground">Все инструменты</span>
              </button>
            </div>

            {MODULE_CATALOG.some((m) => isModuleEnabled(m.id)) && (
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground px-4 mb-1.5">Модули</p>
                <div className="flex flex-col gap-1">
                  {MODULE_CATALOG.filter((m) => isModuleEnabled(m.id)).map((m) => (
                    <button key={m.id} onClick={() => { setMobileTab(`mod-${m.id}` as MobileTab); setShowMenuSheet(false); }} className="flex items-center gap-3 px-4 py-2 rounded-xl hover:bg-accent/50 transition-colors text-left">
                      <div className="text-primary"><Boxes className="w-5 h-5" /></div>
                      <div className="text-sm font-medium text-foreground">{m.label}</div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground px-4 mb-1.5">AI Studio</p>
              <div className="flex flex-col gap-1">
                {[
                  { tab: "scenario-builder" as MobileTab, label: "Конструктор сценариев", icon: <GitBranch className="w-5 h-5" /> },
                  { tab: "live-call" as MobileTab, label: "Суфлёр", icon: <Headphones className="w-5 h-5" /> },
                  { tab: "pre-call-brief" as MobileTab, label: "Пре-сейл бриф", icon: <FileSearch className="w-5 h-5" /> },
                  { tab: "objection-library" as MobileTab, label: "Библиотека возражений", icon: <Shield className="w-5 h-5" /> },
                  { tab: "sales-style" as MobileTab, label: "Лаборатория стиля", icon: <Palette className="w-5 h-5" /> },
                  { tab: "call-analyzer" as MobileTab, label: "AI-Аналитик звонков", icon: <Mic className="w-5 h-5" /> },
                  { tab: "kp-constructor" as MobileTab, label: "Конструктор КП", icon: <FileText className="w-5 h-5" /> },
                ].map((item) => (
                  <button key={item.tab} onClick={() => { setMobileTab(item.tab); setShowMenuSheet(false); }} className="flex items-center gap-3 px-4 py-2 rounded-xl hover:bg-accent/50 transition-colors text-left">
                    <div className="text-primary">{item.icon}</div>
                    <div className="text-sm font-medium text-foreground">{item.label}</div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground px-4 mb-1.5">Тренировка</p>
              <div className="flex flex-col gap-1">
                {[
                  { tab: "armory" as MobileTab, label: "Арсенал возражений", icon: <Zap className="w-5 h-5" /> },
                  { tab: "objections" as MobileTab, label: "Тренажёр возражений", icon: <Zap className="w-5 h-5" /> },
                  { tab: "quiz" as MobileTab, label: "Квиз-тренажёр", icon: <Brain className="w-5 h-5" /> },
                  { tab: "audit" as MobileTab, label: "Аудит сайта", icon: <Globe className="w-5 h-5" /> },
                ].map((item) => (
                  <button key={item.tab} onClick={() => { setMobileTab(item.tab); setShowMenuSheet(false); }} className="flex items-center gap-3 px-4 py-2 rounded-xl hover:bg-accent/50 transition-colors text-left">
                    <div className="text-primary">{item.icon}</div>
                    <div className="text-sm font-medium text-foreground">{item.label}</div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground px-4 mb-1.5">Библиотека</p>
              <div className="flex flex-col gap-1">
                {[
                  { tab: "cases" as MobileTab, label: "Кейсы", icon: <BookOpen className="w-5 h-5" /> },
                  { tab: "phrases" as MobileTab, label: "Банк фраз", icon: <BookMarked className="w-5 h-5" /> },
                  { tab: "personas" as MobileTab, label: "Персоны", icon: <Users className="w-5 h-5" /> },
                  { tab: "services" as MobileTab, label: "Услуги", icon: <Package className="w-5 h-5" /> },
                ].map((item) => (
                  <button key={item.tab} onClick={() => { setMobileTab(item.tab); setShowMenuSheet(false); }} className="flex items-center gap-3 px-4 py-2 rounded-xl hover:bg-accent/50 transition-colors text-left">
                    <div className="text-primary">{item.icon}</div>
                    <div className="text-sm font-medium text-foreground">{item.label}</div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground px-4 mb-1.5">Прочее</p>
              <div className="flex flex-col gap-1">
                {menuItems.filter(m => m.tab !== "services").map((item) => (
                  <button key={item.tab} onClick={() => { setMobileTab(item.tab); setShowMenuSheet(false); }} className="flex items-center gap-3 px-4 py-2 rounded-xl hover:bg-accent/50 transition-colors text-left">
                    <div className="text-primary">{item.icon}</div>
                    <div className="text-sm font-medium text-foreground">{item.label}</div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
                  </button>
                ))}
                <button onClick={() => { setMobileTab("display-settings"); setShowMenuSheet(false); }} className="flex items-center gap-3 px-4 py-2 rounded-xl hover:bg-accent/50 transition-colors text-left">
                  <div className="text-primary"><SlidersHorizontal className="w-5 h-5" /></div>
                  <div className="text-sm font-medium text-foreground">Настройки отображения</div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
                </button>
              </div>
              <div className="border-t border-border/50 pt-3 mt-3 px-4">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Тема</p>
                <ThemePicker current={theme} onChange={setTheme} />
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <AuthDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} onSignIn={signIn} onSignUp={signUp} />
    </div>
    </>
  );
}

function MobileNavBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-200 ${active ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
      {icon}<span className="text-[9px] font-medium">{label}</span>
    </button>
  );
}

function FavoritesPanel({ favorites, onLoad, onRemove }: { favorites: any[]; onLoad: (content: string) => void; onRemove: (id: string) => void }) {
  if (favorites.length === 0) {
    return (<div className="flex-1 flex items-center justify-center p-8 overflow-y-auto"><div className="text-center"><Star className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" /><h3 className="text-base font-medium text-foreground mb-1">Нет избранных скриптов</h3><p className="text-xs text-muted-foreground">Нажмите ★ на сгенерированном скрипте</p></div></div>);
  }
  return (
    <div className="flex-1 overflow-y-auto p-6">
      <h2 className="text-lg font-semibold text-foreground mb-1">Избранное</h2>
      <p className="text-xs text-muted-foreground mb-6">Сохранённые скрипты</p>
      <div className="space-y-3">
        {favorites.map((fav) => (
          <div key={fav.id} className="glass-card border border-border/50 rounded-xl p-4 group">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div><span className="text-[10px] uppercase tracking-wider text-primary font-medium">{fav.mode}</span><span className="text-[10px] text-muted-foreground ml-2">{fav.service}</span></div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => onLoad(fav.content)} className="text-xs px-2 py-1 rounded-lg bg-primary text-primary-foreground btn-tactile">Загрузить</button>
                <button onClick={() => onRemove(fav.id)} className="text-xs px-2 py-1 rounded-lg text-destructive hover:bg-destructive/10 btn-tactile">Удалить</button>
              </div>
            </div>
            <p className="text-xs text-foreground/80 line-clamp-3">{fav.label}</p>
            <p className="text-[10px] text-muted-foreground mt-2">{new Date(fav.timestamp).toLocaleDateString("ru-RU")}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AppSettingsPanel({ transcriberUrl, onTranscriberUrlChange, appSettings, onUpdateAppSetting, currentTheme, onThemeChange, user, onSignIn, onSignOut, onSyncNow, displaySettings, onUpdateDisplay, onResetDisplay }: {
  transcriberUrl: string; onTranscriberUrlChange: (v: string) => void;
  appSettings?: any; onUpdateAppSetting?: any;
  currentTheme: any; onThemeChange: (t: any) => void;
  user: any; onSignIn: () => void; onSignOut: () => void;
  onSyncNow?: () => void;
  displaySettings?: any; onUpdateDisplay?: any; onResetDisplay?: any;
}) {
  const ToggleRow = ({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) => (
    <div className="flex items-center justify-between gap-4 py-2.5 px-3 rounded-xl hover:bg-accent/30 transition-colors">
      <div className="min-w-0 flex-1">
        <p className="text-sm text-foreground font-medium truncate">{label}</p>
        {hint && <p className="text-[11px] text-muted-foreground mt-0.5">{hint}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
  return (
    <div className="flex-1 p-6 sm:p-8 max-w-2xl overflow-y-auto" style={{ paddingBottom: "calc(6rem + env(safe-area-inset-bottom, 0px))", WebkitOverflowScrolling: "touch" }}>
      <h2 className="text-lg font-semibold text-foreground mb-1">Настройки</h2>
      <p className="text-xs text-muted-foreground mb-8">Глобальные настройки ScriptEngine</p>
      <div className="space-y-8">

        {appSettings && onUpdateAppSetting && (
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-3">Поведение генератора</label>
            <div className="glass-card border border-border/50 rounded-xl p-2 divide-y divide-border/40">
              <ToggleRow
                label="Автозаполнение переменных"
                hint="Подставлять [Имя менеджера] и [Имя клиента] автоматически"
                checked={!!appSettings.autoFillVariables}
                onChange={(v) => onUpdateAppSetting("autoFillVariables", v)}
              />
              <ToggleRow
                label="Предупреждать перед генерацией"
                hint="Проверять, что данных достаточно для качественного скрипта"
                checked={!!appSettings.warnBeforeGenerate}
                onChange={(v) => onUpdateAppSetting("warnBeforeGenerate", v)}
              />
            </div>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1.5">Имя менеджера по умолчанию</label>
                <input
                  className="w-full glass-input border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  placeholder="Алексей"
                  value={appSettings.defaultManagerName || ""}
                  onChange={(e) => onUpdateAppSetting("defaultManagerName", e.target.value)}
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1.5">Имя клиента по умолчанию</label>
                <input
                  className="w-full glass-input border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  placeholder="Иван"
                  value={appSettings.defaultClientName || ""}
                  onChange={(e) => onUpdateAppSetting("defaultClientName", e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-3">Модули и интерфейс</label>
          <ModulesPanel />
        </div>
        {displaySettings && onUpdateDisplay && onResetDisplay && (
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-3">Отображение результата</label>
            <DisplaySettingsPanel settings={displaySettings} onUpdate={onUpdateDisplay} onReset={onResetDisplay} currentTheme={currentTheme} onThemeChange={onThemeChange} />
          </div>
        )}
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-3">Аккаунт</label>
          {user ? (
            <div className="glass-card border border-border/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{user.email}</p>
                  <p className="text-[10px] text-muted-foreground">Авторизован</p>
                </div>
                <button onClick={onSignOut} className="text-xs px-3 py-1.5 rounded-lg border border-border/50 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all btn-tactile">Выйти</button>
              </div>
              {onSyncNow && (
                <button onClick={onSyncNow} className="w-full text-xs px-3 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all btn-tactile">☁️ Синхронизировать сейчас</button>
              )}
            </div>
          ) : (
            <button onClick={onSignIn} className="w-full glass-card border border-border/50 rounded-xl p-4 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/30 transition-all btn-tactile">Войти для синхронизации данных →</button>
          )}
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-3">Тема оформления</label>
          <ThemePicker current={currentTheme} onChange={onThemeChange} />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-3">URL транскрибатора</label>
          <input className="w-full glass-input border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            placeholder="https://..." value={transcriberUrl} onChange={(e) => onTranscriberUrlChange(e.target.value)} />
          <p className="text-[10px] text-muted-foreground mt-1.5">Ссылка для быстрого перехода из раздела анализа диалога</p>
        </div>
      </div>
    </div>
  );
}

/* ---------- Режимы: «Продажи» (текущий сервис) / «Обучение» (разбор звонков) ---------- */

const TRAINING_NAV_GROUPS = [
  {
    label: "Разбор звонков",
    items: [
      { value: "upload", label: "Загрузка", icon: <UploadCloud className="w-4 h-4" /> },
      { value: "report", label: "Карточка разбора", icon: <FileSearch className="w-4 h-4" /> },
      { value: "analytics", label: "История и аналитика", icon: <BarChart3 className="w-4 h-4" /> },
    ],
  },
];

const CI_VIEWS: { value: CallIntelView; label: string }[] = [
  { value: "upload", label: "Загрузка" },
  { value: "report", label: "Разбор" },
  { value: "analytics", label: "Аналитика" },
];

function ModeSwitch({ mode, onChange, compact = false, size = "default" }: { mode: "sales" | "training"; onChange: (m: "sales" | "training") => void; compact?: boolean; size?: "default" | "sm" }) {
  const opts: { value: "sales" | "training"; label: string; icon: JSX.Element }[] = [
    { value: "sales", label: "Продажи", icon: <Briefcase className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} /> },
    { value: "training", label: "Обучение", icon: <Headphones className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} /> },
  ];
  if (compact) {
    return (
      <div className="flex flex-col gap-1">
        {opts.map((o) => (
          <button key={o.value} onClick={() => onChange(o.value)} title={o.label}
            className={`p-2 rounded-lg flex items-center justify-center transition-all btn-tactile ${mode === o.value ? "text-primary-foreground shadow-glow" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"}`}
            style={mode === o.value ? { background: "var(--accent-gradient)" } : undefined}>
            {o.icon}
          </button>
        ))}
      </div>
    );
  }
  const isSm = size === "sm";
  return (
    <div className={`inline-flex glass-card border border-border/50 rounded-xl p-0.5 ${isSm ? "" : "w-full"}`}>
      {opts.map((o) => (
        <button key={o.value} onClick={() => onChange(o.value)}
          className={`flex items-center justify-center gap-1 rounded-lg font-medium transition-all btn-tactile ${
            mode === o.value ? "text-primary-foreground shadow-glow" : "text-muted-foreground hover:text-foreground"
          } ${isSm ? "px-2 py-1 text-[10px]" : "flex-1 px-2 py-1.5 text-[11px]"}`}
          style={mode === o.value ? { background: "var(--accent-gradient)" } : undefined}>
          {o.icon}{o.label}
        </button>
      ))}
    </div>
  );
}

