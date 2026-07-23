import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Zap, Plus, Pencil, Trash2, RotateCcw, Check, X, Lightbulb } from "lucide-react";
import { useArmoryItems, type ArmoryItem } from "@/hooks/useArmoryItems";

interface Props {
  onSelect: (prompt: string) => void;
  isGenerating: boolean;
  className?: string;
}

export default function Armory({ onSelect, isGenerating, className }: Props) {
  const { items, add, update, remove, reset } = useArmoryItems();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [manageMode, setManageMode] = useState(false);

  const grouped = useMemo(() => {
    const g: Record<string, ArmoryItem[]> = {};
    items.forEach((i) => { (g[i.category || "Прочее"] ||= []).push(i); });
    return g;
  }, [items]);

  const buildPrompt = (item: ArmoryItem) =>
    item.principles
      ? `${item.prompt}\n\nПРИНЦИПЫ ОТРАБОТКИ (обязательно применить):\n${item.principles}`
      : item.prompt;

  return (
    <aside className={`w-full sm:w-72 shrink-0 border-l border-border/50 glass-panel p-4 flex flex-col gap-3 overflow-y-auto ${className || ""}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-foreground truncate">Арсенал</h2>
            <p className="text-[10px] text-muted-foreground truncate">Отработка возражений</p>
          </div>
        </div>
        <button
          onClick={() => setManageMode((v) => !v)}
          className={`text-[10px] px-2 py-1 rounded-lg border transition-all btn-tactile ${manageMode ? "chip-active" : "chip-inactive"}`}
          title="Редактировать"
        >
          {manageMode ? "Готово" : "Править"}
        </button>
      </div>

      {manageMode && (
        <div className="flex gap-1.5">
          <button
            onClick={() => setShowAdd((v) => !v)}
            className="flex-1 text-[11px] px-2 py-1.5 rounded-lg border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-all btn-tactile flex items-center justify-center gap-1"
          >
            <Plus className="w-3 h-3" /> Добавить
          </button>
          <button
            onClick={() => { if (confirm("Сбросить арсенал к дефолту?")) reset(); }}
            className="text-[11px] px-2 py-1.5 rounded-lg border border-border/60 text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-all btn-tactile flex items-center gap-1"
            title="Сбросить"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      )}

      {showAdd && manageMode && (
        <ArmoryEditor
          onCancel={() => setShowAdd(false)}
          onSave={(data) => { add(data); setShowAdd(false); }}
        />
      )}

      <div className="flex flex-col gap-3">
        {Object.entries(grouped).map(([cat, list]) => (
          <div key={cat} className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 px-0.5">
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{cat}</p>
              <div className="h-px flex-1 bg-border/40" />
            </div>
            <div className="flex flex-col gap-1.5">
              {list.map((item, i) =>
                editingId === item.id ? (
                  <ArmoryEditor
                    key={item.id}
                    initial={item}
                    onCancel={() => setEditingId(null)}
                    onSave={(data) => { update(item.id, data); setEditingId(null); }}
                  />
                ) : (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: i * 0.02 }}
                    className="group relative"
                  >
                    <button
                      onClick={() => !manageMode && onSelect(buildPrompt(item))}
                      disabled={isGenerating || manageMode}
                      title={item.principles || item.prompt}
                      className="w-full text-left px-3 py-2.5 rounded-xl border border-border/60 glass-card text-sm hover:bg-accent/40 hover:border-primary/30 transition-all btn-tactile disabled:opacity-90 disabled:cursor-default"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <span className="font-medium text-foreground text-xs block truncate">{item.label}</span>
                          {item.principles && (
                            <span className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5 flex items-start gap-1">
                              <Lightbulb className="w-2.5 h-2.5 mt-0.5 shrink-0 text-primary/70" />
                              {item.principles}
                            </span>
                          )}
                        </div>
                        {manageMode && (
                          <div className="flex gap-0.5 shrink-0">
                            <button
                              onClick={(e) => { e.stopPropagation(); setEditingId(item.id); }}
                              className="p-1 rounded-md hover:bg-primary/15 text-muted-foreground hover:text-primary transition-all"
                              title="Редактировать"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); if (confirm(`Удалить «${item.label}»?`)) remove(item.id); }}
                              className="p-1 rounded-md hover:bg-destructive/15 text-muted-foreground hover:text-destructive transition-all"
                              title="Удалить"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </button>
                  </motion.div>
                )
              )}
            </div>
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <div className="text-center py-8 text-xs text-muted-foreground">
          Арсенал пуст. Нажмите «Править» → «Добавить», чтобы создать первый шаблон.
        </div>
      )}
    </aside>
  );
}

function ArmoryEditor({
  initial,
  onSave,
  onCancel,
}: {
  initial?: ArmoryItem;
  onSave: (data: Omit<ArmoryItem, "id">) => void;
  onCancel: () => void;
}) {
  const [label, setLabel] = useState(initial?.label || "");
  const [category, setCategory] = useState(initial?.category || "");
  const [prompt, setPrompt] = useState(initial?.prompt || "");
  const [principles, setPrinciples] = useState(initial?.principles || "");

  const canSave = label.trim().length > 0 && prompt.trim().length > 0;

  return (
    <div className="glass-card border border-primary/30 rounded-xl p-3 flex flex-col gap-2">
      <div className="flex gap-1.5">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Название (напр. «Дорого»)"
          className="flex-1 glass-input border border-border/60 rounded-lg px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
        />
        <input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Категория"
          className="w-24 glass-input border border-border/60 rounded-lg px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
        />
      </div>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Задача для ИИ: какое возражение отработать..."
        className="w-full glass-input border border-border/60 rounded-lg px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 resize-none h-16"
      />
      <textarea
        value={principles}
        onChange={(e) => setPrinciples(e.target.value)}
        placeholder="Принципы отработки (обязательные к применению тезисы)"
        className="w-full glass-input border border-border/60 rounded-lg px-2 py-1.5 text-[11px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 resize-none h-16"
      />
      <div className="flex gap-1.5 justify-end">
        <button onClick={onCancel} className="text-[11px] px-2.5 py-1 rounded-lg border border-border/60 text-muted-foreground hover:text-foreground transition-all btn-tactile flex items-center gap-1">
          <X className="w-3 h-3" /> Отмена
        </button>
        <button
          onClick={() => canSave && onSave({ label: label.trim(), category: category.trim() || undefined, prompt: prompt.trim(), principles: principles.trim() || undefined })}
          disabled={!canSave}
          className="text-[11px] px-2.5 py-1 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-all btn-tactile disabled:opacity-40 flex items-center gap-1"
        >
          <Check className="w-3 h-3" /> Сохранить
        </button>
      </div>
    </div>
  );
}
