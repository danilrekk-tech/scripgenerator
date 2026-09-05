import { Check, Layers } from "lucide-react";
import { LITE_MODULES, LITE_PRESETS, useLiteModules } from "@/hooks/useLiteModules";

interface Props {
  onDone: () => void;
}

export default function PresetPicker({ onDone }: Props) {
  const { applyPreset, markPresetChosen } = useLiteModules();

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-3xl px-5 py-10 pb-24 sm:px-8">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Layers className="h-4 w-4" />
          <span className="text-xs uppercase tracking-widest">Первый запуск</span>
        </div>
        <h1 className="mt-2 font-display text-3xl font-semibold text-foreground">Выберите рабочий режим</h1>
        <p className="mt-2 text-sm text-muted-foreground">Набор модулей можно изменить в любой момент в разделе «Модули».</p>

        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          {LITE_PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => { applyPreset(p.id); onDone(); }}
              className="group rounded-2xl border border-border/60 bg-card/40 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/[0.04]"
            >
              <p className="text-[15px] font-medium text-foreground">{p.label}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{p.description}</p>
              <ul className="mt-3 space-y-1">
                {p.modules.map((id) => (
                  <li key={id} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Check className="h-3 w-3 shrink-0 text-primary" />
                    {LITE_MODULES.find((m) => m.id === id)?.label ?? id}
                  </li>
                ))}
              </ul>
            </button>
          ))}
        </div>

        <button
          onClick={() => { markPresetChosen(); onDone(); }}
          className="mt-7 text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
        >
          Настроить вручную
        </button>
      </div>
    </div>
  );
}
