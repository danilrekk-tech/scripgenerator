import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Menu, Settings2, SlidersHorizontal, Sparkles, X, LayoutGrid, Maximize2, Home, Command } from "lucide-react";

import ConfigSidebar, { type ScriptConfig } from "@/components/ConfigSidebar";
import ScriptOutput from "@/components/ScriptOutput";
import DisplaySettingsPanel from "@/components/DisplaySettingsPanel";
import ModuleManager from "@/components/lite/ModuleManager";
import LightweightHome from "@/components/lite/LightweightHome";
import PresetPicker from "@/components/lite/PresetPicker";
import CommandPalette from "@/components/CommandPalette";
import { LITE_ICONS } from "@/components/lite/liteIcons";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

import ClientSimulator from "@/components/ClientSimulator";
import ObjectionTrainer from "@/components/ObjectionTrainer";
import QuizMode from "@/components/QuizMode";
import CaseLibrary from "@/components/CaseLibrary";
import PhraseBank from "@/components/PhraseBank";
import ServicesManager from "@/components/ServicesManager";
import ClientPersonasPanel from "@/components/ClientPersonasPanel";
import Armory from "@/components/Armory";
import GenerationHistory from "@/components/GenerationHistory";
import ObjectionLibrary from "@/components/ObjectionLibrary";
import SiteAudit from "@/components/SiteAudit";
import PreCallBrief from "@/components/PreCallBrief";
import SalesStyleLab from "@/components/SalesStyleLab";
import KPConstructor from "@/components/KPConstructor";
import CallIntelligence, { type CallIntelView } from "@/components/CallIntelligence";
import ContactCards from "@/components/modules/ContactCards";
import DiscoveryChecklist from "@/components/modules/DiscoveryChecklist";
import CompetitorMatrix from "@/components/modules/CompetitorMatrix";
import ValueCalculator from "@/components/modules/ValueCalculator";
import FollowUpComposer from "@/components/modules/FollowUpComposer";
import WikiKnowledge from "@/components/modules/WikiKnowledge";
import BattleCards from "@/components/modules/BattleCards";
import UpsellManager from "@/components/UpsellManager";

import { LITE_GROUP_LABELS, useLiteModules, type LiteGroup, type LiteModuleId, LITE_MODULES } from "@/hooks/useLiteModules";
import { useUiMode } from "@/hooks/useUiMode";
import { useServices } from "@/hooks/useServices";
import { useHistory } from "@/hooks/useHistory";
import { useDisplaySettings } from "@/hooks/useDisplaySettings";
import { useTheme } from "@/hooks/useTheme";
import { useAppSettings } from "@/hooks/useAppSettings";
import { usePhraseBank } from "@/hooks/usePhraseBank";
import { useClientPersonas } from "@/hooks/useClientPersonas";
import { useArmoryItems } from "@/hooks/useArmoryItems";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuth } from "@/hooks/useAuth";
import { useCloudBackup } from "@/hooks/useCloudBackup";
import { useIsMobile } from "@/hooks/use-mobile";
import { buildContextSections, sectionsToPrompt } from "@/lib/contextBuilder";
import { streamScript } from "@/lib/streamChat";

const SALES_STYLE_KEY = "scriptengine-sales-style";

const defaultConfig: ScriptConfig = {
  managerName: "", clientName: "", service: "SEO-продвижение", situation: "Холодный звонок",
  tone: "Уверенный эксперт", context: "", mode: "script", transcript: "", priceRub: "",
  currency: "RUB", emailSubtype: "follow-up", emailObjection: "", scriptLength: "medium",
  dozimSubtype: "thinking", transcriptSubmode: "analysis", personaId: "", quickTemplateId: "",
  backstory: "", clientSiteUrl: "", scenarioType: "", templateIds: "",
};

type LiteView = LiteModuleId | "home" | "modules" | "settings";

