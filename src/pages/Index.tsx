import { useState, useCallback, useEffect, useMemo } from "react";
import { toast } from "sonner";
import ConfigSidebar, { type ScriptConfig, type GenerationMode } from "@/components/ConfigSidebar";
import ScriptOutput from "@/components/ScriptOutput";
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
import CommandPalette from "@/components/CommandPalette";
import PhraseBank from "@/components/PhraseBank";
import ClientPersonasPanel from "@/components/ClientPersonasPanel";
import ScenarioBuilder from "@/components/ScenarioBuilder";
import LiveCallAssistant from "@/components/LiveCallAssistant";
import PreCallBrief from "@/components/PreCallBrief";
import ObjectionLibrary from "@/components/ObjectionLibrary";
import SalesStyleLab from "@/components/SalesStyleLab";
import CallAnalyzer from "@/components/CallAnalyzer";
import KPConstructor from "@/components/KPConstructor";
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
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  FileText, Globe, Zap, MessageCircle, Package, History,
  Save, Trash2, SlidersHorizontal, User, LogOut,
  Wrench, Menu, Star, Settings, ChevronRight, Brain, BookOpen,
  Search, BookMarked, Users, PanelLeftClose, PanelLeftOpen,
  GitBranch, Headphones, FileSearch, Shield, Palette, Plus, Mic,
} from "lucide-react";

const SALES_STYLE_KEY = "scriptengine-sales-style";

const defaultConfig: ScriptConfig = {
  managerName: "", clientName: "", service: "SEO-продвижение", situation: "Холодный звонок",
  tone: "Уверенный эксперт", context: "", mode: "script", transcript: "", priceRub: "",
  currency: "RUB", emailSubtype: "follow-up", emailObjection: "", scriptLength: "medium",
  dozimSubtype: "thinking", transcriptSubmode: "analysis", personaId: "", quickTemplateId: "",
};

