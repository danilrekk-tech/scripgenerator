import type { DisplaySettings } from "@/hooks/useDisplaySettings";
import { FONT_FAMILIES } from "@/hooks/useDisplaySettings";
import { RotateCcw } from "lucide-react";

interface Props {
  settings: DisplaySettings;
  onUpdate: <K extends keyof DisplaySettings>(key: K, value: DisplaySettings[K]) => void;
  onReset: () => void;
  className?: string;
}

export default function DisplaySettingsPanel({ settings, onUpdate, onReset, className }: Props) {
  return (
    <div className={`flex flex-col gap-5 ${className || ""}`}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1">
            Настройки отображения
          </h2>
          <p className="text-[10px] text-muted-foreground">Настрой внешний вид результата</p>
        </div>
        <button
          onClick={onReset}
          className="p-2 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          title="Сбросить настройки"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Font family */}
      <Field label="Шрифт">
        <div className="flex gap-1.5">
          {(Object.keys(FONT_FAMILIES) as Array<DisplaySettings["fontFamily"]>).map((f) => (
            <button
              key={f}
              onClick={() => onUpdate("fontFamily", f)}
              className={`text-xs px-3 py-1.5 rounded-sm border transition-all duration-200 btn-tactile ${
                settings.fontFamily === f
                  ? "bg-primary/15 text-primary border-primary/30"
                  : "bg-secondary border-border text-secondary-foreground hover:border-primary/20"
              }`}
            >
              {f === "mono" ? "Моно" : f === "sans" ? "Без засечек" : "С засечками"}
            </button>
          ))}
        </div>
      </Field>

      {/* Font size */}
      <Field label={`Размер шрифта: ${settings.fontSize}px`}>
        <input
          type="range"
          min={10}
          max={24}
          step={1}
          value={settings.fontSize}
          onChange={(e) => onUpdate("fontSize", Number(e.target.value))}
          className="w-full accent-primary"
        />
      </Field>

      {/* Line height */}
      <Field label={`Межстрочный интервал: ${settings.lineHeight.toFixed(1)}`}>
        <input
          type="range"
          min={1.2}
          max={3}
          step={0.1}
          value={settings.lineHeight}
          onChange={(e) => onUpdate("lineHeight", Number(e.target.value))}
          className="w-full accent-primary"
        />
      </Field>

      {/* Letter spacing */}
      <Field label={`Межбуквенный интервал: ${settings.letterSpacing.toFixed(2)}em`}>
        <input
          type="range"
          min={-0.05}
          max={0.15}
          step={0.01}
          value={settings.letterSpacing}
          onChange={(e) => onUpdate("letterSpacing", Number(e.target.value))}
          className="w-full accent-primary"
        />
      </Field>

      {/* Paragraph spacing */}
      <Field label={`Отступ между абзацами: ${settings.paragraphSpacing}px`}>
        <input
          type="range"
          min={4}
          max={40}
          step={2}
          value={settings.paragraphSpacing}
          onChange={(e) => onUpdate("paragraphSpacing", Number(e.target.value))}
          className="w-full accent-primary"
        />
      </Field>

      {/* Max width */}
      <Field label={`Ширина текста: ${settings.maxWidth}ch`}>
        <input
          type="range"
          min={40}
          max={120}
          step={5}
          value={settings.maxWidth}
          onChange={(e) => onUpdate("maxWidth", Number(e.target.value))}
          className="w-full accent-primary"
        />
      </Field>

      {/* Stage header size */}
      <Field label={`Размер заголовков этапов: ${settings.stageHeaderSize}px`}>
        <input
          type="range"
          min={12}
          max={24}
          step={1}
          value={settings.stageHeaderSize}
          onChange={(e) => onUpdate("stageHeaderSize", Number(e.target.value))}
          className="w-full accent-primary"
        />
      </Field>

      {/* Toggles */}
      <Field label="Переключатели">
        <div className="flex flex-col gap-2">
          <Toggle
            label="Показывать заголовки этапов"
            checked={settings.showStageHeaders}
            onChange={(v) => onUpdate("showStageHeaders", v)}
          />
          <Toggle
            label="Фон для блоков скрипта"
            checked={settings.scriptBgEnabled}
            onChange={(v) => onUpdate("scriptBgEnabled", v)}
          />
          <Toggle
            label="Подсвечивать переменные [...]"
            checked={settings.highlightVariables}
            onChange={(v) => onUpdate("highlightVariables", v)}
          />
        </div>
      </Field>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </label>
      {children}
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer text-xs text-secondary-foreground">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-8 h-4 rounded-full transition-colors ${
          checked ? "bg-primary" : "bg-border"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-primary-foreground transition-transform ${
            checked ? "translate-x-4" : ""
          }`}
        />
      </button>
      {label}
    </label>
  );
}