export default function LiteApp() {
  const { setMode } = useUiMode();
  const { enabledModules, isEnabled, presetChosen } = useLiteModules();
  const isMobile = useIsMobile();

  const { services, serviceNames, addService, updateService, deleteService, resetToDefaults, getServiceContext } = useServices();
  const { history, addToHistory, deleteFromHistory, clearHistory } = useHistory();
  const { settings: displaySettings, update: updateDisplay, reset: resetDisplay } = useDisplaySettings();
  const { theme, setTheme } = useTheme();
  const { appSettings } = useAppSettings();
  const { phrases, addPhrase, removePhrase } = usePhraseBank();
  const { personas, addPersona, updatePersona, removePersona } = useClientPersonas();
  const { items: armoryItems } = useArmoryItems();
  const { favorites, addFavorite, removeFavorite, isFavorite } = useFavorites();
  const { user } = useAuth();
  useCloudBackup(user?.id ?? null);

  const [view, setView] = useState<LiteView>("home");
  const [showPresetPicker, setShowPresetPicker] = useState(!presetChosen);
  const [showPalette, setShowPalette] = useState(false);
  const [config, setConfig] = useState<ScriptConfig>(defaultConfig);
  const [script, setScript] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [pendingSave, setPendingSave] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [showNav, setShowNav] = useState(false);
  const [ciView, setCiView] = useState<CallIntelView>("upload");
  const [showUpsells, setShowUpsells] = useState(false);

  // Если активный модуль выключили — вернуться к генератору
  useEffect(() => {
    if (view !== "home" && view !== "modules" && view !== "settings" && !isEnabled(view as LiteModuleId)) setView("home");
  }, [view, isEnabled]);

  useEffect(() => {
    if (pendingSave && !isGenerating && script) {
      addToHistory({ mode: config.mode, service: config.service, label: script.slice(0, 100).replace(/\n/g, " "), content: script });
      setPendingSave(false);
    }
  }, [pendingSave, isGenerating, script]);

  const personaSummary = useMemo(() => {
    const p = personas.find((x) => x.id === config.personaId);
    return p ? `${p.name} — ${p.role}. Стиль общения: ${p.communication}` : "";
  }, [personas, config.personaId]);

  const generate = useCallback((overrideContext?: string) => {
    if (isGenerating) return;
    setIsGenerating(true); setScript(""); setPendingSave(true);
    setView("scripts"); setShowConfig(false);

    let salesStyle = "";
    try {
      const raw = localStorage.getItem(SALES_STYLE_KEY);
      if (raw) salesStyle = JSON.parse(raw)?.recommendations || "";
    } catch { /* ignore */ }

    const sections = buildContextSections({
      service: config.service,
      serviceContext: getServiceContext(config.service),
      scenarioType: config.scenarioType,
      templateIds: config.templateIds,
      backstory: config.backstory,
      clientSiteUrl: config.clientSiteUrl,
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
      onError: (msg) => { toast.error(msg); setIsGenerating(false); setPendingSave(false); },
    });
  }, [config, isGenerating, getServiceContext, personaSummary, armoryItems]);

  const handleToggleFavorite = useCallback(() => {
    if (!script) return;
    if (isFavorite(script)) {
      const fav = favorites.find((f) => f.content === script);
      if (fav) removeFavorite(fav.id);
      toast.success("Удалено из избранного");
    } else {
      addFavorite({ label: script.slice(0, 80).replace(/\n/g, " "), content: script, mode: config.mode, service: config.service });
      toast.success("Добавлено в избранное");
    }
  }, [script, isFavorite, favorites, addFavorite, removeFavorite, config]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setShowPalette((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const paletteItems = useMemo(() => {
    type PaletteItem = { id: string; label: string; desc?: string; category: string; icon: React.ReactNode; action: () => void };
    const items: PaletteItem[] = enabledModules.map((m) => {
      const Icon = LITE_ICONS[m.id];
      return {
        id: m.id,
        label: m.label,
        desc: m.description,
        category: LITE_GROUP_LABELS[m.group],
        icon: <Icon className="h-4 w-4" />,
        action: () => setView(m.id),
      };
    });
    items.push(
      { id: "home", label: "Главная", desc: "Что будем делать?", category: "Навигация", icon: <Home className="h-4 w-4" />, action: () => setView("home") },
      { id: "modules", label: "Модули", desc: "Включить или выключить функции", category: "Навигация", icon: <LayoutGrid className="h-4 w-4" />, action: () => setView("modules") },
      { id: "settings", label: "Настройки", desc: "Отображение и режим интерфейса", category: "Навигация", icon: <Settings2 className="h-4 w-4" />, action: () => setView("settings") },
    );
    return items;
  }, [enabledModules]);

  const navGroups = useMemo(() => {
    const order: LiteGroup[] = ["core", "sales", "analytics", "training", "tools"];
    return order
      .map((g) => ({ group: g, items: enabledModules.filter((m) => m.group === g) }))
      .filter((g) => g.items.length > 0);
  }, [enabledModules]);

  const activeMeta = LITE_MODULES.find((m) => m.id === view);

  const renderModule = () => {
    const cls = "h-full";
    switch (view) {
      case "home": return (
        <LightweightHome
          isEnabled={isEnabled}
          onOpen={(id) => setView(id)}
          onOpenModules={() => setView("modules")}
        />
      );
      case "modules": return <div className="h-full overflow-y-auto"><ModuleManager /></div>;
      case "settings": return (
        <div className="h-full overflow-y-auto p-4 sm:p-6">
          <div className="mx-auto max-w-2xl space-y-5">
            <div className="rounded-xl border border-border/60 bg-card/40 p-4">
              <p className="text-sm font-medium text-foreground">Режим интерфейса</p>
              <p className="mt-1 text-xs text-muted-foreground">Сейчас: облегчённый. Все данные общие с расширенным режимом.</p>
              <button onClick={() => setMode("advanced")} className="mt-3 flex items-center gap-2 rounded-lg border border-border/60 px-3 py-2 text-xs text-foreground transition-colors hover:border-primary/40">
                <Maximize2 className="h-3.5 w-3.5" /> Вернуться в расширенный режим
              </button>
            </div>
            <DisplaySettingsPanel settings={displaySettings} onUpdate={updateDisplay} onReset={resetDisplay} currentTheme={theme} onThemeChange={setTheme} />
          </div>
        </div>
      );
      case "clients": return <ContactCards className={cls} />;
      case "history": return <GenerationHistory history={history} onLoad={(c) => { setScript(c); setView("scripts"); }} onDelete={deleteFromHistory} onClear={clearHistory} className={cls} />;
      case "objections": return <ObjectionLibrary serviceNames={serviceNames} className={cls} />;
      case "follow-up": return <FollowUpComposer serviceNames={serviceNames} className={cls} />;
      case "kp": return <KPConstructor serviceNames={serviceNames} className={cls} />;
      case "upsell": return (
        <div className="h-full overflow-y-auto p-4">
          <button onClick={() => setShowUpsells(true)} className="rounded-lg border border-border/60 px-4 py-2 text-sm text-foreground hover:border-primary/40">Открыть каталог допродаж</button>
        </div>
      );
      case "battle-cards": return <BattleCards serviceNames={serviceNames} className={cls} />;
      case "discovery": return <DiscoveryChecklist className={cls} />;
      case "value-calc": return <ValueCalculator className={cls} />;
      case "calls": return <CallIntelligence view={ciView} onViewChange={setCiView} serviceNames={serviceNames} className={cls} />;
      case "site-audit": return <SiteAudit onGenerateScript={(ctx) => { setConfig((p) => ({ ...p, context: ctx })); generate(ctx); }} isGenerating={isGenerating} serviceNames={serviceNames} className={cls} />;
      case "pre-call-brief": return <PreCallBrief serviceNames={serviceNames} className={cls} />;
      case "style-lab": return <SalesStyleLab className={cls} />;
      case "simulator": return <ClientSimulator serviceNames={serviceNames} className={cls} />;
      case "objection-trainer": return <ObjectionTrainer serviceNames={serviceNames} className={cls} />;
      case "quiz": return <QuizMode serviceNames={serviceNames} className={cls} />;
      case "cases": return <CaseLibrary className={cls} />;
      case "phrases": return <PhraseBank phrases={phrases} onAdd={addPhrase} onRemove={removePhrase} onCopy={(t) => { navigator.clipboard.writeText(t); toast.success("Скопировано"); }} className={cls} />;
      case "services": return <ServicesManager services={services} onAdd={addService} onUpdate={updateService} onDelete={deleteService} onReset={resetToDefaults} className={cls} />;
      case "personas": return <ClientPersonasPanel personas={personas} onAdd={addPersona} onUpdate={updatePersona} onRemove={removePersona} className={cls} />;
      case "armory": return <Armory onSelect={(prompt) => generate(prompt)} isGenerating={isGenerating} className="!w-full !border-l-0 h-full" />;
      case "wiki": return <WikiKnowledge className={cls} />;
      case "competitors": return <CompetitorMatrix serviceNames={serviceNames} className={cls} />;
      case "scripts":
      default:
        return (
          <div className="flex h-full min-h-0">
            <div className="min-w-0 flex-1 overflow-hidden">
              <ScriptOutput
                script={script}
                isGenerating={isGenerating}
                mode={config.mode}
                displaySettings={displaySettings}
                isFavorite={isFavorite(script)}
                onToggleFavorite={handleToggleFavorite}
                onScriptEdit={setScript}
                className="h-full"
              />
            </div>
            {!isMobile && (
              <div className="w-[340px] shrink-0 border-l border-border/50">
                <ConfigSidebar
                  config={config}
                  onChange={setConfig}
                  onGenerate={() => generate()}
                  isGenerating={isGenerating}
                  serviceNames={serviceNames}
                  personas={personas}
                  transcriberUrl={appSettings?.transcriberUrl}
                  className="h-full"
                />
              </div>
            )}
          </div>
        );
    }
  };

  const NavList = ({ onPick }: { onPick?: () => void }) => (
    <nav className="flex-1 space-y-4 overflow-y-auto px-2 py-3">
      <button onClick={() => { setView("home"); onPick?.(); }} className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-colors ${view === "home" ? "bg-primary/15 text-foreground" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"}`}>
        <Home className="h-4 w-4" /> Главная
      </button>
      {navGroups.map(({ group, items }) => (
        <div key={group}>
          <p className="mb-1 px-2 text-[9px] font-medium uppercase tracking-[0.15em] text-muted-foreground">{LITE_GROUP_LABELS[group]}</p>
          <div className="space-y-0.5">
            {items.map((m) => {
              const Icon = LITE_ICONS[m.id];
              const active = view === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => { setView(m.id); onPick?.(); }}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] transition-colors ${
                    active ? "bg-primary/15 text-foreground" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <div className="space-y-0.5 border-t border-border/40 pt-3">
        <button onClick={() => { setView("modules"); onPick?.(); }} className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-colors ${view === "modules" ? "bg-primary/15 text-foreground" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"}`}>
          <LayoutGrid className="h-4 w-4" /> Модули
        </button>
        <button onClick={() => { setView("settings"); onPick?.(); }} className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-colors ${view === "settings" ? "bg-primary/15 text-foreground" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"}`}>
          <Settings2 className="h-4 w-4" /> Настройки
        </button>
      </div>
    </nav>
  );

  return (
    <div className="flex overflow-hidden" style={{ height: "100dvh" }}>
      {!isMobile && (
        <aside className="flex w-52 shrink-0 flex-col border-r border-border/50 glass-panel">
          <div className="flex items-center gap-2 border-b border-border/30 px-3 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-border/40">
              <span className="font-display text-[13px] font-extrabold text-transparent bg-clip-text" style={{ backgroundImage: "var(--accent-gradient)" }}>SE</span>
            </div>
            <div className="min-w-0">
              <p className="truncate font-display text-xs font-bold text-foreground">ScriptEngine</p>
              <p className="text-[10px] text-muted-foreground">Облегчённый режим</p>
            </div>
          </div>
          <NavList />
          <button
            onClick={() => setShowPalette(true)}
            className="m-2 flex items-center justify-center gap-1.5 rounded-lg border border-border/50 py-2 text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            <Command className="h-3 w-3" /> Команды · ⌘K
          </button>
        </aside>
      )}

      <main className="flex min-w-0 flex-1 flex-col">
        {isMobile && (
          <header className="flex items-center gap-2 border-b border-border/40 px-3 py-2" style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top))" }}>
            <button onClick={() => setShowNav(true)} className="rounded-lg p-2 text-muted-foreground hover:text-foreground" aria-label="Меню">
              <Menu className="h-5 w-5" />
            </button>
            <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{activeMeta?.label ?? (view === "home" ? "Главная" : view === "modules" ? "Модули" : "Настройки")}</p>
            {view === "scripts" && (
              <button onClick={() => setShowConfig(true)} className="flex items-center gap-1.5 rounded-lg border border-border/60 px-2.5 py-1.5 text-xs text-foreground">
                <SlidersHorizontal className="h-3.5 w-3.5" /> Параметры
              </button>
            )}
          </header>
        )}

        <div className="min-h-0 flex-1 overflow-hidden">{renderModule()}</div>

        {isMobile && view === "scripts" && (
          <button
            onClick={() => generate()}
            disabled={isGenerating}
            className="fixed right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full text-primary-foreground shadow-lg disabled:opacity-50"
            style={{ bottom: "calc(1rem + env(safe-area-inset-bottom))", background: "var(--accent-gradient)" }}
            aria-label="Сгенерировать"
          >
            <Sparkles className="h-6 w-6" />
          </button>
        )}
      </main>

      {/* Мобильная навигация */}
      <Sheet open={showNav} onOpenChange={setShowNav}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="border-b border-border/40 px-4 py-3">
            <SheetTitle className="text-sm">Навигация</SheetTitle>
          </SheetHeader>
          <div className="flex h-[calc(100%-3.25rem)] flex-col">
            <NavList onPick={() => setShowNav(false)} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Мобильные параметры генерации */}
      <Sheet open={showConfig} onOpenChange={setShowConfig}>
        <SheetContent side="bottom" className="h-[88vh] p-0">
          <SheetHeader className="flex-row items-center justify-between border-b border-border/40 px-4 py-3">
            <SheetTitle className="text-sm">Параметры генерации</SheetTitle>
            <button onClick={() => setShowConfig(false)} className="text-muted-foreground"><X className="h-4 w-4" /></button>
          </SheetHeader>
          <div className="h-[calc(88vh-3.25rem)] overflow-hidden">
            <ConfigSidebar
              config={config}
              onChange={setConfig}
              onGenerate={() => generate()}
              isGenerating={isGenerating}
              serviceNames={serviceNames}
              personas={personas}
              transcriberUrl={appSettings?.transcriberUrl}
              className="h-full !w-full !border-0"
            />
          </div>
        </SheetContent>
      </Sheet>

      <CommandPalette open={showPalette} onClose={() => setShowPalette(false)} items={paletteItems} />

      {showPresetPicker && (
        <div className="fixed inset-0 z-[90] bg-background">
          <PresetPicker onDone={() => { setShowPresetPicker(false); setView("home"); }} />
        </div>
      )}

      {showUpsells && <UpsellManager onClose={() => setShowUpsells(false)} serviceNames={serviceNames} />}
    </div>
  );
}