type MobileTab = "config" | "output" | "armory" | "display-settings" | "audit" | "objections" | "simulator" | "services" | "history" | "favorites" | "quiz" | "cases" | "phrases" | "personas" | "scenario-builder" | "live-call" | "pre-call-brief" | "objection-library" | "sales-style";
type DesktopPanel = "main" | "armory" | "audit" | "objections" | "simulator" | "services" | "history" | "favorites" | "settings" | "quiz" | "cases" | "phrases" | "personas" | "scenario-builder" | "live-call" | "pre-call-brief" | "objection-library" | "sales-style";

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
  const isMobile = useIsMobile();

  const [mobileTab, setMobileTab] = useState<MobileTab>("config");
  const [desktopPanel, setDesktopPanel] = useState<DesktopPanel>("main");
  const [pendingHistorySave, setPendingHistorySave] = useState(false);
  const [showPresetSave, setShowPresetSave] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [showDesktopSettings, setShowDesktopSettings] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [, setShowToolsSheet] = useState(false); void setShowToolsSheet;
  const [showMenuSheet, setShowMenuSheet] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // For simulator tool overlay - preserve simulator state while viewing tools
  const [simulatorToolOverlay, setSimulatorToolOverlay] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      const key = e.key.toLowerCase();
      if (key === "k") { e.preventDefault(); setShowCommandPalette((p) => !p); }
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

  const generate = useCallback((overrideContext?: string) => {
    if (isGenerating) return;
    setIsGenerating(true); setScript(""); setPendingHistorySave(true); clearNotes();
    if (isMobile) setMobileTab("output");
    if (desktopPanel !== "main") setDesktopPanel("main");
    const svcContext = getServiceContext(config.service);
    const baseContext = overrideContext || config.context;
    let enrichedContext = svcContext ? `${svcContext}\n\nКОНТЕКСТ ПОЛЬЗОВАТЕЛЯ:\n${baseContext}` : baseContext;
    // Inject sales-style profile if exists
    try {
      const styleRaw = localStorage.getItem(SALES_STYLE_KEY);
      if (styleRaw) {
        const profile = JSON.parse(styleRaw);
        if (profile?.recommendations) {
          enrichedContext = `СТИЛЬ МЕНЕДЖЕРА (имитируй этот стиль речи и подачи):\n${profile.recommendations}\n\n---\n\n${enrichedContext}`;
        }
      }
    } catch {}
    const payload: Record<string, string> = { ...config, context: enrichedContext };
    streamScript({
      config: payload,
      onDelta: (chunk) => setScript((prev) => prev + chunk),
      onDone: () => setIsGenerating(false),
      onError: (msg) => { toast.error(msg); setIsGenerating(false); setPendingHistorySave(false); },
    });
  }, [config, isGenerating, isMobile, desktopPanel, getServiceContext, clearNotes]);

  const handleCompanionGenerate = useCallback((type: "objections" | "arguments" | "benefits" | "dozim") => {
    if (isGenerating || !script) return;
    const typeLabels = { objections: "возможные возражения клиента и ответы", arguments: "дополнительные аргументы", benefits: "конкретные выгоды клиента", dozim: "фразы для дожима" };
    const companionContext = `ОСНОВНОЙ СКРИПТ:\n${script}\n\nЗАДАЧА: Сгенерируй ${typeLabels[type]}. Дополнение к основному скрипту для ОДНОГО разговора.`;
    setIsGenerating(true); setScript((prev) => prev + "\n\n---\n\n"); setPendingHistorySave(true);
    const svcContext = getServiceContext(config.service);
    const enrichedContext = svcContext ? `${svcContext}\n\n${companionContext}` : companionContext;
    const payload: Record<string, string> = { ...config, mode: type === "dozim" ? "dozim" : "arguments", context: enrichedContext };
    streamScript({ config: payload, onDelta: (chunk) => setScript((prev) => prev + chunk), onDone: () => setIsGenerating(false), onError: (msg) => { toast.error(msg); setIsGenerating(false); setPendingHistorySave(false); } });
  }, [config, isGenerating, script, getServiceContext]);

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

  const commandItems = useMemo(() => [
    { id: "gen", label: "Сгенерировать скрипт", desc: "Ctrl+G", icon: <Zap className="w-4 h-4" />, action: () => generate(), category: "Действия" },
    { id: "copy", label: "Копировать результат", desc: "Ctrl+S", icon: <FileText className="w-4 h-4" />, action: () => { if (script) { navigator.clipboard.writeText(script); toast.success("Скопировано"); } }, category: "Действия" },
    { id: "main", label: "Генератор", icon: <FileText className="w-4 h-4" />, action: () => setDesktopPanel("main"), category: "Навигация" },
    { id: "armory", label: "Арсенал", icon: <Zap className="w-4 h-4" />, action: () => setDesktopPanel("armory"), category: "Навигация" },
    { id: "audit", label: "Аудит сайта", icon: <Globe className="w-4 h-4" />, action: () => setDesktopPanel("audit"), category: "Навигация" },
    { id: "quiz", label: "Квиз-тренажёр", icon: <Brain className="w-4 h-4" />, action: () => setDesktopPanel("quiz"), category: "Навигация" },
    { id: "sim", label: "Симулятор клиента", icon: <MessageCircle className="w-4 h-4" />, action: () => setDesktopPanel("simulator"), category: "Навигация" },
    { id: "obj", label: "Тренажёр возражений", icon: <Zap className="w-4 h-4" />, action: () => setDesktopPanel("objections"), category: "Навигация" },
    { id: "hist", label: "История генераций", icon: <History className="w-4 h-4" />, action: () => setDesktopPanel("history"), category: "Навигация" },
    { id: "fav", label: "Избранное", icon: <Star className="w-4 h-4" />, action: () => setDesktopPanel("favorites"), category: "Навигация" },
    { id: "svc", label: "Управление услугами", icon: <Package className="w-4 h-4" />, action: () => setDesktopPanel("services"), category: "Навигация" },
    { id: "phrases", label: "Банк фраз", icon: <BookMarked className="w-4 h-4" />, action: () => setDesktopPanel("phrases"), category: "Навигация" },
    { id: "personas", label: "Персоны клиентов", icon: <Users className="w-4 h-4" />, action: () => setDesktopPanel("personas"), category: "Навигация" },
    { id: "scenario", label: "Конструктор сценариев", icon: <GitBranch className="w-4 h-4" />, action: () => setDesktopPanel("scenario-builder"), category: "AI Studio" },
    { id: "live-call", label: "Суфлёр", icon: <Headphones className="w-4 h-4" />, action: () => setDesktopPanel("live-call"), category: "AI Studio" },
    { id: "brief", label: "Пре-сейл бриф", icon: <FileSearch className="w-4 h-4" />, action: () => setDesktopPanel("pre-call-brief"), category: "AI Studio" },
    { id: "obj-lib", label: "Библиотека возражений", icon: <Shield className="w-4 h-4" />, action: () => setDesktopPanel("objection-library"), category: "AI Studio" },
    { id: "style", label: "Лаборатория стиля", icon: <Palette className="w-4 h-4" />, action: () => setDesktopPanel("sales-style"), category: "AI Studio" },
    { id: "settings", label: "Настройки", icon: <Settings className="w-4 h-4" />, action: () => setDesktopPanel("settings"), category: "Навигация" },
  ], [generate, script]);

  type NavGroup = { label: string; items: { value: DesktopPanel; label: string; icon: React.ReactNode; beta?: boolean }[] };

  const navGroups: NavGroup[] = [
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
    ]},
    { label: "Тренировка", items: [
      { value: "simulator", label: "Симулятор", icon: <MessageCircle className="w-4 h-4" /> },
      { value: "objections", label: "Тренажёр", icon: <Zap className="w-4 h-4" /> },
      { value: "quiz", label: "Квиз", icon: <Brain className="w-4 h-4" /> },
    ]},
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
      <div className="flex h-screen overflow-hidden">
        {/* Left sidebar navigation */}
        <aside className={`shrink-0 glass-panel border-r border-border/50 flex flex-col transition-all duration-300 ${sidebarCollapsed ? "w-14" : "w-48"}`}>
          <div className="px-3 py-3 border-b border-border/30 flex items-center gap-2">
            <img src="/icon-192.png" alt="ScriptEngine" className="w-7 h-7 rounded-lg shrink-0 object-cover" />
            {!sidebarCollapsed && (
              <h1 className="text-xs font-bold tracking-tight text-foreground truncate">ScriptEngine</h1>
            )}
          </div>

          <nav className="flex-1 overflow-y-auto py-2 px-1.5 space-y-3">
            {navGroups.map((group) => (
              <div key={group.label}>
                {!sidebarCollapsed && (
                  <p className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground font-medium px-2 mb-1">{group.label}</p>
                )}
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive = desktopPanel === item.value;
                    const btn = (
                      <button
                        key={item.value}
                        onClick={() => setDesktopPanel(item.value)}
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

            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={() => setShowCommandPalette(true)}
                  className={`w-full flex items-center gap-2 rounded-lg transition-all btn-tactile ${
                    sidebarCollapsed ? "justify-center p-2" : "px-2 py-1.5"
                  } text-muted-foreground hover:text-foreground hover:bg-accent/50`}>
                  <Search className="w-4 h-4 shrink-0" />
                  {!sidebarCollapsed && (
                    <>
                      <span className="text-xs font-medium flex-1 text-left">Поиск</span>
                      <kbd className="text-[9px] text-muted-foreground bg-muted/60 px-1 py-0.5 rounded">⌘K</kbd>
                    </>
                  )}
                </button>
              </TooltipTrigger>
              {sidebarCollapsed && <TooltipContent side="right" className="text-xs">Поиск ⌘K</TooltipContent>}
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
                    onScriptEdit={handleScriptEdit} notes={notes} onAddNote={addNote} onRemoveNote={removeNote} />
                  <ConfigSidebar config={config} onChange={setConfig} onGenerate={() => generate()} isGenerating={isGenerating}
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
              {desktopPanel === "settings" && <div className="flex-1 glass-panel m-2 rounded-xl overflow-hidden"><AppSettingsPanel transcriberUrl={appSettings.transcriberUrl} onTranscriberUrlChange={(v) => updateAppSetting("transcriberUrl", v)} currentTheme={theme} onThemeChange={setTheme} user={user} onSignIn={() => setShowAuthDialog(true)} onSignOut={signOut} onSyncNow={syncNow} displaySettings={displaySettings} onUpdateDisplay={updateDisplay} onResetDisplay={resetDisplay} /></div>}
            </div>
          </div>
        </div>

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
        <CommandPalette open={showCommandPalette} onClose={() => setShowCommandPalette(false)} items={commandItems} />
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

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
      <header className="glass-panel border-b border-border/50 flex items-center justify-between px-4 py-2.5 shrink-0 z-10">
        <button onClick={() => setMobileTab("config")} className="flex items-center gap-2">
          <img src="/icon-192.png" alt="ScriptEngine" className="w-7 h-7 rounded-lg object-cover" />
          <h1 className="text-sm font-semibold tracking-tight text-foreground">ScriptEngine</h1>
        </button>
        <div className="flex items-center gap-1">
          {user ? (<button onClick={signOut} className="p-2 rounded-lg hover:bg-accent/50 text-muted-foreground"><LogOut className="w-4 h-4" /></button>)
            : (<button onClick={() => setShowAuthDialog(true)} className="p-2 rounded-lg hover:bg-accent/50 text-muted-foreground"><User className="w-4 h-4" /></button>)}
        </div>
      </header>

      <div className="flex-1 overflow-hidden" style={{ paddingBottom: "calc(60px + env(safe-area-inset-bottom, 8px))" }}>
        {mobileTab === "config" && <ConfigSidebar config={config} onChange={setConfig} onGenerate={() => generate()} isGenerating={isGenerating} serviceNames={serviceNames} className="!w-full !border-r-0 h-full glass-panel" transcriberUrl={appSettings.transcriberUrl} />}
        {mobileTab === "output" && <ScriptOutput script={script} isGenerating={isGenerating} mode={config.mode} displaySettings={displaySettings} className="h-full" onCompanionGenerate={handleCompanionGenerate} onScoreScript={handleScoreScript} isScoring={isScoring} isFavorite={isFavorite(script)} onToggleFavorite={handleToggleFavorite} onScriptEdit={handleScriptEdit} notes={notes} onAddNote={addNote} onRemoveNote={removeNote} />}
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
      </div>

      {/* Mobile tool overlay for simulator */}
      <Sheet open={!!simulatorToolOverlay} onOpenChange={(open) => !open && setSimulatorToolOverlay(null)}>
        <SheetContent side="bottom" className="glass-panel border-border/50 rounded-t-2xl max-h-[80vh] overflow-y-auto p-0">
          <SheetHeader className="px-4 py-3 border-b border-border/50">
            <SheetTitle className="text-sm">
              {simulatorToolOverlay === "armory" && "Арсенал возражений"}
              {simulatorToolOverlay === "objection-library" && "Библиотека возражений"}
              {simulatorToolOverlay === "phrases" && "Банк фраз"}
              {simulatorToolOverlay === "live-call" && "Суфлёр"}
            </SheetTitle>
          </SheetHeader>
          <div className="max-h-[60vh] overflow-y-auto">
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
        <MobileNavBtn active={["armory", "audit", "objections", "quiz", "cases", "phrases", "personas", "scenario-builder", "live-call", "pre-call-brief", "objection-library", "sales-style", "services", "history", "favorites", "display-settings"].includes(mobileTab)} onClick={() => setShowMenuSheet(true)} icon={<Menu className="w-5 h-5" />} label="Меню" />
      </nav>

      <Sheet open={showMenuSheet} onOpenChange={setShowMenuSheet}>
        <SheetContent side="bottom" className="glass-panel border-border/50 rounded-t-2xl max-h-[85vh] overflow-y-auto">
          <SheetHeader><SheetTitle className="text-base">Меню</SheetTitle></SheetHeader>
          <div className="flex flex-col gap-3 py-3">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground px-4 mb-1.5">AI Studio</p>
              <div className="flex flex-col gap-1">
                {[
                  { tab: "scenario-builder" as MobileTab, label: "Конструктор сценариев", icon: <GitBranch className="w-5 h-5" /> },
                  { tab: "live-call" as MobileTab, label: "Суфлёр", icon: <Headphones className="w-5 h-5" /> },
                  { tab: "pre-call-brief" as MobileTab, label: "Пре-сейл бриф", icon: <FileSearch className="w-5 h-5" /> },
                  { tab: "objection-library" as MobileTab, label: "Библиотека возражений", icon: <Shield className="w-5 h-5" /> },
                  { tab: "sales-style" as MobileTab, label: "Лаборатория стиля", icon: <Palette className="w-5 h-5" /> },
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

function AppSettingsPanel({ transcriberUrl, onTranscriberUrlChange, currentTheme, onThemeChange, user, onSignIn, onSignOut, onSyncNow, displaySettings, onUpdateDisplay, onResetDisplay }: {
  transcriberUrl: string; onTranscriberUrlChange: (v: string) => void;
  currentTheme: any; onThemeChange: (t: any) => void;
  user: any; onSignIn: () => void; onSignOut: () => void;
  onSyncNow?: () => void;
  displaySettings?: any; onUpdateDisplay?: any; onResetDisplay?: any;
}) {
  return (
    <div className="flex-1 p-8 max-w-2xl overflow-y-auto pb-24">
      <h2 className="text-lg font-semibold text-foreground mb-1">Настройки</h2>
      <p className="text-xs text-muted-foreground mb-8">Глобальные настройки ScriptEngine</p>
      <div className="space-y-8">
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
