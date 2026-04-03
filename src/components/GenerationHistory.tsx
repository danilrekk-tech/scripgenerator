import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { History, Trash2, Clock, ChevronDown, ChevronUp, Copy, X, Search, Tag } from "lucide-react";
import type { HistoryItem } from "@/hooks/useHistory";

const MODE_LABELS: Record<string, string> = {
  script: "Скрипт", "service-info": "Инфо по услуге", arguments: "Аргументы",
  "buffer-questions": "Вопросы", "transcript-analysis": "Анализ", email: "Письмо",
  "knowledge-base": "База знаний", dozim: "Дожим", messenger: "Мессенджер",
  "touch-chain": "Цепочка", funnel: "Воронка", "anti-script": "Антискрипт",
  utp: "УТП", sms: "SMS", voicemail: "Автоответчик", "social-posts": "Посты",
  "crm-template": "CRM", checklist: "Чек-лист", glossary: "Глоссарий",
};

interface Props {
  history: HistoryItem[];
  onLoad: (content: string) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
  className?: string;
}

export default function GenerationHistory({ history, onLoad, onDelete, onClear, className }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterMode, setFilterMode] = useState<string | null>(null);

  const modes = useMemo(() => {
    const set = new Set(history.map(h => h.mode));
    return Array.from(set);
  }, [history]);

  const filtered = useMemo(() => {
    let items = history;
    if (filterMode) items = items.filter(h => h.mode === filterMode);
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(h => h.label.toLowerCase().includes(q) || h.service.toLowerCase().includes(q) || h.content.toLowerCase().includes(q));
    }
    return items;
  }, [history, filterMode, search]);

  if (history.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center h-full p-8 ${className || ""}`}>
        <History className="w-12 h-12 text-muted-foreground/30 mb-4" />
        <p className="text-sm text-muted-foreground">История генераций пуста</p>
        <p className="text-xs text-muted-foreground mt-1">Сгенерированные результаты будут сохраняться здесь</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className || ""}`}>
      <div className="p-6 border-b border-border/50 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <History className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">История генераций</h2>
            </div>
            <p className="text-xs text-muted-foreground">{filtered.length} из {history.length} записей</p>
          </div>
          <button onClick={onClear}
            className="text-xs px-3 py-1.5 rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10 transition-all btn-tactile flex items-center gap-1.5">
            <Trash2 className="w-3 h-3" /> Очистить
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full glass-input border border-border/50 rounded-lg pl-8 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
            placeholder="Поиск по истории..." />
        </div>

        {/* Mode filter */}
        {modes.length > 1 && (
          <div className="flex flex-wrap gap-1">
            <button onClick={() => setFilterMode(null)}
              className={`text-[10px] px-2 py-1 rounded-md border btn-tactile transition-all ${!filterMode ? "chip-active" : "chip-inactive"}`}>
              Все
            </button>
            {modes.map(m => (
              <button key={m} onClick={() => setFilterMode(filterMode === m ? null : m)}
                className={`text-[10px] px-2 py-1 rounded-md border btn-tactile transition-all ${filterMode === m ? "chip-active" : "chip-inactive"}`}>
                {MODE_LABELS[m] || m}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filtered.map((item) => (
          <motion.div key={item.id} layout className="border border-border/50 rounded-xl glass-card overflow-hidden">
            <button onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
              className="w-full p-3 flex items-center gap-3 text-left hover:bg-accent/30 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 font-medium">
                    {MODE_LABELS[item.mode] || item.mode}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-secondary text-secondary-foreground border border-border">
                    {item.service}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{item.label}</p>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3" />
                  {new Date(item.timestamp).toLocaleString("ru-RU")}
                </p>
              </div>
              {expandedId === item.id ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
            </button>

            <AnimatePresence>
              {expandedId === item.id && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="px-3 pb-3 space-y-2">
                    <div className="bg-secondary/30 border border-border/30 rounded-lg p-3 text-xs text-foreground whitespace-pre-wrap max-h-60 overflow-y-auto">
                      {item.content.slice(0, 2000)}
                      {item.content.length > 2000 && "..."}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => onLoad(item.content)}
                        className="flex-1 text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 btn-tactile">
                        Загрузить
                      </button>
                      <button onClick={() => navigator.clipboard.writeText(item.content)}
                        className="text-xs px-3 py-1.5 rounded-lg border border-border/50 glass-card text-foreground hover:bg-accent/50 btn-tactile flex items-center gap-1">
                        <Copy className="w-3 h-3" />
                      </button>
                      <button onClick={() => onDelete(item.id)}
                        className="text-xs px-3 py-1.5 rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10 btn-tactile flex items-center gap-1">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
