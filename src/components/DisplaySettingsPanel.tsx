import type { DisplaySettings } from "@/hooks/useDisplaySettings";
import { FONT_FAMILIES } from "@/hooks/useDisplaySettings";
import ThemePicker from "@/components/ThemePicker";
import type { Theme } from "@/hooks/useTheme";
import { RotateCcw, Download, Upload } from "lucide-react";
import { toast } from "sonner";
import { useRef } from "react";

interface Props {
  settings: DisplaySettings;
  onUpdate: <K extends keyof DisplaySettings>(key: K, value: DisplaySettings[K]) => void;
  onReset: () => void;
  className?: string;
  currentTheme?: Theme;
  onThemeChange?: (theme: Theme) => void;
}

const PRESETS: { label: string; icon: string; settings: Partial<DisplaySettings> }[] = [
  { label: "Для звонков", icon: "📞", settings: { fontSize: 16, lineHeight: 2.0, fontFamily: "sans", scriptBgEnabled: true, maxWidth: 60, showStageHeaders: true } },
  { label: "Для мессенджеров", icon: "💬", settings: { fontSize: 13, lineHeight: 1.5, fontFamily: "sans", scriptBgEnabled: false, maxWidth: 50, paragraphSpacing: 8 } },
  { label: "Для печати", icon: "🖨️", settings: { fontSize: 12, lineHeight: 1.6, fontFamily: "serif", scriptBgEnabled: false, maxWidth: 80, letterSpacing: 0 } },
  { label: "Презентация", icon: "📺", settings: { fontSize: 20, lineHeight: 2.2, fontFamily: "sans", scriptBgEnabled: true, maxWidth: 55, stageHeaderSize: 22 } },
];

export default function DisplaySettingsPanel({ settings, onUpdate, onReset, className, currentTheme, onThemeChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  const exportSettings = () => {
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "scriptengine-display-settings.json";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Настройки экспортированы");
  };

  const importSettings = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        Object.entries(data).forEach(([key, value]) => {
          if (key in settings) onUpdate(key as keyof DisplaySettings, value as any);
        });
        toast.success("Настройки импортированы");
      } catch { toast.error("Ошибка чтения файла"); }
    };
    reader.readAsText(file);
  };

  return (
    <div className={`flex flex-col gap-6 ${className || ""}`}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1">Настройки отображения</h2>
          <p className="text-[10px] text-muted-foreground">Внешний вид результата</p>
        </div>
        <div className="flex gap-1">
          <button onClick={exportSettings} className="p-2 rounded-lg hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-colors" title="Экспорт настроек"><Download className="w-4 h-4" /></button>
          <button onClick={() => fileRef.current?.click()} className="p-2 rounded-lg hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-colors" title="Импорт настроек"><Upload className="w-4 h-4" /></button>
          <button onClick={onReset} className="p-2 rounded-lg hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-colors" title="Сбросить"><RotateCcw className="w-4 h-4" /></button>
          <input ref={fileRef} type="file" accept=".json" onChange={importSettings} className="hidden" />
        </div>
      </div>

      {/* Quick presets */}
      <Field label="Быстрые профили">
        <div className="grid grid-cols-2 gap-1.5">
          {PRESETS.map((preset) => (
            <button key={preset.label} onClick={() => Object.entries(preset.settings).forEach(([k, v]) => onUpdate(k as keyof DisplaySettings, v as any))}
              className="text-left text-xs px-3 py-2 rounded-lg border border-border/50 glass-card hover:bg-accent/50 transition-all btn-tactile">
              <span className="mr-1.5">{preset.icon}</span>{preset.label}
            </button>
          ))}
        </div>
      </Field>

      {currentTheme && onThemeChange && (
        <Field label="Тема оформления"><ThemePicker current={currentTheme} onChange={onThemeChange} /></Field>
      )}

      <Field label="Шрифт">
        <div className="flex gap-1.5">
          {(Object.keys(FONT_FAMILIES) as Array<DisplaySettings["fontFamily"]>).map((f) => (
            <button key={f} onClick={() => onUpdate("fontFamily", f)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-all btn-tactile ${settings.fontFamily === f ? "chip-active" : "chip-inactive"}`}>
              {f === "mono" ? "Моно" : f === "sans" ? "Без засечек" : "С засечками"}
            </button>
          ))}
        </div>
      </Field>

      <Field label={`Размер шрифта: ${settings.fontSize}px`}>
        <input type="range" min={10} max={24} step={1} value={settings.fontSize} onChange={(e) => onUpdate("fontSize", Number(e.target.value))} className="w-full accent-primary" />
      </Field>

      <Field label={`Межстрочный интервал: ${settings.lineHeight.toFixed(1)}`}>
        <input type="range" min={1.2} max={3} step={0.1} value={settings.lineHeight} onChange={(e) => onUpdate("lineHeight", Number(e.target.value))} className="w-full accent-primary" />
      </Field>

      <Field label={`Межбуквенный: ${settings.letterSpacing.toFixed(2)}em`}>
        <input type="range" min={-0.05} max={0.15} step={0.01} value={settings.letterSpacing} onChange={(e) => onUpdate("letterSpacing", Number(e.target.value))} className="w-full accent-primary" />
      </Field>

      <Field label={`Отступ абзацев: ${settings.paragraphSpacing}px`}>
        <input type="range" min={4} max={40} step={2} value={settings.paragraphSpacing} onChange={(e) => onUpdate("paragraphSpacing", Number(e.target.value))} className="w-full accent-primary" />
      </Field>

      <Field label={`Ширина текста: ${settings.maxWidth}ch`}>
        <input type="range" min={40} max={120} step={5} value={settings.maxWidth} onChange={(e) => onUpdate("maxWidth", Number(e.target.value))} className="w-full accent-primary" />
      </Field>

      <Field label={`Заголовки этапов: ${settings.stageHeaderSize}px`}>
        <input type="range" min={12} max={24} step={1} value={settings.stageHeaderSize} onChange={(e) => onUpdate("stageHeaderSize", Number(e.target.value))} className="w-full accent-primary" />
      </Field>

      <Field label="Переключатели">
        <div className="flex flex-col gap-3">
          <Toggle label="Заголовки этапов" checked={settings.showStageHeaders} onChange={(v) => onUpdate("showStageHeaders", v)} />
          <Toggle label="Фон блоков скрипта" checked={settings.scriptBgEnabled} onChange={(v) => onUpdate("scriptBgEnabled", v)} />
          <Toggle label="Подсветка переменных [...]" checked={settings.highlightVariables} onChange={(v) => onUpdate("highlightVariables", v)} />
        </div>
      </Field>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between cursor-pointer text-xs text-foreground/80">
      <span>{label}</span>
      <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
        className={`relative w-9 h-5 rounded-full transition-colors ${checked ? "bg-primary" : "bg-border"}`}>
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-4" : ""}`} />
      </button>
    </label>
  );
}
