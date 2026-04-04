import { useState } from "react";
import { Plus, X, Tag, Copy, Trash2, Search } from "lucide-react";
import type { PhraseItem } from "@/hooks/usePhraseBank";

interface Props {
  phrases: PhraseItem[];
  onAdd: (text: string, tags: string[]) => void;
  onRemove: (id: string) => void;
  onCopy: (text: string) => void;
  className?: string;
}

export default function PhraseBank({ phrases, onAdd, onRemove, onCopy, className }: Props) {
  const [newPhrase, setNewPhrase] = useState("");
  const [newTags, setNewTags] = useState("");
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const allTags = [...new Set(phrases.flatMap((p) => p.tags))];

  const filtered = phrases.filter((p) => {
    const matchSearch = !search || p.text.toLowerCase().includes(search.toLowerCase());
    const matchTag = !selectedTag || p.tags.includes(selectedTag);
    return matchSearch && matchTag;
  });

  const handleAdd = () => {
    if (!newPhrase.trim()) return;
    const tags = newTags.split(",").map((t) => t.trim()).filter(Boolean);
    onAdd(newPhrase.trim(), tags);
    setNewPhrase("");
    setNewTags("");
  };

  return (
    <div className={`flex flex-col h-full overflow-hidden ${className || ""}`}>
      <div className="p-6 pb-4 shrink-0">
        <h2 className="text-lg font-semibold text-foreground mb-1">Банк фраз</h2>
        <p className="text-xs text-muted-foreground mb-4">Коллекция удачных формулировок</p>

        <div className="flex gap-2 mb-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск..."
              className="w-full glass-input border border-border/50 rounded-lg pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>
        </div>

        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            <button onClick={() => setSelectedTag(null)} className={`text-[10px] px-2 py-0.5 rounded-md transition-all ${!selectedTag ? "chip-active" : "chip-inactive"}`}>Все</button>
            {allTags.map((tag) => (
              <button key={tag} onClick={() => setSelectedTag(selectedTag === tag ? null : tag)} className={`text-[10px] px-2 py-0.5 rounded-md transition-all ${selectedTag === tag ? "chip-active" : "chip-inactive"}`}>
                #{tag}
              </button>
            ))}
          </div>
        )}

        <div className="glass-card border border-border/50 rounded-xl p-3 space-y-2">
          <textarea
            value={newPhrase}
            onChange={(e) => setNewPhrase(e.target.value)}
            placeholder="Новая фраза..."
            className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none resize-none h-16"
          />
          <div className="flex gap-2">
            <input
              value={newTags}
              onChange={(e) => setNewTags(e.target.value)}
              placeholder="Теги через запятую"
              className="flex-1 bg-transparent text-[11px] text-muted-foreground placeholder:text-muted-foreground/50 outline-none"
            />
            <button onClick={handleAdd} disabled={!newPhrase.trim()} className="px-3 py-1 bg-primary text-primary-foreground rounded-lg text-xs font-medium btn-tactile disabled:opacity-30">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-sm text-muted-foreground">
            {phrases.length === 0 ? "Добавьте первую фразу" : "Ничего не найдено"}
          </div>
        )}
        {filtered.map((phrase) => (
          <div key={phrase.id} className="glass-card border border-border/50 rounded-xl p-3 group">
            <p className="text-xs text-foreground mb-2">{phrase.text}</p>
            <div className="flex items-center justify-between">
              <div className="flex gap-1">
                {phrase.tags.map((tag) => (
                  <span key={tag} className="text-[9px] text-primary/70 bg-primary/10 px-1.5 py-0.5 rounded">#{tag}</span>
                ))}
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => onCopy(phrase.text)} className="p-1 rounded hover:bg-accent/50 text-muted-foreground"><Copy className="w-3 h-3" /></button>
                <button onClick={() => onRemove(phrase.id)} className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive"><Trash2 className="w-3 h-3" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
