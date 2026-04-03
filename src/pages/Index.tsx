import { useState, useCallback, useEffect } from "react";
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
import CallTimer from "@/components/CallTimer";
import ActivityDashboard from "@/components/ActivityDashboard";
import ScriptComparison from "@/components/ScriptComparison";
import CaseLibrary from "@/components/CaseLibrary";
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
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  FileText, Globe, Zap, MessageCircle, Package, History,
  Save, Trash2, SlidersHorizontal, User, LogOut,
  Wrench, Menu, Star, Settings, ChevronRight, Brain, Timer, BarChart3, Columns2, BookOpen,
} from "lucide-react";

const defaultConfig: ScriptConfig = {
  managerName: "", clientName: "", service: "SEO-продвижение", situation: "Холодный звонок",
  tone: "Уверенный эксперт", context: "", mode: "script", transcript: "", priceRub: "",
  currency: "RUB", emailSubtype: "follow-up", emailObjection: "", scriptLength: "medium",
  dozimSubtype: "thinking", transcriptSubmode: "analysis",
};

type MobileTab = "config" | "output" | "armory" | "display-settings" | "audit" | "objections" | "simulator" | "services" | "history" | "favorites" | "quiz" | "timer" | "dashboard" | "comparison" | "cases";
type DesktopPanel = "main" | "audit" | "objections" | "simulator" | "services" | "history" | "favorites" | "settings" | "quiz" | "timer" | "dashboard" | "comparison" | "cases";

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
  useCloudBackup(user?.id ?? null);
  const isMobile = useIsMobile();

  const [mobileTab, setMobileTab] = useState<MobileTab>("config");
  const [desktopPanel, setDesktopPanel] = useState<DesktopPanel>("main");
  const [pendingHistorySave, setPendingHistorySave] = useState(false);
  const [showPresetSave, setShowPresetSave] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [showDesktopSettings, setShowDesktopSettings] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [showToolsSheet, setShowToolsSheet] = useState(false);
  const [showMenuSheet, setShowMenuSheet] = useState(false);

  useEffect(() => {
    if (pendingHistorySave && !isGenerating && script) {
      addToHistory({ mode: config.mode, service: config.service, label: script.slice(0, 100).replace(/\n/g, " "), content: script });
      setPendingHistorySave(false);
    }
  }, [pendingHistorySave, isGenerating, script]);

  const generate = useCallback((overrideContext?: string) => {
    if (isGenerating) return;
    setIsGenerating(true); setScript(""); setPendingHistorySave(true);
    if (isMobile) setMobileTab("output");
    if (desktopPanel !== "main") setDesktopPanel("main");
    const svcContext = getServiceContext(config.service);
    const baseContext = overrideContext || config.context;
    const enrichedContext = svcContext ? `${svcContext}\n\nКОНТЕКСТ ПОЛЬЗОВАТЕЛЯ:\n${baseContext}` : baseContext;
    const payload: Record<string, string> = { ...config, context: enrichedContext };
    streamScript({
      config: payload,
      onDelta: (chunk) => setScript((prev) => prev + chunk),
      onDone: () => setIsGenerating(false),
      onError: (msg) => { toast.error(msg); setIsGenerating(false); setPendingHistorySave(false); },
    });
  }, [config, isGenerating, isMobile, desktopPanel, getServiceContext]);

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

  const handleToggleFavorite = useCallback(() => {
    if (!script) return;
    if (isFavorite(script)) { const fav = favorites.find((f) => f.content === script); if (fav) removeFavorite(fav.id); toast.success("Удалено из избранного"); }
    else { addFavorite({ label: script.slice(0, 80).replace(/\n/g, " "), content: script, mode: config.mode, service: config.service }); toast.success("Добавлено в избранное"); }
  }, [script, isFavorite, favorites, addFavorite, removeFavorite, config]);

  const desktopTabs: { value: DesktopPanel; label: string; icon: React.ReactNode; beta?: boolean }[] = [
    { value: "main", label: "Генератор", icon: <FileText className="w-4 h-4" /> },
    { value: "audit", label: "Аудит", icon: <Globe className="w-4 h-4" />, beta: true },
    { value: "quiz", label: "Квиз", icon: <Brain className="w-4 h-4" /> },
    { value: "simulator", label: "Симулятор", icon: <MessageCircle className="w-4 h-4" />, beta: true },
    { value: "objections", label: "Возражения", icon: <Zap className="w-4 h-4" /> },
    { value: "cases", label: "Кейсы", icon: <BookOpen className="w-4 h-4" /> },
    { value: "timer", label: "Таймер", icon: <Timer className="w-4 h-4" /> },
    { value: "dashboard", label: "Дашборд", icon: <BarChart3 className="w-4 h-4" /> },
    { value: "comparison", label: "Сравнение", icon: <Columns2 className="w-4 h-4" /> },
    { value: "services", label: "Услуги", icon: <Package className="w-4 h-4" /> },
    { value: "history", label: "История", icon: <History className="w-4 h-4" /> },
    { value: "favorites", label: "Избранное", icon: <Star className="w-4 h-4" /> },
    { value: "settings", label: "Настройки", icon: <Settings className="w-4 h-4" /> },
  ];

  if (!isMobile) {
    return (
      <div className="flex h-screen overflow-hidden">
        {desktopPanel === "main" && (
          <ConfigSidebar config={config} onChange={setConfig} onGenerate={() => generate()} isGenerating={isGenerating}
            serviceNames={serviceNames} transcriberUrl={appSettings.transcriberUrl} className="glass-panel border-r border-border/50" />
        )}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="glass-panel border-b border-border/50 px-4 py-2 flex items-center justify-between gap-2 shrink-0 z-10">
            <div className="flex items-center gap-0.5 overflow-x-auto">
              {desktopTabs.map((tab) => (
                <button key={tab.value} onClick={() => setDesktopPanel(tab.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 shrink-0 btn-tactile ${
                    desktopPanel === tab.value ? "bg-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  }`}>
                  {tab.icon}{tab.label}
                  {tab.beta && <span className="text-[8px] uppercase tracking-wider opacity-50 font-mono">β</span>}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {desktopPanel === "main" && (
                <>
                  <div className="relative">
                    <button onClick={() => setShowPresetSave(!showPresetSave)} className="p-2 rounded-lg hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-colors" title="Пресеты"><Save className="w-4 h-4" /></button>
                    {showPresetSave && (
                      <div className="absolute right-0 top-full mt-1 w-72 glass-card border border-border/50 rounded-xl shadow-lg z-50 p-3">
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Сохранить пресет</p>
                        <div className="flex gap-1.5 mb-3">
                          <input className="flex-1 glass-input border border-border/50 rounded-lg px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30" placeholder="Название..." value={presetName} onChange={(e) => setPresetName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSavePreset()} />
                          <button onClick={handleSavePreset} disabled={!presetName.trim()} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:opacity-90 disabled:opacity-30 btn-tactile">Сохранить</button>
                        </div>
                        {presets.length > 0 && (
                          <><p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Загрузить</p>
                          <div className="max-h-40 overflow-y-auto space-y-1">
                            {presets.map((p) => (
                              <div key={p.id} className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg hover:bg-accent/50 group">
                                <button onClick={() => { handleLoadPreset(p.config); setShowPresetSave(false); }} className="flex-1 text-left text-xs text-foreground truncate">{p.name}</button>
                                <button onClick={() => deletePreset(p.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"><Trash2 className="w-3 h-3" /></button>
                              </div>
                            ))}
                          </div></>
                        )}
                      </div>
                    )}
                  </div>
                  <button onClick={() => setShowDesktopSettings(!showDesktopSettings)} className={`p-2 rounded-lg hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-colors ${showDesktopSettings ? "bg-accent text-foreground" : ""}`} title="Настройки отображения">
                    <SlidersHorizontal className="w-4 h-4" />
                  </button>
                </>
              )}
              {user ? (
                <button onClick={signOut} className="p-2 rounded-lg hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-colors" title="Выйти"><LogOut className="w-4 h-4" /></button>
              ) : (
                <button onClick={() => setShowAuthDialog(true)} className="p-2 rounded-lg hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-colors" title="Войти"><User className="w-4 h-4" /></button>
              )}
            </div>
          </div>

          <div className="flex flex-1 min-h-0">
            {desktopPanel === "main" && (
              <>
                {showDesktopSettings && (<div className="w-80 shrink-0 border-r border-border/50 glass-panel p-6 overflow-y-auto"><DisplaySettingsPanel settings={displaySettings} onUpdate={updateDisplay} onReset={resetDisplay} currentTheme={theme} onThemeChange={setTheme} /></div>)}
                <ScriptOutput script={script} isGenerating={isGenerating} mode={config.mode} displaySettings={displaySettings}
                  onCompanionGenerate={handleCompanionGenerate} onScoreScript={handleScoreScript} isScoring={isScoring}
                  isFavorite={isFavorite(script)} onToggleFavorite={handleToggleFavorite} />
                {!showDesktopSettings && <Armory onSelect={handleArmorySelect} isGenerating={isGenerating} />}
              </>
            )}
            {desktopPanel === "audit" && <div className="flex-1 glass-panel m-2 rounded-xl overflow-hidden"><SiteAudit onGenerateScript={handleAuditGenerate} isGenerating={isGenerating} serviceNames={serviceNames} className="h-full" /></div>}
            {desktopPanel === "objections" && <div className="flex-1 glass-panel m-2 rounded-xl overflow-hidden"><ObjectionTrainer serviceNames={serviceNames} className="h-full" /></div>}
            {desktopPanel === "simulator" && <div className="flex-1 glass-panel m-2 rounded-xl overflow-hidden"><ClientSimulator serviceNames={serviceNames} className="h-full" /></div>}
            {desktopPanel === "services" && <div className="flex-1 glass-panel m-2 rounded-xl overflow-hidden"><ServicesManager services={services} onAdd={addService} onUpdate={updateService} onDelete={deleteService} onReset={resetToDefaults} className="h-full" /></div>}
            {desktopPanel === "history" && <div className="flex-1 glass-panel m-2 rounded-xl overflow-hidden"><GenerationHistory history={history} onLoad={handleHistoryLoad} onDelete={deleteFromHistory} onClear={clearHistory} className="h-full" /></div>}
            {desktopPanel === "favorites" && <div className="flex-1 glass-panel m-2 rounded-xl overflow-hidden"><FavoritesPanel favorites={favorites} onLoad={handleHistoryLoad} onRemove={removeFavorite} /></div>}
            {desktopPanel === "quiz" && <div className="flex-1 glass-panel m-2 rounded-xl overflow-hidden"><QuizMode serviceNames={serviceNames} className="h-full" /></div>}
            {desktopPanel === "timer" && <div className="flex-1 glass-panel m-2 rounded-xl overflow-hidden"><CallTimer className="h-full" /></div>}
            {desktopPanel === "dashboard" && <div className="flex-1 glass-panel m-2 rounded-xl overflow-hidden"><ActivityDashboard history={history} serviceNames={serviceNames} className="h-full" /></div>}
            {desktopPanel === "comparison" && <div className="flex-1 glass-panel m-2 rounded-xl overflow-hidden"><ScriptComparison history={history} favorites={favorites} className="h-full" /></div>}
            {desktopPanel === "cases" && <div className="flex-1 glass-panel m-2 rounded-xl overflow-hidden"><CaseLibrary className="h-full" /></div>}
            {desktopPanel === "settings" && <div className="flex-1 glass-panel m-2 rounded-xl overflow-hidden"><AppSettingsPanel transcriberUrl={appSettings.transcriberUrl} onTranscriberUrlChange={(v) => updateAppSetting("transcriberUrl", v)} currentTheme={theme} onThemeChange={setTheme} user={user} onSignIn={() => setShowAuthDialog(true)} onSignOut={signOut} /></div>}
          </div>
        </div>
        <AuthDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} onSignIn={signIn} onSignUp={signUp} />
      </div>
    );
  }

  // Mobile
  const toolItems = [
    { tab: "armory" as MobileTab, label: "Арсенал", icon: <Zap className="w-5 h-5" />, desc: "Быстрая отработка возражений" },
    { tab: "audit" as MobileTab, label: "Аудит сайта", icon: <Globe className="w-5 h-5" />, desc: "SEO-аудит сайта" },
    { tab: "objections" as MobileTab, label: "Тренажёр возражений", icon: <Zap className="w-5 h-5" />, desc: "Генерация возражений" },
    { tab: "simulator" as MobileTab, label: "Симулятор клиента", icon: <MessageCircle className="w-5 h-5" />, desc: "Практика с AI-клиентом" },
    { tab: "quiz" as MobileTab, label: "Квиз-тренажёр", icon: <Brain className="w-5 h-5" />, desc: "ИИ оценивает ваш ответ" },
    { tab: "timer" as MobileTab, label: "Таймер звонка", icon: <Timer className="w-5 h-5" />, desc: "Контроль этапов разговора" },
    { tab: "cases" as MobileTab, label: "Библиотека кейсов", icon: <BookOpen className="w-5 h-5" />, desc: "Эталонные сценарии" },
  ];

  const menuItems = [
    { tab: "services" as MobileTab, label: "Услуги", icon: <Package className="w-5 h-5" /> },
    { tab: "history" as MobileTab, label: "История", icon: <History className="w-5 h-5" /> },
    { tab: "favorites" as MobileTab, label: "Избранное", icon: <Star className="w-5 h-5" /> },
    { tab: "dashboard" as MobileTab, label: "Дашборд", icon: <BarChart3 className="w-5 h-5" /> },
    { tab: "comparison" as MobileTab, label: "Сравнение", icon: <Columns2 className="w-5 h-5" /> },
    { tab: "display-settings" as MobileTab, label: "Настройки отображения", icon: <SlidersHorizontal className="w-5 h-5" /> },
  ];

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <header className="glass-panel border-b border-border/50 flex items-center justify-between px-4 py-3 shrink-0 z-10">
        <button onClick={() => setMobileTab("config")} className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center"><FileText className="w-4 h-4 text-primary-foreground" /></div>
          <h1 className="text-sm font-semibold tracking-tight text-foreground">ScriptEngine</h1>
        </button>
        <div className="flex items-center gap-1">
          {user ? (<button onClick={signOut} className="p-2 rounded-lg hover:bg-accent/50 text-muted-foreground"><LogOut className="w-4 h-4" /></button>)
            : (<button onClick={() => setShowAuthDialog(true)} className="p-2 rounded-lg hover:bg-accent/50 text-muted-foreground"><User className="w-4 h-4" /></button>)}
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        {mobileTab === "config" && <ConfigSidebar config={config} onChange={setConfig} onGenerate={() => generate()} isGenerating={isGenerating} serviceNames={serviceNames} className="!w-full !border-r-0 h-full glass-panel" transcriberUrl={appSettings.transcriberUrl} />}
        {mobileTab === "output" && <ScriptOutput script={script} isGenerating={isGenerating} mode={config.mode} displaySettings={displaySettings} className="h-full" onCompanionGenerate={handleCompanionGenerate} onScoreScript={handleScoreScript} isScoring={isScoring} isFavorite={isFavorite(script)} onToggleFavorite={handleToggleFavorite} />}
        {mobileTab === "armory" && <Armory onSelect={handleArmorySelect} isGenerating={isGenerating} className="!w-full !border-l-0 h-full" />}
        {mobileTab === "display-settings" && <div className="h-full overflow-y-auto p-6"><DisplaySettingsPanel settings={displaySettings} onUpdate={updateDisplay} onReset={resetDisplay} currentTheme={theme} onThemeChange={setTheme} /></div>}
        {mobileTab === "audit" && <SiteAudit onGenerateScript={handleAuditGenerate} isGenerating={isGenerating} serviceNames={serviceNames} className="h-full" />}
        {mobileTab === "objections" && <ObjectionTrainer serviceNames={serviceNames} className="h-full" />}
        {mobileTab === "simulator" && <ClientSimulator serviceNames={serviceNames} className="h-full" />}
        {mobileTab === "services" && <ServicesManager services={services} onAdd={addService} onUpdate={updateService} onDelete={deleteService} onReset={resetToDefaults} className="h-full" />}
        {mobileTab === "history" && <GenerationHistory history={history} onLoad={handleHistoryLoad} onDelete={deleteFromHistory} onClear={clearHistory} className="h-full" />}
        {mobileTab === "favorites" && <FavoritesPanel favorites={favorites} onLoad={handleHistoryLoad} onRemove={removeFavorite} />}
        {mobileTab === "quiz" && <QuizMode serviceNames={serviceNames} className="h-full" />}
        {mobileTab === "timer" && <CallTimer className="h-full" />}
        {mobileTab === "dashboard" && <ActivityDashboard history={history} serviceNames={serviceNames} className="h-full" />}
        {mobileTab === "comparison" && <ScriptComparison history={history} favorites={favorites} className="h-full" />}
        {mobileTab === "cases" && <CaseLibrary className="h-full" />}
      </div>

      <nav className="glass-panel border-t border-border/50 flex items-center justify-around py-2 shrink-0 z-10">
        <MobileNavBtn active={mobileTab === "config"} onClick={() => setMobileTab("config")} icon={<Settings className="w-5 h-5" />} label="Генератор" />
        <MobileNavBtn active={mobileTab === "output"} onClick={() => setMobileTab("output")} icon={<FileText className="w-5 h-5" />} label="Результат" />
        <MobileNavBtn active={["armory", "audit", "objections", "simulator", "quiz", "timer", "cases"].includes(mobileTab)} onClick={() => setShowToolsSheet(true)} icon={<Wrench className="w-5 h-5" />} label="Инструменты" />
        <MobileNavBtn active={["services", "history", "favorites", "display-settings", "dashboard", "comparison"].includes(mobileTab)} onClick={() => setShowMenuSheet(true)} icon={<Menu className="w-5 h-5" />} label="Ещё" />
      </nav>

      <Sheet open={showToolsSheet} onOpenChange={setShowToolsSheet}>
        <SheetContent side="bottom" className="glass-panel border-border/50 rounded-t-2xl">
          <SheetHeader><SheetTitle className="text-base">Инструменты</SheetTitle></SheetHeader>
          <div className="flex flex-col gap-2 py-4">
            {toolItems.map((item) => (
              <button key={item.tab} onClick={() => { setMobileTab(item.tab); setShowToolsSheet(false); }} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-accent/50 transition-colors text-left">
                <div className="text-primary">{item.icon}</div>
                <div><div className="text-sm font-medium text-foreground">{item.label}</div><div className="text-[11px] text-muted-foreground">{item.desc}</div></div>
                <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={showMenuSheet} onOpenChange={setShowMenuSheet}>
        <SheetContent side="bottom" className="glass-panel border-border/50 rounded-t-2xl">
          <SheetHeader><SheetTitle className="text-base">Меню</SheetTitle></SheetHeader>
          <div className="flex flex-col gap-2 py-4">
            {menuItems.map((item) => (
              <button key={item.tab} onClick={() => { setMobileTab(item.tab); setShowMenuSheet(false); }} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-accent/50 transition-colors text-left">
                <div className="text-primary">{item.icon}</div>
                <div className="text-sm font-medium text-foreground">{item.label}</div>
                <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
              </button>
            ))}
            <div className="border-t border-border/50 pt-3 mt-1 px-4">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Тема</p>
              <ThemePicker current={theme} onChange={setTheme} />
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

function AppSettingsPanel({ transcriberUrl, onTranscriberUrlChange, currentTheme, onThemeChange, user, onSignIn, onSignOut }: {
  transcriberUrl: string; onTranscriberUrlChange: (v: string) => void;
  currentTheme: any; onThemeChange: (t: any) => void;
  user: any; onSignIn: () => void; onSignOut: () => void;
}) {
  return (
    <div className="flex-1 p-8 max-w-xl overflow-y-auto">
      <h2 className="text-lg font-semibold text-foreground mb-1">Настройки</h2>
      <p className="text-xs text-muted-foreground mb-8">Глобальные настройки ScriptEngine</p>
      <div className="space-y-8">
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-3">Аккаунт</label>
          {user ? (
            <div className="glass-card border border-border/50 rounded-xl p-4 flex items-center justify-between">
              <div><p className="text-sm text-foreground font-medium">{user.email}</p><p className="text-[10px] text-muted-foreground">Данные синхронизируются с облаком</p></div>
              <button onClick={onSignOut} className="text-xs px-3 py-1.5 rounded-lg border border-border/50 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors">Выйти</button>
            </div>
          ) : (
            <button onClick={onSignIn} className="w-full glass-card border border-border/50 rounded-xl p-4 text-left hover:bg-accent/30 transition-colors">
              <p className="text-sm text-foreground font-medium">Войдите для облачного сохранения</p>
              <p className="text-[10px] text-muted-foreground">Настройки, история и избранное будут синхронизироваться</p>
            </button>
          )}
        </div>
        <div><label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-3">Тема оформления</label><ThemePicker current={currentTheme} onChange={onThemeChange} /></div>
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-2">URL транскрибатора</label>
          <input className="w-full glass-input border border-border/50 rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            placeholder="https://transcriber.example.com" value={transcriberUrl} onChange={(e) => onTranscriberUrlChange(e.target.value)} />
          <p className="text-[10px] text-muted-foreground mt-1.5">Ссылка доступна в разделе «Анализ диалога»</p>
        </div>
      </div>
    </div>
  );
}
