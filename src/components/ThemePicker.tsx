import { type Theme, THEMES } from "@/hooks/useTheme";

interface Props {
  current: Theme;
  onChange: (theme: Theme) => void;
}

export default function ThemePicker({ current, onChange }: Props) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {THEMES.map((t) => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all duration-200 text-xs btn-tactile ${
            current === t.value
              ? "chip-active font-medium"
              : "chip-inactive"
          }`}
        >
          <div className="flex gap-0.5 shrink-0">
            {t.colors.map((c, i) => (
              <div key={i} className="w-2.5 h-2.5 rounded-full border border-border/30" style={{ backgroundColor: c }} />
            ))}
          </div>
          <span className="truncate">{t.label}</span>
        </button>
      ))}
    </div>
  );
}
