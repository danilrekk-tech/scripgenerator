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
import { streamScript } from "@/lib/streamChat";
import { useTheme } from "@/hooks/useTheme";
import { useDisplaySettings } from "@/hooks/useDisplaySettings";
import { useServices } from "@/hooks/useServices";
import { useHistory } from "@/hooks/useHistory";
import { useGeneratorPresets } from "@/hooks/useGeneratorPresets";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useIsMobile } from "@/hooks/use-mobile";
import { Settings, Sun, Moon, FileText, SlidersHorizontal, Home, Globe, Zap, MessageCircle, Package, History, Save, FolderOpen, Trash2, ExternalLink } from "lucide-react";

const defaultConfig: ScriptConfig = {
  managerName: "",
  clientName: "",
  service: "SEO-продвижение",
  situation: "Холодный звонок",
  tone: "Уверенный эксперт",
  context: "",
  mode: "script",
  transcript: "",
  priceRub: "",
  currency: "RUB",
  emailSubtype: "follow-up",
  emailObjection: "",
  scriptLength: "medium",
  dozimSubtype: "thinking",
  transcriptSubmode: "analysis",
};

type MobileTab = "config" | "output" | "armory" | "display-settings" | "audit" | "objections" | "simulator" | "services" | "history";
type DesktopPanel = "main" | "audit" | "objections" | "simulator" | "services" | "history" | "settings";

