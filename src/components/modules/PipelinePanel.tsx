import { useState, useMemo } from "react";
import { useLocalStore, uid } from "@/lib/moduleStore";
import { Plus, Trash2, ChevronLeft, ChevronRight, Briefcase, TrendingUp } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

type Stage = "new" | "brief" | "kp" | "negotiation" | "won" | "lost";
const STAGES: { id: Stage; label: string; color: string }[] = [
  { id: "new",         label: "Новый",       color: "from-sky-500/20 to-sky-500/5" },
  { id: "brief",       label: "Бриф",        color: "from-indigo-500/20 to-indigo-500/5" },
  { id: "kp",          label: "КП",          color: "from-violet-500/20 to-violet-500/5" },
  { id: "negotiation", label: "Переговоры",  color: "from-amber-500/20 to-amber-500/5" },
  { id: "won",         label: "Закрыто +",   color: "from-emerald-500/20 to-emerald-500/5" },
  { id: "lost",        label: "Закрыто −",   color: "from-rose-500/20 to-rose-500/5" },
];

interface Deal { id: string; title: string; company: string; amount: string; stage: Stage; note?: string; created: number; }

const SAMPLE: Deal[] = [
  { id: uid(), title: "SEO для интернет-магазина", company: "ТД Северный", amount: "120 000 ₽", stage: "kp", created: Date.now() },
  { id: uid(), title: "Аудит + ФЗ-152",          company: "MedClinic",   amount: "45 000 ₽",  stage: "brief", created: Date.now() },
  { id: uid(), title: "AI-оптимизация",          company: "B2B Logistics", amount: "210 000 ₽", stage: "negotiation", created: Date.now() },
];

export default function PipelinePanel({ className = "" }: { className?: string }) {
  const [deals, setDeals] = useLocalStore<Deal[]>("scriptengine-pipeline", SAMPLE);
  const [draft, setDraft] = useState({ title: "", company: "", amount: "" });

  const addDeal = () => {
    if (!draft.title.trim()) return;
    setDeals([{ id: uid(), title: draft.title, company: draft.company, amount: draft.amount, stage: "new", created: Date.now() }, ...deals]);
    setDraft({ title: "", company: "", amount: "" });
  };
  const move = (id: string, dir: 1 | -1) => setDeals(deals.map((d) => {
    if (d.id !== id) return d;
    const idx = STAGES.findIndex((s) => s.id === d.stage);
    const next = STAGES[Math.max(0, Math.min(STAGES.length - 1, idx + dir))];
    return { ...d, stage: next.id };
  }));
  const remove = (id: string) => setDeals(deals.filter((d) => d.id !== id));

  const stats = useMemo(() => {
    const parseAmount = (s: string) => parseInt(s.replace(/\D/g, "")) || 0;
    const active = deals.filter((d) => d.stage !== "won" && d.stage !== "lost");
    const won = deals.filter((d) => d.stage === "won");
    return {
      activeCount: active.length,
      activeAmount: active.reduce((sum, d) => sum + parseAmount(d.amount), 0),
      wonAmount: won.reduce((sum, d) => sum + parseAmount(d.amount), 0),
      conversion: deals.length ? Math.round((won.length / deals.length) * 100) : 0,
    };
  }, [deals]);

  return (
    <div className={`flex flex-col h-full overflow-hidden ${className}`}>
      <header className="px-5 py-4 border-b border-border/50 shrink-0">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1"><Briefcase className="w-4 h-4 text-primary" /><h2 className="text-base font-semibold text-foreground">Воронка сделок</h2></div>
            <p className="text-xs text-muted-foreground">Простой канбан — двигайте карточки стрелками</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div><span className="text-muted-foreground">В работе:</span> <span className="font-semibold text-foreground tabular-nums">{stats.activeCount}</span></div>
            <div><span className="text-muted-foreground">Σ активные:</span> <span className="font-semibold text-primary tabular-nums">{stats.activeAmount.toLocaleString("ru-RU")} ₽</span></div>
            <div className="hidden sm:flex items-center gap-1"><TrendingUp className="w-3 h-3 text-emerald-500" /><span className="font-semibold text-emerald-500 tabular-nums">{stats.conversion}%</span></div>
          </div>
        </div>
      </header>

      <div className="px-5 py-3 border-b border-border/30 grid grid-cols-1 md:grid-cols-[1fr,1fr,140px,auto] gap-2 shrink-0">
        <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Что продаём" className="glass-input border border-border/50 rounded-lg px-3 py-2 text-sm" />
        <input value={draft.company} onChange={(e) => setDraft({ ...draft, company: e.target.value })} placeholder="Компания" className="glass-input border border-border/50 rounded-lg px-3 py-2 text-sm" />
        <input value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: e.target.value })} placeholder="Сумма ₽" className="glass-input border border-border/50 rounded-lg px-3 py-2 text-sm" />
        <button onClick={addDeal} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium btn-tactile flex items-center justify-center gap-1.5"><Plus className="w-4 h-4" />Добавить</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {deals.length === 0 ? (
          <EmptyState
            icon={<Briefcase className="w-7 h-7" />}
            title="Пока нет сделок"
            description="Добавьте первую сделку выше — карточки можно двигать между этапами и отслеживать конверсию."
          />
        ) : (
          <div className="overflow-x-auto -mx-1 px-1">
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 min-w-[900px] lg:min-w-0">
              {STAGES.map((stage) => {
                const items = deals.filter((d) => d.stage === stage.id);
                return (
                  <div key={stage.id} className={`rounded-xl border border-border/40 bg-gradient-to-b ${stage.color} p-2 min-h-[200px]`}>
                    <div className="flex items-center justify-between px-1 mb-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground/80">{stage.label}</p>
                      <span className="text-[10px] text-muted-foreground bg-background/40 px-1.5 rounded-full tabular-nums">{items.length}</span>
                    </div>
                    <div className="space-y-2">
                      {items.length === 0 && <p className="text-[10px] text-muted-foreground/60 text-center py-3">пусто</p>}
                      {items.map((d) => (
                        <div key={d.id} className="glass-card border border-border/50 rounded-lg p-2.5">
                          <p className="text-xs font-medium text-foreground leading-snug">{d.title}</p>
                          {d.company && <p className="text-[10px] text-muted-foreground mt-0.5">{d.company}</p>}
                          {d.amount && <p className="text-[10px] font-semibold text-primary mt-1">{d.amount}</p>}
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/30">
                            <div className="flex gap-0.5">
                              <button onClick={() => move(d.id, -1)} className="p-1 rounded hover:bg-accent/60 text-muted-foreground hover:text-foreground transition-colors" title="Назад"><ChevronLeft className="w-3.5 h-3.5" /></button>
                              <button onClick={() => move(d.id, 1)} className="p-1 rounded hover:bg-accent/60 text-muted-foreground hover:text-foreground transition-colors" title="Вперёд"><ChevronRight className="w-3.5 h-3.5" /></button>
                            </div>
                            <button onClick={() => remove(d.id)} className="p-1 rounded hover:bg-destructive/10 text-destructive transition-colors" title="Удалить"><Trash2 className="w-3 h-3" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
