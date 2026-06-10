import { useState } from "react";
import { useLocalStore } from "@/lib/moduleStore";
import { streamScript } from "@/lib/streamChat";
import { GitCompare, Sparkles, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Row { criterion: string; us: string; comp1: string; comp2: string; }
interface Matrix { service: string; competitor1: string; competitor2: string; rows: Row[]; }

const DEFAULT: Matrix = {
  service: "SEO-продвижение", competitor1: "Конкурент A", competitor2: "Конкурент B",
  rows: [
    { criterion: "Срок до первых результатов", us: "2 месяца", comp1: "3-4 месяца", comp2: "6 месяцев" },
    { criterion: "Прозрачность отчётов",       us: "Live-дашборд",  comp1: "PDF ежемесячно", comp2: "По запросу" },
    { criterion: "Гарантии",                   us: "По KPI трафика", comp1: "Нет",            comp2: "Условные" },
  ],
};

export default function CompetitorMatrix({ serviceNames, className = "" }: { serviceNames: string[]; className?: string }) {
  const [matrix, setMatrix] = useLocalStore<Matrix>("scriptengine-competitor-matrix", DEFAULT);
  const [loading, setLoading] = useState(false);

  const updateRow = (i: number, field: keyof Row, v: string) =>
    setMatrix({ ...matrix, rows: matrix.rows.map((r, idx) => idx === i ? { ...r, [field]: v } : r) });
  const addRow = () => setMatrix({ ...matrix, rows: [...matrix.rows, { criterion: "", us: "", comp1: "", comp2: "" }] });
  const removeRow = (i: number) => setMatrix({ ...matrix, rows: matrix.rows.filter((_, idx) => idx !== i) });

  const aiFill = () => {
    if (loading) return; setLoading(true);
    const prompt = `Заполни сравнительную таблицу: наша услуга "${matrix.service}" против двух конкурентов "${matrix.competitor1}" и "${matrix.competitor2}". Верни СТРОГО JSON-массив объектов вида {"criterion":"...","us":"...","comp1":"...","comp2":"..."}. Минимум 6 критериев: сроки, цена, гарантии, отчётность, экспертиза, кейсы, поддержка. Без markdown.`;
    let buf = "";
    streamScript({
      config: { mode: "arguments", service: matrix.service, context: prompt, managerName: "", clientName: "", situation: "Сравнение конкурентов", tone: "Эксперт" },
      onDelta: (c) => { buf += c; },
      onDone: () => {
        try {
          const match = buf.match(/\[[\s\S]*\]/);
          if (match) { const parsed = JSON.parse(match[0]); if (Array.isArray(parsed)) { setMatrix({ ...matrix, rows: parsed }); toast.success("Таблица обновлена"); } }
        } catch { toast.error("Не удалось распарсить ответ"); }
        setLoading(false);
      },
      onError: (m) => { toast.error(m); setLoading(false); },
    });
  };

  return (
    <div className={`flex flex-col h-full overflow-hidden ${className}`}>
      <header className="px-5 py-4 border-b border-border/50 shrink-0">
        <div className="flex items-center gap-2 mb-1"><GitCompare className="w-4 h-4 text-primary" /><h2 className="text-base font-semibold text-foreground">Сравнение конкурентов</h2></div>
        <p className="text-xs text-muted-foreground">Таблица «мы vs они» с AI-заполнением</p>
      </header>

      <div className="px-5 py-3 border-b border-border/30 grid grid-cols-1 md:grid-cols-3 gap-2 shrink-0">
        <select value={matrix.service} onChange={(e) => setMatrix({ ...matrix, service: e.target.value })} className="glass-input border border-border/50 rounded-lg px-3 py-2 text-sm">
          {serviceNames.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <input value={matrix.competitor1} onChange={(e) => setMatrix({ ...matrix, competitor1: e.target.value })} className="glass-input border border-border/50 rounded-lg px-3 py-2 text-sm" />
        <input value={matrix.competitor2} onChange={(e) => setMatrix({ ...matrix, competitor2: e.target.value })} className="glass-input border border-border/50 rounded-lg px-3 py-2 text-sm" />
      </div>

      <div className="flex-1 overflow-auto p-5">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border/50">
            <th className="text-left p-2 text-xs uppercase tracking-wider text-muted-foreground font-medium">Критерий</th>
            <th className="text-left p-2 text-xs uppercase tracking-wider text-primary font-medium">Мы</th>
            <th className="text-left p-2 text-xs uppercase tracking-wider text-muted-foreground font-medium">{matrix.competitor1}</th>
            <th className="text-left p-2 text-xs uppercase tracking-wider text-muted-foreground font-medium">{matrix.competitor2}</th>
            <th></th>
          </tr></thead>
          <tbody>
            {matrix.rows.map((r, i) => (
              <tr key={i} className="border-b border-border/30 group">
                <td className="p-1"><input value={r.criterion} onChange={(e) => updateRow(i, "criterion", e.target.value)} className="w-full bg-transparent text-foreground text-xs px-2 py-1.5 rounded hover:bg-accent/30 focus:bg-accent/30 outline-none" /></td>
                <td className="p-1"><input value={r.us} onChange={(e) => updateRow(i, "us", e.target.value)} className="w-full bg-transparent text-foreground text-xs px-2 py-1.5 rounded hover:bg-accent/30 focus:bg-accent/30 outline-none font-medium" /></td>
                <td className="p-1"><input value={r.comp1} onChange={(e) => updateRow(i, "comp1", e.target.value)} className="w-full bg-transparent text-muted-foreground text-xs px-2 py-1.5 rounded hover:bg-accent/30 focus:bg-accent/30 outline-none" /></td>
                <td className="p-1"><input value={r.comp2} onChange={(e) => updateRow(i, "comp2", e.target.value)} className="w-full bg-transparent text-muted-foreground text-xs px-2 py-1.5 rounded hover:bg-accent/30 focus:bg-accent/30 outline-none" /></td>
                <td className="p-1"><button onClick={() => removeRow(i)} className="opacity-0 group-hover:opacity-100 p-1 text-destructive"><Trash2 className="w-3 h-3" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex gap-2 mt-4">
          <button onClick={addRow} className="text-xs px-3 py-1.5 rounded-lg border border-border/50 text-muted-foreground hover:text-foreground btn-tactile flex items-center gap-1"><Plus className="w-3 h-3" />Строка</button>
          <button onClick={aiFill} disabled={loading} className="text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground btn-tactile flex items-center gap-1 disabled:opacity-50"><Sparkles className="w-3 h-3" />{loading ? "Генерация..." : "AI-заполнение"}</button>
        </div>
      </div>
    </div>
  );
}
