import { Switch } from "@/components/ui/switch";
import { MODULE_CATALOG, useModules, type ModuleId } from "@/hooks/useModules";
import { Briefcase, Users, ListChecks, GitCompare, Calculator, Send, BookOpen, Mic, Sparkles, ShieldCheck } from "lucide-react";

const ICONS: Record<ModuleId, React.ReactNode> = {
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

const GROUP_LABELS = { sales: "Продажи", knowledge: "Знания", "ai-tools": "AI-инструменты" } as const;

export default function ModulesPanel() {
  const { enabled, toggle, setAll, layout, updateLayout } = useModules();

  const grouped = MODULE_CATALOG.reduce<Record<string, typeof MODULE_CATALOG>>((acc, m) => {
    (acc[m.group] ??= []).push(m); return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="glass-card border border-border/50 rounded-xl p-4">
        <p className="text-xs font-medium text-foreground mb-3">Стартовый экран</p>
        <div className="grid grid-cols-3 gap-2">
          {(["dashboard", "generator", "bento"] as const).map((opt) => (
            <button key={opt} onClick={() => updateLayout("startScreen", opt)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all btn-tactile ${
                layout.startScreen === opt ? "bg-primary text-primary-foreground" : "bg-muted/40 text-muted-foreground hover:text-foreground"
              }`}>
              {opt === "dashboard" ? "Дашборд" : opt === "generator" ? "Генератор" : "Bento"}
            </button>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-foreground">Bento-сетка инструментов</p>
            <p className="text-[10px] text-muted-foreground">Красивая стартовая карта вместо текстового списка</p>
          </div>
          <Switch checked={layout.bentoToolsView} onCheckedChange={(v) => updateLayout("bentoToolsView", v)} />
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-foreground">Режим фокус</p>
            <p className="text-[10px] text-muted-foreground">Скрыть сайдбар при работе с инструментом</p>
          </div>
          <Switch checked={layout.focusMode} onCheckedChange={(v) => updateLayout("focusMode", v)} />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Модули</p>
          <div className="flex gap-1">
            <button onClick={() => setAll(true)} className="text-[10px] px-2 py-1 rounded-md hover:bg-accent/50 text-muted-foreground">Все вкл</button>
            <button onClick={() => setAll(false)} className="text-[10px] px-2 py-1 rounded-md hover:bg-accent/50 text-muted-foreground">Все выкл</button>
          </div>
        </div>

        {Object.entries(grouped).map(([group, mods]) => (
          <div key={group} className="mb-4">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground/70 mb-1.5 px-1">{GROUP_LABELS[group as keyof typeof GROUP_LABELS]}</p>
            <div className="glass-card border border-border/50 rounded-xl divide-y divide-border/30 overflow-hidden">
              {mods.map((m) => (
                <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${enabled[m.id] ? "bg-primary/15 text-primary" : "bg-muted/40 text-muted-foreground"}`}>{ICONS[m.id]}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{m.label}</p>
                    <p className="text-[11px] text-muted-foreground leading-snug">{m.description}</p>
                  </div>
                  <Switch checked={enabled[m.id]} onCheckedChange={() => toggle(m.id)} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
