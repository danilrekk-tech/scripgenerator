import { useState, useEffect, useMemo, useRef } from "react";
import { Search, FileText, Globe, Brain, MessageCircle, Zap, BookOpen, Timer, BarChart3, Columns2, Package, History, Star, Settings, X } from "lucide-react";

interface CommandItem {
  id: string;
  label: string;
  desc?: string;
  icon: React.ReactNode;
  action: () => void;
  category: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  items: CommandItem[];
}

export default function CommandPalette({ open, onClose, items }: Props) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        if (open) onClose();
        else onClose(); // toggle handled externally
      }
      if (e.key === "Escape" && open) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter((i) => i.label.toLowerCase().includes(q) || i.desc?.toLowerCase().includes(q) || i.category.toLowerCase().includes(q));
  }, [items, query]);

  const grouped = useMemo(() => {
    const map = new Map<string, CommandItem[]>();
    filtered.forEach((item) => {
      if (!map.has(item.category)) map.set(item.category, []);
      map.get(item.category)!.push(item);
    });
    return map;
  }, [filtered]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]" onClick={onClose}>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg mx-4 glass-card border border-border/50 rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border/30">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск команд..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
          <kbd className="hidden sm:inline-flex text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">ESC</kbd>
        </div>
        <div className="max-h-[50vh] overflow-y-auto p-2">
          {filtered.length === 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground">Ничего не найдено</div>
          )}
          {Array.from(grouped.entries()).map(([category, items]) => (
            <div key={category}>
              <div className="px-3 py-1.5 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">{category}</div>
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { item.action(); onClose(); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-accent/50 transition-colors text-left group"
                >
                  <div className="text-muted-foreground group-hover:text-primary transition-colors">{item.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-foreground truncate">{item.label}</div>
                    {item.desc && <div className="text-[11px] text-muted-foreground truncate">{item.desc}</div>}
                  </div>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
