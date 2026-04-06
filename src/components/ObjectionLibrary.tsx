import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Plus, Search, Copy, Trash2, Loader2, Sparkles, ChevronDown, ChevronRight } from "lucide-react";
import { streamScript } from "@/lib/streamChat";
import { toast } from "sonner";

export interface ObjectionEntry {
  id: string;
  objection: string;
  responses: string[];
  category: string;
  source: "manual" | "ai" | "transcript";
}

const STORAGE_KEY = "scriptengine-objection-library";

function loadEntries(): ObjectionEntry[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}
function saveEntries(entries: ObjectionEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

const CATEGORIES = ["Цена", "Время", "Доверие", "Конкуренты", "Необходимость", "Другое"];

interface Props {
  serviceNames: string[];
  className?: string;
}

export default function ObjectionLibrary({ serviceNames, className }: Props) {
  const [entries, setEntries] = useState<ObjectionEntry[]>(loadEntries);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [service, setService] = useState(serviceNames[0] || "SEO-продвижение");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newObjection, setNewObjection] = useState("");
  const [newCategory, setNewCategory] = useState("Другое");

  const generateFromAI = useCallback(() => {
    if (isGenerating) return;
    setIsGenerating(true);
    let result = "";
    streamScript({
      config: {
        mode: "objection-library",
        service,
        context: `Сгенерируй 8 типичных возражений клиентов при продаже "${service}" с 3 вариантами ответов для каждого. Формат JSON: [{"objection":"...", "responses":["...","...","..."], "category":"одна из: Цена, Время, Доверие, Конкуренты, Необходимость, Другое"}]. Строго JSON без markdown.`,
        tone: "Уверенный эксперт",
      },
      onDelta: (chunk) => { result += chunk; },
      onDone: () => {
        setIsGenerating(false);
        try {
          const match = result.match(/\[[\s\S]*\]/);
          if (match) {
            const parsed: { objection: string; responses: string[]; category: string }[] = JSON.parse(match[0]);
            const newEntries: ObjectionEntry[] = parsed.map((p, i) => ({
              id: `ai-${Date.now()}-${i}`,
              objection: p.objection,
              responses: p.responses,
              category: CATEGORIES.includes(p.category) ? p.category : "Другое",
              source: "ai" as const,
            }));
            setEntries(prev => {
              const next = [...newEntries, ...prev];
              saveEntries(next);
              return next;
            });
            toast.success(`Добавлено ${newEntries.length} возражений`);
          }
        } catch { toast.error("Ошибка парсинга"); }
      },
      onError: (msg) => { setIsGenerating(false); toast.error(msg); },
    });
  }, [service, isGenerating]);

  const addManual = () => {
    if (!newObjection.trim()) return;
    const entry: ObjectionEntry = {
      id: `manual-${Date.now()}`,
      objection: newObjection.trim(),
      responses: [],
      category: newCategory,
      source: "manual",
    };
    setEntries(prev => { const next = [entry, ...prev]; saveEntries(next); return next; });
    setNewObjection("");
    toast.success("Возражение добавлено");
  };

  const remove = (id: string) => {
    setEntries(prev => { const next = prev.filter(e => e.id !== id); saveEntries(next); return next; });
  };

  const filtered = entries.filter(e => {
    if (filterCategory && e.category !== filterCategory) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return e.objection.toLowerCase().includes(q) || e.responses.some(r => r.toLowerCase().includes(q));
    }
    return true;
  });

  return (
    <div className={`flex flex-col h-full ${className || ""}`}>
      <div className="p-6 border-b border-border/50 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <div>
              <h2 className="text-lg font-semibold text-foreground">Библиотека возражений</h2>
              <p className="text-xs text-muted-foreground">{entries.length} возражений</p>
            </div>
          </div>
          <button onClick={generateFromAI} disabled={isGenerating} className="text-xs px-3 py-1.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 btn-tactile flex items-center gap-1.5">
            {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            AI-генерация
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          {serviceNames.map(s => (
            <button key={s} onClick={() => setService(s)} className={`text-[11px] px-2 py-1 rounded-lg border transition-all btn-tactile ${service === s ? "chip-active" : "chip-inactive"}`}>{s}</button>
          ))}
        </div>

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск по возражениям..."
            className="w-full glass-input border border-border/50 rounded-lg pl-8 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30" />
        </div>

        <div className="flex flex-wrap gap-1">
          <button onClick={() => setFilterCategory(null)} className={`text-[10px] px-2 py-1 rounded-md border btn-tactile transition-all ${!filterCategory ? "chip-active" : "chip-inactive"}`}>Все</button>
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setFilterCategory(filterCategory === c ? null : c)} className={`text-[10px] px-2 py-1 rounded-md border btn-tactile transition-all ${filterCategory === c ? "chip-active" : "chip-inactive"}`}>{c}</button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {/* Add manual */}
        <div className="glass-card border border-dashed border-border/50 rounded-xl p-3">
          <div className="flex gap-2">
            <input value={newObjection} onChange={e => setNewObjection(e.target.value)} placeholder="Новое возражение..."
              className="flex-1 glass-input border border-border/50 rounded-lg px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
              onKeyDown={e => e.key === "Enter" && addManual()} />
            <select value={newCategory} onChange={e => setNewCategory(e.target.value)} className="glass-input border border-border/50 rounded-lg px-2 py-1.5 text-xs text-foreground">
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <button onClick={addManual} disabled={!newObjection.trim()} className="px-2.5 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs disabled:opacity-50 btn-tactile">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {filtered.map(entry => (
          <motion.div key={entry.id} layout className="glass-card border border-border/50 rounded-xl overflow-hidden">
            <button onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
              className="w-full p-3 flex items-start gap-2 text-left hover:bg-accent/30 transition-colors">
              {expandedId === entry.id ? <ChevronDown className="w-3.5 h-3.5 mt-0.5 text-muted-foreground shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 mt-0.5 text-muted-foreground shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground">{entry.objection}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">{entry.category}</span>
                  <span className="text-[9px] text-muted-foreground">{entry.responses.length} ответов</span>
                  <span className="text-[9px] text-muted-foreground">• {entry.source === "ai" ? "AI" : entry.source === "transcript" ? "Транскрипт" : "Вручную"}</span>
                </div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); remove(entry.id); }} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shrink-0">
                <Trash2 className="w-3 h-3" />
              </button>
            </button>

            <AnimatePresence>
              {expandedId === entry.id && entry.responses.length > 0 && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="px-3 pb-3 space-y-1.5">
                    {entry.responses.map((r, i) => (
                      <div key={i} className="flex items-start gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/10 group">
                        <span className="text-[10px] text-primary/60 font-mono mt-0.5 shrink-0">{i + 1}.</span>
                        <span className="flex-1 text-xs text-foreground">{r}</span>
                        <button onClick={() => { navigator.clipboard.writeText(r); toast.success("Скопировано"); }}
                          className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-accent/50 text-muted-foreground transition-all shrink-0">
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}

        {filtered.length === 0 && entries.length > 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">Ничего не найдено</p>
          </div>
        )}
      </div>
    </div>
  );
}
