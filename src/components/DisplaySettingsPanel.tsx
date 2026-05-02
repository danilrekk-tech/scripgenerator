import { useState, useRef, useMemo } from "react";
import type { DisplaySettings } from "@/hooks/useDisplaySettings";
import { FONT_FAMILIES } from "@/hooks/useDisplaySettings";
import ThemePicker from "@/components/ThemePicker";
import type { Theme } from "@/hooks/useTheme";
import { RotateCcw, Download, Upload, ChevronDown, Search, Type, Layout, Eye, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface Props {
  settings: DisplaySettings;
  onUpdate: <K extends keyof DisplaySettings>(key: K, value: DisplaySettings[K]) => void;
  onReset: () => void;
  className?: string;
  currentTheme?: Theme;
  onThemeChange?: (theme: Theme) => void;
}

const PRESETS: { label: string; icon: string; settings: Partial<DisplaySettings> }[] = [
  { label: "Для звонков", icon: "📞", settings: { fontSize: 16, lineHeight: 2.0, fontFamily: "sans", scriptBgEnabled: true, maxWidth: 60, showStageHeaders: true, density: "spacious" } },
  { label: "Мессенджеры", icon: "💬", settings: { fontSize: 13, lineHeight: 1.5, fontFamily: "sans", scriptBgEnabled: false, maxWidth: 50, paragraphSpacing: 8, density: "compact" } },
  { label: "Для печати", icon: "🖨️", settings: { fontSize: 12, lineHeight: 1.6, fontFamily: "serif", scriptBgEnabled: false, maxWidth: 80, letterSpacing: 0, cardShadow: "none" } },
  { label: "Презентация", icon: "📺", settings: { fontSize: 20, lineHeight: 2.2, fontFamily: "sans", scriptBgEnabled: true, maxWidth: 55, stageHeaderSize: 22, density: "spacious", boldHeaders: true } },
  { label: "Высокий контраст", icon: "🌓", settings: { textColor: "high-contrast", fontSize: 15, boldHeaders: true, scriptBgEnabled: true, cardShadow: "elevated" } },
  { label: "Минимализм", icon: "✨", settings: { scriptBgEnabled: false, showMinimap: false, showTableOfContents: false, cardShadow: "none", paragraphSpacing: 12 } },
];

type SectionKey = "theme" | "typography" | "layout" | "elements" | "advanced";

const SECTIONS: { key: SectionKey; label: string; icon: any }[] = [
  { key: "theme", label: "Тема и цвет", icon: Sparkles },
  { key: "typography", label: "Типографика", icon: Type },
  { key: "layout", label: "Раскладка", icon: Layout },
  { key: "elements", label: "Элементы", icon: Eye },
  { key: "advanced", label: "Дополнительно", icon: Sparkles },
];

export default function DisplaySettingsPanel({ settings, onUpdate, onReset, className, currentTheme, onThemeChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [openSections, setOpenSections] = useState<Set<SectionKey>>(new Set(["theme", "typography"]));
  const [search, setSearch] = useState("");

  const toggle = (k: SectionKey) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k); else next.add(k);
      return next;
    });
  };

  const exportSettings = () => {
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "scriptengine-display-settings.json"; a.click();
    URL.revokeObjectURL(url);
    toast.success("Настройки экспортированы");
  };

  const importSettings = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
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

  // search filter — show all sections if any keyword matches
  const q = search.trim().toLowerCase();
  const matches = useMemo(() => ({
    theme: ["тема", "цвет", "оформление"].some(s => s.includes(q)),
    typography: ["шрифт", "размер", "интервал", "буква", "кегль", "типограф"].some(s => s.includes(q)),
    layout: ["ширина", "отступ", "плотность", "выравнивание", "раскладка"].some(s => s.includes(q)),
    elements: ["заголовок", "фон", "тень", "минимап", "содержание", "карточка"].some(s => s.includes(q)),
    advanced: ["переменная", "контраст", "скруг"].some(s => s.includes(q)),
  }), [q]);
  const isVisible = (k: SectionKey) => !q || (matches as any)[k];

  return (
    <div className={`flex flex-col gap-4 ${className || ""}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1">Отображение</h2>
          <p className="text-[10px] text-muted-foreground">Внешний вид результата</p>
        </div>
        <div className="flex gap-1">
          <button onClick={exportSettings} className="p-2 rounded-lg hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-colors" title="Экспорт"><Download className="w-4 h-4" /></button>
          <button onClick={() => fileRef.current?.click()} className="p-2 rounded-lg hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-colors" title="Импорт"><Upload className="w-4 h-4" /></button>
          <button onClick={onReset} className="p-2 rounded-lg hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-colors" title="Сбросить"><RotateCcw className="w-4 h-4" /></button>
          <input ref={fileRef} type="file" accept=".json" onChange={importSettings} className="hidden" />
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск настройки..."
          className="w-full glass-input border border-border/50 rounded-lg pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
      </div>

      {/* Quick presets */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-2 px-0.5">Быстрые профили</p>
        <div className="grid grid-cols-2 gap-1.5">
          {PRESETS.map((preset) => (
            <button key={preset.label} onClick={() => Object.entries(preset.settings).forEach(([k, v]) => onUpdate(k as keyof DisplaySettings, v as any))}
              className="text-left text-[11px] px-2.5 py-2 rounded-lg border border-border/50 glass-card hover:bg-accent/50 hover:border-primary/30 transition-all btn-tactile">
              <span className="mr-1.5">{preset.icon}</span>{preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-2">
        {SECTIONS.map(({ key, label, icon: Icon }) => {
          if (!isVisible(key)) return null;
          const open = openSections.has(key) || !!q;
          return (
            <div key={key} className="border border-border/40 rounded-xl glass-card overflow-hidden">
              <button onClick={() => toggle(key)}
                className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-accent/30 transition-colors">
                <Icon className="w-3.5 h-3.5 text-primary/70" />
                <span className="text-xs font-medium text-foreground flex-1 text-left">{label}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
              </button>
              {open && (
                <div className="p-3 pt-1 space-y-4 border-t border-border/30">
                  {key === "theme" && currentTheme && onThemeChange && (
                    <Field label="Цветовая тема"><ThemePicker current={currentTheme} onChange={onThemeChange} /></Field>
                  )}
                  {key === "theme" && (
                    <Field label="Контраст текста">
                      <SegControl options={[{v:"muted",l:"Мягкий"},{v:"default",l:"Обычный"},{v:"high-contrast",l:"Высокий"}]} value={settings.textColor} onChange={(v) => onUpdate("textColor", v as any)} />
                    </Field>
                  )}

                  {key === "typography" && (<>
                    <Field label="Шрифт">
                      <SegControl options={[{v:"sans",l:"Sans"},{v:"serif",l:"Serif"},{v:"mono",l:"Mono"}]} value={settings.fontFamily} onChange={(v) => onUpdate("fontFamily", v as any)} />
                    </Field>
                    <Range label="Размер" value={settings.fontSize} unit="px" min={10} max={24} onChange={(v) => onUpdate("fontSize", v)} />
                    <Range label="Межстрочный" value={settings.lineHeight} step={0.1} min={1.2} max={3} fixed={1} onChange={(v) => onUpdate("lineHeight", v)} />
                    <Range label="Межбуквенный" value={settings.letterSpacing} step={0.01} min={-0.05} max={0.15} unit="em" fixed={2} onChange={(v) => onUpdate("letterSpacing", v)} />
                    <Range label="Размер заголовков" value={settings.stageHeaderSize} unit="px" min={12} max={26} onChange={(v) => onUpdate("stageHeaderSize", v)} />
                    <Toggle label="Жирные заголовки" checked={settings.boldHeaders} onChange={(v) => onUpdate("boldHeaders", v)} />
                  </>)}

                  {key === "layout" && (<>
                    <Field label="Плотность">
                      <SegControl options={[{v:"compact",l:"Компактно"},{v:"comfortable",l:"Удобно"},{v:"spacious",l:"Просторно"}]} value={settings.density} onChange={(v) => {
                        onUpdate("density", v as any);
                        if (v === "compact") { onUpdate("paragraphSpacing", 8); onUpdate("lineHeight", 1.5); }
                        if (v === "comfortable") { onUpdate("paragraphSpacing", 16); onUpdate("lineHeight", 1.8); }
                        if (v === "spacious") { onUpdate("paragraphSpacing", 24); onUpdate("lineHeight", 2.0); }
                      }} />
                    </Field>
                    <Range label="Отступ абзацев" value={settings.paragraphSpacing} unit="px" min={4} max={40} step={2} onChange={(v) => onUpdate("paragraphSpacing", v)} />
                    <Range label="Ширина текста" value={settings.maxWidth} unit="ch" min={40} max={120} step={5} onChange={(v) => onUpdate("maxWidth", v)} />
                    <Range label="Скругление углов" value={settings.cornerRadius} unit="px" min={0} max={24} onChange={(v) => onUpdate("cornerRadius", v)} />
                    <Field label="Выравнивание текста">
                      <SegControl options={[{v:"left",l:"По левому"},{v:"justify",l:"По ширине"}]} value={settings.textAlign} onChange={(v) => onUpdate("textAlign", v as any)} />
                    </Field>
                  </>)}

                  {key === "elements" && (<>
                    <Toggle label="Заголовки этапов" checked={settings.showStageHeaders} onChange={(v) => onUpdate("showStageHeaders", v)} />
                    <Toggle label="Содержание (TOC)" checked={settings.showTableOfContents} onChange={(v) => onUpdate("showTableOfContents", v)} />
                    <Toggle label="Минимап справа" checked={settings.showMinimap} onChange={(v) => onUpdate("showMinimap", v)} />
                    <Toggle label="Счётчик слов" checked={settings.showWordCount} onChange={(v) => onUpdate("showWordCount", v)} />
                    <Toggle label="Фон карточек" checked={settings.scriptBgEnabled} onChange={(v) => onUpdate("scriptBgEnabled", v)} />
                    <Toggle label="Акцент нумерации" checked={settings.numberedAccent} onChange={(v) => onUpdate("numberedAccent", v)} />
                    <Field label="Тень карточек">
                      <SegControl options={[{v:"none",l:"Нет"},{v:"soft",l:"Мягкая"},{v:"elevated",l:"Объём"}]} value={settings.cardShadow} onChange={(v) => onUpdate("cardShadow", v as any)} />
                    </Field>
                  </>)}

                  {key === "advanced" && (
                    <Toggle label="Подсветка [переменных]" checked={settings.highlightVariables} onChange={(v) => onUpdate("highlightVariables", v)} />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (<div className="flex flex-col gap-1.5"><label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{label}</label>{children}</div>);
}

function Range({ label, value, min, max, step = 1, unit = "", fixed = 0, onChange }: { label: string; value: number; min: number; max: number; step?: number; unit?: string; fixed?: number; onChange: (v: number) => void }) {
  return (
    <Field label={`${label}: ${value.toFixed(fixed)}${unit ? " " + unit : ""}`}>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-primary" />
    </Field>
  );
}

function SegControl({ options, value, onChange }: { options: { v: string; l: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-1 p-0.5 rounded-lg bg-muted/40 border border-border/40">
      {options.map(o => (
        <button key={o.v} onClick={() => onChange(o.v)}
          className={`flex-1 text-[11px] px-2 py-1.5 rounded-md transition-all ${value === o.v ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
          {o.l}
        </button>
      ))}
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between cursor-pointer text-xs text-foreground/80 py-0.5">
      <span>{label}</span>
      <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
        className={`relative w-9 h-5 rounded-full transition-colors ${checked ? "bg-primary" : "bg-border"}`}>
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-4" : ""}`} />
      </button>
    </label>
  );
}
