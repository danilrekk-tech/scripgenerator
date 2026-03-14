import { useState, useCallback } from "react";
import { toast } from "sonner";
import ConfigSidebar, { type ScriptConfig, type GenerationMode } from "@/components/ConfigSidebar";
import ScriptOutput from "@/components/ScriptOutput";
import Armory from "@/components/Armory";
import { streamScript } from "@/lib/streamChat";
import { useTheme } from "@/hooks/useTheme";
import { useIsMobile } from "@/hooks/use-mobile";
import { Settings, Sun, Moon, Menu, FileText, Shield, MessageCircleQuestion } from "lucide-react";

const defaultConfig: ScriptConfig = {
  managerName: "",
  clientName: "",
  service: "SEO-продвижение",
  situation: "Холодный звонок",
  tone: "Уверенный эксперт",
  context: "",
  mode: "script",
};

type MobileTab = "config" | "output" | "armory";

export default function Index() {
  const [config, setConfig] = useState<ScriptConfig>(defaultConfig);
  const [script, setScript] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const { theme, toggle } = useTheme();
  const isMobile = useIsMobile();
  const [mobileTab, setMobileTab] = useState<MobileTab>("config");

  const generate = useCallback(
    (overrideContext?: string) => {
      if (isGenerating) return;
      setIsGenerating(true);
      setScript("");

      if (isMobile) setMobileTab("output");

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
    [config, isGenerating, isMobile]
  );

  const handleArmorySelect = useCallback(
    (prompt: string) => {
      generate(prompt);
    },
    [generate]
  );

  // Desktop layout
  if (!isMobile) {
    return (
      <div className="flex h-screen overflow-hidden bg-background">
        <ConfigSidebar
          config={config}
          onChange={setConfig}
          onGenerate={() => generate()}
          isGenerating={isGenerating}
        />
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center justify-end gap-2 px-4 py-2 border-b border-border">
            <button
              onClick={toggle}
              className="p-2 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              title={theme === "dark" ? "Светлая тема" : "Тёмная тема"}
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
          <div className="flex flex-1 min-h-0">
            <ScriptOutput script={script} isGenerating={isGenerating} mode={config.mode} />
            <Armory onSelect={handleArmorySelect} isGenerating={isGenerating} />
          </div>
        </div>
      </div>
    );
  }

  // Mobile layout
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* Mobile header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-card shrink-0">
        <h1 className="text-base font-semibold tracking-tight">ScriptEngine</h1>
        <button
          onClick={toggle}
          className="p-2 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </header>

      {/* Mobile content */}
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
          <ScriptOutput script={script} isGenerating={isGenerating} mode={config.mode} className="h-full" />
        )}
        {mobileTab === "armory" && (
          <Armory onSelect={handleArmorySelect} isGenerating={isGenerating} className="!w-full !border-l-0 h-full" />
        )}
      </div>

      {/* Mobile bottom nav */}
      <nav className="flex items-center justify-around border-t border-border bg-card py-2 shrink-0">
        <MobileNavBtn
          active={mobileTab === "config"}
          onClick={() => setMobileTab("config")}
          icon={<Settings className="w-5 h-5" />}
          label="Настройки"
        />
        <MobileNavBtn
          active={mobileTab === "output"}
          onClick={() => setMobileTab("output")}
          icon={<FileText className="w-5 h-5" />}
          label="Результат"
        />
        <MobileNavBtn
          active={mobileTab === "armory"}
          onClick={() => setMobileTab("armory")}
          icon={<Shield className="w-5 h-5" />}
          label="Арсенал"
        />
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
      className={`flex flex-col items-center gap-0.5 px-4 py-1 rounded-md transition-colors ${
        active
          ? "text-primary"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}
