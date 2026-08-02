import { Eye, X, FileText, Sparkles, Globe, History as HistoryIcon, Zap, Palette, Users, Package, PenLine } from "lucide-react";
import { useMemo, useState } from "react";
import type { ContextSection } from "@/lib/contextBuilder";

const ICONS: Record<ContextSection["source"], typeof FileText> = {
  service: Package,
  scenario: FileText,
  templates: Sparkles,
  backstory: HistoryIcon,
  site: Globe,
  armory: Zap,
  style: Palette,
  persona: Users,
  user: PenLine,
};

interface Props {
  sections: ContextSection[];
  onClose: () => void;
  onGenerate: () => void;
  isGenerating?: boolean;
}

export default function ContextPreview({ sections, onClose, onGenerate, isGenerating }: Props) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const chars = useMemo(() => sections.reduce((a, s) => a + s.title.length + s.body.length, 0), [sections]);

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-6">
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-2xl max-h-[90dvh] flex flex-col glass-panel border border-border/60 rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40 shrink-0">
          <Eye className="w-4 h-4 text-primary" />
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground">Предпросмотр контекста</h3>
            <p className="text-[11px] text-muted-foreground">
              {sections.length} блок(ов) · ~{chars.toLocaleString("ru-RU")} символов уйдёт в модель
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent/50 transition-colors" aria-label="Закрыть">
            <X className="w-4 h-4 text-foreground" />
          </button>
        </div>

        <div
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 space-y-2"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {sections.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8">
              Дополнительный контекст пуст — генерация пойдёт только по базовым параметрам.
            </p>
          )}
          {sections.map((s) => {
            const Icon = ICONS[s.source];
            const isOpen = !collapsed.has(s.key);
            return (
              <div key={s.key} className="rounded-xl border border-border/40 glass-card overflow-hidden">
                <button
                  onClick={() =>
                    setCollapsed((prev) => {
                      const next = new Set(prev);
                      if (next.has(s.key)) next.delete(s.key);
                      else next.add(s.key);
                      return next;
                    })
                  }
                  className="w-full flex items-center gap-2 px-3 py-2 bg-accent/10 text-left"
                >
                  <Icon className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground flex-1 truncate">
                    {s.title}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{isOpen ? "свернуть" : `${s.body.length} симв.`}</span>
                </button>
                {isOpen && (
                  <pre className="px-3 py-2 text-[11px] leading-relaxed text-foreground/90 whitespace-pre-wrap break-words border-t border-border/30 font-sans">
                    {s.body}
                  </pre>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex gap-2 p-3 border-t border-border/40 shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button onClick={onClose} className="flex-1 text-xs py-2.5 rounded-xl border border-border/50 text-foreground hover:bg-accent/40 transition-all btn-tactile">
            Изменить параметры
          </button>
          <button
            onClick={() => { onClose(); onGenerate(); }}
            disabled={isGenerating}
            className="flex-1 text-xs py-2.5 rounded-xl bg-primary text-primary-foreground font-medium shadow-glow hover:opacity-90 disabled:opacity-50 transition-all btn-tactile"
          >
            Запустить генерацию
          </button>
        </div>
      </div>
    </div>
  );
}
