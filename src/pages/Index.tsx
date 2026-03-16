import { useState, useCallback } from "react";
import { toast } from "sonner";
import ConfigSidebar, { type ScriptConfig, type GenerationMode } from "@/components/ConfigSidebar";
import ScriptOutput from "@/components/ScriptOutput";
import Armory from "@/components/Armory";
import DisplaySettingsPanel from "@/components/DisplaySettingsPanel";
import SiteAudit from "@/components/SiteAudit";
import ObjectionTrainer from "@/components/ObjectionTrainer";
import ClientSimulator from "@/components/ClientSimulator";
import { streamScript } from "@/lib/streamChat";
import { useTheme } from "@/hooks/useTheme";
import { useDisplaySettings } from "@/hooks/useDisplaySettings";
import { useIsMobile } from "@/hooks/use-mobile";
import { Settings, Sun, Moon, FileText, Shield, SlidersHorizontal, Home, Globe, Zap, MessageCircle } from "lucide-react";

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
};

type MobileTab = "config" | "output" | "armory" | "display-settings" | "audit" | "objections" | "simulator";
type DesktopPanel = "main" | "audit" | "objections" | "simulator";

export default function Index() {
  const [config, setConfig] = useState<ScriptConfig>(defaultConfig);
  const [script, setScript] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const { theme, toggle } = useTheme();
  const { settings: displaySettings, update: updateDisplay, reset: resetDisplay } = useDisplaySettings();
  const isMobile = useIsMobile();
  const [mobileTab, setMobileTab] = useState<MobileTab>("config");
  const [showDesktopSettings, setShowDesktopSettings] = useState(false);
  const [desktopPanel, setDesktopPanel] = useState<DesktopPanel>("main");

  const generate = useCallback(
    (overrideContext?: string) => {
      if (isGenerating) return;
      setIsGenerating(true);
      setScript("");

      if (isMobile) setMobileTab("output");
      if (desktopPanel !== "main") setDesktopPanel("main");

      const payload = {
        ...config,
        context: overrideContext || config.context,
      };

      streamScript({
        config: payload,
        onDelta: (chunk) => setScript((prev) => prev + chunk),
        onDone: () => setIsGenerating(false),
        onError: (msg) => {
          toast.error(msg);
          setIsGenerating(false);
        },
      });
    },
    [config, isGenerating, isMobile, desktopPanel]
  );

  const handleArmorySelect = useCallback(
    (prompt: string) => {
      generate(prompt);
    },
    [generate]
  );

  const handleAuditGenerate = useCallback(
    (auditContext: string) => {
      setConfig((prev) => ({ ...prev, context: auditContext }));
      generate(auditContext);
    },
    [generate]
  );

  const betaTabs: { value: DesktopPanel; label: string; icon: React.ReactNode }[] = [
    { value: "main", label: "Генератор", icon: <FileText className="w-4 h-4" /> },
    { value: "audit", label: "Аудит сайта", icon: <Globe className="w-4 h-4" /> },
    { value: "objections", label: "Возражения", icon: <Zap className="w-4 h-4" /> },
    { value: "simulator", label: "Симулятор", icon: <MessageCircle className="w-4 h-4" /> },
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
          />
        )}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar */}
          <div className="flex items-center justify-between gap-2 px-4 py-2 border-b border-border">
            <div className="flex items-center gap-1">
              {betaTabs.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setDesktopPanel(tab.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    desktopPanel === tab.value
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                  {tab.value !== "main" && (
                    <span className="text-[9px] uppercase tracking-wider bg-primary/10 text-primary px-1 py-0.5 rounded font-medium">β</span>
                  )}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              {desktopPanel === "main" && (
                <button
                  onClick={() => setShowDesktopSettings(!showDesktopSettings)}
                  className={`p-2 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors ${
                    showDesktopSettings ? "bg-secondary text-primary" : ""
                  }`}
                  title="Настройки отображения"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={toggle}
                className="p-2 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
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
                {showDesktopSettings ? (
                  <div className="w-80 shrink-0 border-r border-border bg-card p-6 overflow-y-auto">
                    <DisplaySettingsPanel
                      settings={displaySettings}
                      onUpdate={updateDisplay}
                      onReset={resetDisplay}
                    />
                  </div>
                ) : null}
                <ScriptOutput
                  script={script}
                  isGenerating={isGenerating}
                  mode={config.mode}
                  displaySettings={displaySettings}
                />
                {!showDesktopSettings && (
                  <Armory onSelect={handleArmorySelect} isGenerating={isGenerating} />
                )}
              </>
            )}
            {desktopPanel === "audit" && (
              <SiteAudit onGenerateScript={handleAuditGenerate} isGenerating={isGenerating} className="flex-1" />
            )}
            {desktopPanel === "objections" && (
              <ObjectionTrainer className="flex-1" />
            )}
            {desktopPanel === "simulator" && (
              <ClientSimulator className="flex-1" />
            )}
          </div>
        </div>
      </div>
    );
  }

  // Mobile layout
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-card shrink-0">
        <button
          onClick={() => setMobileTab("config")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Home className="w-4 h-4" />
          <h1 className="text-base font-semibold tracking-tight text-foreground">ScriptEngine</h1>
        </button>
        <button
          onClick={toggle}
          className="p-2 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
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
            className="!w-full !border-r-0 h-full"
          />
        )}
        {mobileTab === "output" && (
          <ScriptOutput
            script={script}
            isGenerating={isGenerating}
            mode={config.mode}
            displaySettings={displaySettings}
            className="h-full"
          />
        )}
        {mobileTab === "armory" && (
          <Armory onSelect={handleArmorySelect} isGenerating={isGenerating} className="!w-full !border-l-0 h-full" />
        )}
        {mobileTab === "display-settings" && (
          <div className="h-full overflow-y-auto p-6">
            <DisplaySettingsPanel
              settings={displaySettings}
              onUpdate={updateDisplay}
              onReset={resetDisplay}
            />
          </div>
        )}
        {mobileTab === "audit" && (
          <SiteAudit onGenerateScript={handleAuditGenerate} isGenerating={isGenerating} className="h-full" />
        )}
        {mobileTab === "objections" && (
          <ObjectionTrainer className="h-full" />
        )}
        {mobileTab === "simulator" && (
          <ClientSimulator className="h-full" />
        )}
      </div>

      <nav className="flex items-center justify-around border-t border-border bg-card py-2 shrink-0 overflow-x-auto">
        <MobileNavBtn active={mobileTab === "config"} onClick={() => setMobileTab("config")} icon={<Settings className="w-5 h-5" />} label="Настройки" />
        <MobileNavBtn active={mobileTab === "output"} onClick={() => setMobileTab("output")} icon={<FileText className="w-5 h-5" />} label="Результат" />
        <MobileNavBtn active={mobileTab === "audit"} onClick={() => setMobileTab("audit")} icon={<Globe className="w-5 h-5" />} label="Аудит" />
        <MobileNavBtn active={mobileTab === "objections"} onClick={() => setMobileTab("objections")} icon={<Zap className="w-5 h-5" />} label="Возражения" />
        <MobileNavBtn active={mobileTab === "simulator"} onClick={() => setMobileTab("simulator")} icon={<MessageCircle className="w-5 h-5" />} label="Симулятор" />
        <MobileNavBtn active={mobileTab === "display-settings"} onClick={() => setMobileTab("display-settings")} icon={<SlidersHorizontal className="w-5 h-5" />} label="Вид" />
      </nav>
    </div>
  );
}

function MobileNavBtn({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-md transition-colors ${
        active
          ? "text-primary"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon}
      <span className="text-[9px] font-medium">{label}</span>
    </button>
  );
}
