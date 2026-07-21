import { useState } from "react";
import { Plus, Trash2, X, RotateCcw, ShoppingBag } from "lucide-react";
import { useUpsells, type Upsell } from "@/hooks/useUpsells";

interface Props {
  onClose: () => void;
  serviceNames?: string[];
}

export default function UpsellManager({ onClose, serviceNames = [] }: Props) {
  const { items, add, update, remove, reset } = useUpsells();
  const [draft, setDraft] = useState<Omit<Upsell, "id">>({ name: "", price: "", description: "", bestFor: "", service: "" });

  const submit = () => {
    if (!draft.name.trim() || !draft.description.trim()) return;
    add(draft);
    setDraft({ name: "", price: "", description: "", bestFor: "", service: "" });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-background/80 backdrop-blur-sm p-0 md:p-6" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
        className="w-full md:max-w-2xl h-[92dvh] md:h-auto md:max-h-[85dvh] flex flex-col glass-panel border border-border/60 md:rounded-2xl rounded-t-2xl overflow-hidden">
        <header className="flex items-center justify-between px-5 py-4 border-b border-border/40 shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary" />
            <div>
              <h2 className="text-base font-semibold">Допродажи</h2>
              <p className="text-[11px] text-muted-foreground">Что предлагать сверху основной услуги</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={reset} title="Сбросить к дефолту" className="p-2 rounded-lg hover:bg-accent/50 text-muted-foreground"><RotateCcw className="w-4 h-4" /></button>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-accent/50 text-muted-foreground"><X className="w-4 h-4" /></button>
          </div>
        </header>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 py-4 space-y-4 pb-[max(1rem,env(safe-area-inset-bottom))]" style={{ WebkitOverflowScrolling: "touch" }}>
          {/* Add new */}
          <div className="glass-card border border-border/50 rounded-xl p-3 space-y-2">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Новая допродажа</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Название" className="glass-input border border-border/50 rounded-lg px-3 py-2 text-sm" />
              <input value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} placeholder="Цена (например, от 15 000 ₽)" className="glass-input border border-border/50 rounded-lg px-3 py-2 text-sm" />
            </div>
            <textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="Что входит, ценность для клиента" rows={2} className="w-full glass-input border border-border/50 rounded-lg px-3 py-2 text-sm" />
            <input value={draft.bestFor} onChange={(e) => setDraft({ ...draft, bestFor: e.target.value })} placeholder="Когда предлагать (триггер)" className="w-full glass-input border border-border/50 rounded-lg px-3 py-2 text-sm" />
            {serviceNames.length > 0 && (
              <select value={draft.service || ""} onChange={(e) => setDraft({ ...draft, service: e.target.value })} className="w-full glass-input border border-border/50 rounded-lg px-3 py-2 text-sm">
                <option value="">К любой услуге</option>
                {serviceNames.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            )}
            <button onClick={submit} disabled={!draft.name.trim() || !draft.description.trim()} className="w-full px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium btn-tactile disabled:opacity-50 flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /> Добавить
            </button>
          </div>

          {/* List */}
          <div className="space-y-2">
            {items.length === 0 && <p className="text-center text-xs text-muted-foreground py-6">Пока пусто</p>}
            {items.map((u) => (
              <div key={u.id} className="glass-card border border-border/50 rounded-xl p-3 group">
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <input value={u.name} onChange={(e) => update(u.id, { name: e.target.value })} className="bg-transparent text-sm font-semibold text-foreground border-b border-transparent focus:border-primary/40 outline-none flex-1 min-w-[120px]" />
                      {u.price && <span className="text-[11px] text-primary font-mono">{u.price}</span>}
                    </div>
                    <textarea value={u.description} onChange={(e) => update(u.id, { description: e.target.value })} rows={2} className="w-full bg-transparent text-xs text-muted-foreground resize-none focus:text-foreground outline-none" />
                    {u.bestFor && <p className="text-[10px] text-muted-foreground italic">🎯 {u.bestFor}</p>}
                    {u.service && <span className="inline-block text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary">{u.service}</span>}
                  </div>
                  <button onClick={() => remove(u.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
