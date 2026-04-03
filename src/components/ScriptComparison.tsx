import { useState } from "react";
import { Columns2, ArrowLeftRight } from "lucide-react";
import type { HistoryItem } from "@/hooks/useHistory";
import type { FavoriteItem } from "@/hooks/useFavorites";

interface Props {
  history: HistoryItem[];
  favorites: FavoriteItem[];
  className?: string;
}

export default function ScriptComparison({ history, favorites, className }: Props) {
  const [leftId, setLeftId] = useState("");
  const [rightId, setRightId] = useState("");
  
  const allItems = [
    ...history.map(h => ({ id: h.id, label: `${h.service} — ${h.label?.slice(0, 40)}`, content: h.content, source: "history" })),
    ...favorites.map(f => ({ id: `fav-${f.id}`, label: `★ ${f.service} — ${f.label?.slice(0, 40)}`, content: f.content, source: "favorites" })),
  ];

  const leftContent = allItems.find(i => i.id === leftId)?.content || "";
  const rightContent = allItems.find(i => i.id === rightId)?.content || "";

  return (
    <div className={`flex flex-col h-full ${className || ""}`}>
      <div className="p-6 border-b border-border/50 shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <Columns2 className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Сравнение скриптов</h2>
        </div>
        <p className="text-xs text-muted-foreground">Выберите два скрипта для сравнения side-by-side</p>
      </div>

      {allItems.length < 2 ? (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <Columns2 className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Нужно минимум 2 скрипта в истории или избранном</p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 p-4 border-b border-border/30 shrink-0">
            <select value={leftId} onChange={(e) => setLeftId(e.target.value)}
              className="flex-1 glass-input border border-border/50 rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30">
              <option value="">Выберите скрипт A</option>
              {allItems.map(i => <option key={i.id} value={i.id}>{i.label}</option>)}
            </select>
            <ArrowLeftRight className="w-4 h-4 text-muted-foreground shrink-0" />
            <select value={rightId} onChange={(e) => setRightId(e.target.value)}
              className="flex-1 glass-input border border-border/50 rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30">
              <option value="">Выберите скрипт B</option>
              {allItems.map(i => <option key={i.id} value={i.id}>{i.label}</option>)}
            </select>
          </div>

          <div className="flex-1 flex min-h-0">
            <div className="flex-1 overflow-y-auto p-4 border-r border-border/30">
              {leftContent ? (
                <div className="text-xs text-foreground whitespace-pre-wrap">{leftContent}</div>
              ) : (
                <p className="text-xs text-muted-foreground text-center mt-8">Выберите скрипт A</p>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {rightContent ? (
                <div className="text-xs text-foreground whitespace-pre-wrap">{rightContent}</div>
              ) : (
                <p className="text-xs text-muted-foreground text-center mt-8">Выберите скрипт B</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