export default function Index() {
  const [config, setConfig] = useState<ScriptConfig>(defaultConfig);
  const [script, setScript] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const { theme, toggle } = useTheme();
  const { settings: displaySettings, update: updateDisplay, reset: resetDisplay } = useDisplaySettings();
  const { services, serviceNames, addService, updateService, deleteService, resetToDefaults, getServiceContext } = useServices();
  const { history, addToHistory, deleteFromHistory, clearHistory } = useHistory();
  const { presets, savePreset, deletePreset } = useGeneratorPresets();
  const { appSettings, updateAppSetting } = useAppSettings();
  const isMobile = useIsMobile();
  const [mobileTab, setMobileTab] = useState<MobileTab>("config");
  const [showDesktopSettings, setShowDesktopSettings] = useState(false);
  const [desktopPanel, setDesktopPanel] = useState<DesktopPanel>("main");
  const [pendingHistorySave, setPendingHistorySave] = useState(false);
  const [showPresetSave, setShowPresetSave] = useState(false);
  const [presetName, setPresetName] = useState("");

  useEffect(() => {
    if (pendingHistorySave && !isGenerating && script) {
      addToHistory({
        mode: config.mode,
        service: config.service,
        label: script.slice(0, 100).replace(/\n/g, " "),
        content: script,
      });
      setPendingHistorySave(false);
    }
  }, [pendingHistorySave, isGenerating, script]);

  const generate = useCallback(
    (overrideContext?: string) => {
      if (isGenerating) return;
      setIsGenerating(true);
      setScript("");
      setPendingHistorySave(true);

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
        onError: (msg) => {
          toast.error(msg);
          setIsGenerating(false);
          setPendingHistorySave(false);
        },
      });
    },
    [config, isGenerating, isMobile, desktopPanel, getServiceContext]
  );

  const handleCompanionGenerate = useCallback(
    (type: "objections" | "arguments" | "benefits" | "dozim") => {
      if (isGenerating || !script) return;

      const typeLabels = {
        objections: "возможные возражения клиента и ответы на них",
        arguments: "дополнительные аргументы в пользу покупки",
        benefits: "конкретные выгоды, которые получит клиент",
        dozim: "фразы для дожима и закрытия сделки",
      };

      const companionContext = `ОСНОВНОЙ СКРИПТ (уже сгенерирован, будет использоваться в том же разговоре):\n${script}\n\nЗАДАЧА: Сгенерируй ${typeLabels[type]}. Это дополнение к основному скрипту выше — они будут использоваться в ОДНОМ И ТОМ ЖЕ разговоре. Не повторяй то, что уже есть в основном скрипте. Дай новые, дополняющие материалы.`;

      setIsGenerating(true);
      setScript((prev) => prev + "\n\n---\n\n");
      setPendingHistorySave(true);

      const svcContext = getServiceContext(config.service);
      const enrichedContext = svcContext ? `${svcContext}\n\n${companionContext}` : companionContext;

      const payload: Record<string, string> = {
        ...config,
        mode: type === "dozim" ? "dozim" : type === "objections" ? "arguments" : "arguments",
        context: enrichedContext,
      };

      streamScript({
        config: payload,
        onDelta: (chunk) => setScript((prev) => prev + chunk),
        onDone: () => setIsGenerating(false),
        onError: (msg) => {
          toast.error(msg);
          setIsGenerating(false);
          setPendingHistorySave(false);
        },
      });
    },
    [config, isGenerating, script, getServiceContext]
  );

  const handleArmorySelect = useCallback(
    (prompt: string) => generate(prompt),
    [generate]
  );

  const handleAuditGenerate = useCallback(
    (auditContext: string) => {
      setConfig((prev) => ({ ...prev, context: auditContext }));
      generate(auditContext);
    },
    [generate]
  );

  const handleHistoryLoad = useCallback(
    (content: string) => {
      setScript(content);
      if (isMobile) setMobileTab("output");
      if (desktopPanel !== "main") setDesktopPanel("main");
    },
    [isMobile, desktopPanel]
  );

  const handleSavePreset = () => {
    if (!presetName.trim()) return;
    savePreset(presetName.trim(), config);
    setPresetName("");
    setShowPresetSave(false);
    toast.success("Пресет сохранён");
  };

  const handleLoadPreset = (presetConfig: Partial<ScriptConfig>) => {
    setConfig((prev) => ({ ...prev, ...presetConfig }));
    toast.success("Пресет загружен");
  };

  const betaTabs: { value: DesktopPanel; label: string; icon: React.ReactNode; beta?: boolean }[] = [
    { value: "main", label: "Генератор", icon: <FileText className="w-4 h-4" /> },
    { value: "audit", label: "Аудит", icon: <Globe className="w-4 h-4" />, beta: true },
    { value: "objections", label: "Возражения", icon: <Zap className="w-4 h-4" />, beta: true },
    { value: "simulator", label: "Симулятор", icon: <MessageCircle className="w-4 h-4" />, beta: true },
    { value: "services", label: "Услуги", icon: <Package className="w-4 h-4" /> },
    { value: "history", label: "История", icon: <History className="w-4 h-4" /> },
    { value: "settings", label: "Настройки", icon: <Settings className="w-4 h-4" /> },
  ];

  // Desktop layout
  if (!isMobile) {
    return (
      <div className="flex h-screen overflow-hidden bg-background">
        {desktopPanel === "main" && (
          <ConfigSidebar
            config={config}
            onChange={setConfig}
            onGenerate={() => generate()}
            isGenerating={isGenerating}
            serviceNames={serviceNames}
            transcriberUrl={appSettings.transcriberUrl}
          />
        )}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar */}
          <div className="flex items-center justify-between gap-2 px-4 py-2 border-b border-border bg-background">
            <div className="flex items-center gap-0.5">
              {betaTabs.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setDesktopPanel(tab.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 ${
                    desktopPanel === tab.value
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                  {tab.beta && (
                    <span className="text-[8px] uppercase tracking-wider opacity-50 font-mono">β</span>
                  )}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1">
              {desktopPanel === "main" && (
                <>
                  {/* Presets */}
                  <div className="relative">
                    <button
                      onClick={() => setShowPresetSave(!showPresetSave)}
                      className="p-2 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                      title="Пресеты"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    {showPresetSave && (
                      <div className="absolute right-0 top-full mt-1 w-72 bg-card border border-border rounded-lg shadow-lg z-50 p-3">
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Сохранить пресет</p>
                        <div className="flex gap-1.5 mb-3">
                          <input
                            className="flex-1 bg-input border border-border rounded-md px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                            placeholder="Название пресета..."
                            value={presetName}
                            onChange={(e) => setPresetName(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSavePreset()}
                          />
                          <button
                            onClick={handleSavePreset}
                            disabled={!presetName.trim()}
                            className="px-3 py-1.5 bg-foreground text-background rounded-md text-xs font-medium hover:opacity-90 disabled:opacity-30 btn-tactile"
                          >
                            Сохранить
                          </button>
                        </div>
                        {presets.length > 0 && (
                          <>
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Загрузить</p>
                            <div className="max-h-40 overflow-y-auto space-y-1">
                              {presets.map((p) => (
                                <div key={p.id} className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-md hover:bg-accent group">
                                  <button
                                    onClick={() => { handleLoadPreset(p.config); setShowPresetSave(false); }}
                                    className="flex-1 text-left text-xs text-foreground truncate"
                                  >
                                    {p.name}
                                  </button>
                                  <button
                                    onClick={() => deletePreset(p.id)}
                                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setShowDesktopSettings(!showDesktopSettings)}
                    className={`p-2 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors ${
                      showDesktopSettings ? "bg-accent text-foreground" : ""
                    }`}
                    title="Настройки отображения"
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                  </button>
                </>
              )}
              <button
                onClick={toggle}
                className="p-2 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                title={theme === "dark" ? "Светлая тема" : "Тёмная тема"}
              >
                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex flex-1 min-h-0">
            {desktopPanel === "main" && (
              <>
                {showDesktopSettings && (
                  <div className="w-80 shrink-0 border-r border-border bg-card p-6 overflow-y-auto">
                    <DisplaySettingsPanel settings={displaySettings} onUpdate={updateDisplay} onReset={resetDisplay} />
                  </div>
                )}
                <ScriptOutput
                  script={script}
                  isGenerating={isGenerating}
                  mode={config.mode}
                  displaySettings={displaySettings}
                  onCompanionGenerate={handleCompanionGenerate}
                />
                {!showDesktopSettings && (
                  <Armory onSelect={handleArmorySelect} isGenerating={isGenerating} />
                )}
              </>
            )}
            {desktopPanel === "audit" && (
              <SiteAudit onGenerateScript={handleAuditGenerate} isGenerating={isGenerating} serviceNames={serviceNames} className="flex-1" />
            )}
            {desktopPanel === "objections" && (
              <ObjectionTrainer serviceNames={serviceNames} className="flex-1" />
            )}
            {desktopPanel === "simulator" && (
              <ClientSimulator serviceNames={serviceNames} className="flex-1" />
            )}
            {desktopPanel === "services" && (
              <ServicesManager services={services} onAdd={addService} onUpdate={updateService} onDelete={deleteService} onReset={resetToDefaults} className="flex-1" />
            )}
            {desktopPanel === "history" && (
              <GenerationHistory history={history} onLoad={handleHistoryLoad} onDelete={deleteFromHistory} onClear={clearHistory} className="flex-1" />
            )}
            {desktopPanel === "settings" && (
              <AppSettingsPanel
                transcriberUrl={appSettings.transcriberUrl}
                onTranscriberUrlChange={(v) => updateAppSetting("transcriberUrl", v)}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  // Mobile layout
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-background shrink-0">
        <button
          onClick={() => setMobileTab("config")}
          className="flex items-center gap-2"
        >
          <h1 className="text-sm font-semibold tracking-tight text-foreground">ScriptEngine</h1>
        </button>
        <button
          onClick={toggle}
          className="p-2 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </header>

      <div className="flex-1 overflow-hidden">
        {mobileTab === "config" && (
          <ConfigSidebar
            config={config}
            onChange={setConfig}
            onGenerate={() => generate()}
            isGenerating={isGenerating}
            serviceNames={serviceNames}
            className="!w-full !border-r-0 h-full"
            transcriberUrl={appSettings.transcriberUrl}
          />
        )}
        {mobileTab === "output" && (
          <ScriptOutput
            script={script}
            isGenerating={isGenerating}
            mode={config.mode}
            displaySettings={displaySettings}
            className="h-full"
            onCompanionGenerate={handleCompanionGenerate}
          />
        )}
        {mobileTab === "armory" && (
          <Armory onSelect={handleArmorySelect} isGenerating={isGenerating} className="!w-full !border-l-0 h-full" />
        )}
        {mobileTab === "display-settings" && (
          <div className="h-full overflow-y-auto p-6">
            <DisplaySettingsPanel settings={displaySettings} onUpdate={updateDisplay} onReset={resetDisplay} />
          </div>
        )}
        {mobileTab === "audit" && (
          <SiteAudit onGenerateScript={handleAuditGenerate} isGenerating={isGenerating} serviceNames={serviceNames} className="h-full" />
        )}
        {mobileTab === "objections" && (
          <ObjectionTrainer serviceNames={serviceNames} className="h-full" />
        )}
        {mobileTab === "simulator" && (
          <ClientSimulator serviceNames={serviceNames} className="h-full" />
        )}
        {mobileTab === "services" && (
          <ServicesManager services={services} onAdd={addService} onUpdate={updateService} onDelete={deleteService} onReset={resetToDefaults} className="h-full" />
        )}
        {mobileTab === "history" && (
          <GenerationHistory history={history} onLoad={handleHistoryLoad} onDelete={deleteFromHistory} onClear={clearHistory} className="h-full" />
        )}
      </div>

      <nav className="flex items-center justify-around border-t border-border bg-background py-2 shrink-0 overflow-x-auto">
        <MobileNavBtn active={mobileTab === "config"} onClick={() => setMobileTab("config")} icon={<Settings className="w-5 h-5" />} label="Настройки" />
        <MobileNavBtn active={mobileTab === "output"} onClick={() => setMobileTab("output")} icon={<FileText className="w-5 h-5" />} label="Результат" />
        <MobileNavBtn active={mobileTab === "audit"} onClick={() => setMobileTab("audit")} icon={<Globe className="w-5 h-5" />} label="Аудит" />
        <MobileNavBtn active={mobileTab === "objections"} onClick={() => setMobileTab("objections")} icon={<Zap className="w-5 h-5" />} label="Возражения" />
        <MobileNavBtn active={mobileTab === "simulator"} onClick={() => setMobileTab("simulator")} icon={<MessageCircle className="w-5 h-5" />} label="Симулятор" />
        <MobileNavBtn active={mobileTab === "services"} onClick={() => setMobileTab("services")} icon={<Package className="w-5 h-5" />} label="Услуги" />
        <MobileNavBtn active={mobileTab === "history"} onClick={() => setMobileTab("history")} icon={<History className="w-5 h-5" />} label="История" />
      </nav>
    </div>
  );
}

function MobileNavBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-md transition-colors ${
        active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon}
      <span className="text-[9px] font-medium">{label}</span>
    </button>
  );
}

function AppSettingsPanel({
  transcriberUrl,
  onTranscriberUrlChange,
}: {
  transcriberUrl: string;
  onTranscriberUrlChange: (v: string) => void;
}) {
  return (
    <div className="flex-1 p-8 max-w-xl">
      <h2 className="text-lg font-semibold text-foreground mb-1">Настройки приложения</h2>
      <p className="text-xs text-muted-foreground mb-8">Глобальные настройки ScriptEngine</p>

      <div className="space-y-6">
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-2">
            URL транскрибатора
          </label>
          <input
            className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all"
            placeholder="https://transcriber.example.com"
            value={transcriberUrl}
            onChange={(e) => onTranscriberUrlChange(e.target.value)}
          />
          <p className="text-[10px] text-muted-foreground mt-1">Ссылка на сервис транскрибации, доступна из раздела «Анализ диалога»</p>
        </div>
      </div>
    </div>
  );
}
