import { useMemo, useState } from "react";
import { Search, Layers, RotateCcw } from "lucide-react";
import {
  LITE_GROUP_LABELS, LITE_MODULES, LITE_PRESETS,
  type LiteGroup, useLiteModules,
} from "@/hooks/useLiteModules";
import ModuleCard from "./ModuleCard";

export default function ModuleManager() {
  const { enabled, toggle, setAll, applyPreset, enabledModules } = useLiteModules();
  const [query, setQuery] = useState("");

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? LITE_MODULES.filter((m) => m.label.toLowerCase().includes(q) || m.description.toLowerCase().includes(q))
      : LITE_MODULES;
    const order: LiteGroup[] = ["core", "sales", "analytics", "training", "tools"];
    return order
      .map((g) => ({ group: g, items: filtered.filter((m) => m.group === g) }))
      .filter((g) => g.items.length > 0);
  }, [query]);

  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-8 sm:px-8">
      <header className="mb-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Layers className="h-4 w-4" />
          <span className="text-xs uppercase tracking-widest">Модули</span>
        </div>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">Что должно быть в интерфейсе</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Включено {enabledModules.length} из {LITE_MODULES.length}. Отключённые модули просто скрываются — данные сохраняются.
        </p>
      </header>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-border/60 bg-card/40 px-3 py-2">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Найти модуль"
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex gap-2">
          <button onClick={() => setAll(true)} className="rounded-lg border border-border/60 px-3 py-2 text-xs text-muted-foreground transition-colors hover:text-foreground">Включить все</button>
          <button onClick={() => setAll(false)} className="rounded-lg border border-border/60 px-3 py-2 text-xs text-muted-foreground transition-colors hover:text-foreground">Выключить все</button>
        </div>
      </div>

      <div className="mb-8 rounded-xl border border-border/60 bg-card/40 p-4">
        <div className="mb-3 flex items-center gap-2">
          <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Готовые наборы</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {LITE_PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => applyPreset(p.id)}
              className="rounded-lg border border-border/60 px-3 py-2.5 text-left transition-colors hover:border-primary/40 hover:bg-primary/[0.04]"
            >
              <p className="text-sm font-medium text-foreground">{p.label}</p>
              <p className="text-[11px] text-muted-foreground">{p.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-8 pb-24">
        {groups.map(({ group, items }) => (
          <section key={group}>
            <p className="mb-3 text-xs font-medium uppercase tracking-widest text-muted-foreground">{LITE_GROUP_LABELS[group]}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {items.map((m) => (
                <ModuleCard key={m.id} module={m} enabled={!!enabled[m.id]} onToggle={() => toggle(m.id)} />
              ))}
            </div>
          </section>
        ))}
        {groups.length === 0 && <p className="text-sm text-muted-foreground">Ничего не найдено</p>}
      </div>
    </div>
  );
}
