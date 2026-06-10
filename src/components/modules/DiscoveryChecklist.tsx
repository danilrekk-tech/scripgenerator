import { useState } from "react";
import { useLocalStore } from "@/lib/moduleStore";
import { ListChecks, RotateCcw, Copy } from "lucide-react";
import { toast } from "sonner";

const SPIN = {
  S: { label: "Situation — Ситуация", items: ["Какой у вас сейчас источник трафика?", "Сколько лидов в месяц приходит с сайта?", "Кто сейчас занимается продвижением — внутри или подрядчик?", "Какие инструменты аналитики используете (Метрика, GA4)?"] },
  P: { label: "Problem — Проблема",   items: ["Что не устраивает в текущих результатах?", "Где, на ваш взгляд, главное узкое место?", "Были ли неудачные попытки решить эту задачу?", "Что произошло после последней оптимизации?"] },
  I: { label: "Implication — Импликация", items: ["Сколько денег это стоит компании в месяц?", "Как это влияет на отдел продаж?", "Что будет, если ничего не менять ещё полгода?", "Как это сказывается на ваших KPI?"] },
  N: { label: "Need-Payoff — Выгода", items: ["Если бы лидов стало в 2 раза больше, как бы это повлияло на план?", "Что для вас будет означать рост позиций в топ-10?", "Как изменится ваша работа, если автоматизировать этот процесс?"] },
};
const BANT = {
  B: { label: "Budget — Бюджет",       items: ["Какой бюджет планируете на продвижение?", "Это новый бюджет или перераспределяете?", "Кто согласовывает суммы свыше X?"] },
  A: { label: "Authority — ЛПР",       items: ["Кто ещё участвует в решении?", "С кем нам имеет смысл говорить дальше?", "Какие критерии выбора у вашего руководителя?"] },
  N: { label: "Need — Потребность",    items: ["Зачем именно сейчас этим занимаетесь?", "Что должно произойти, чтобы вы сказали \"да\"?", "На какой результат рассчитываете через 3/6/12 мес?"] },
  T: { label: "Timing — Сроки",        items: ["Когда хотите запустить работы?", "Есть ли дедлайны или сезонность?", "Что мешает стартовать прямо сейчас?"] },
};

type Method = "SPIN" | "BANT";

export default function DiscoveryChecklist({ className = "" }: { className?: string }) {
  const [method, setMethod] = useState<Method>("SPIN");
  const [checked, setChecked] = useLocalStore<Record<string, boolean>>("scriptengine-discovery-checked", {});
  const [notes, setNotes] = useLocalStore<Record<string, string>>("scriptengine-discovery-notes", {});

  const data = method === "SPIN" ? SPIN : BANT;

  const toggle = (key: string) => setChecked({ ...checked, [key]: !checked[key] });
  const setNote = (key: string, v: string) => setNotes({ ...notes, [key]: v });
  const resetAll = () => { setChecked({}); setNotes({}); toast.success("Чек-лист очищен"); };

  const exportSummary = () => {
    let out = `Discovery (${method}) — ${new Date().toLocaleDateString("ru-RU")}\n\n`;
    Object.entries(data).forEach(([k, block]) => {
      out += `## ${block.label}\n`;
      block.items.forEach((q, i) => {
        const key = `${method}-${k}-${i}`;
        out += `- [${checked[key] ? "x" : " "}] ${q}\n`;
        if (notes[key]) out += `      → ${notes[key]}\n`;
      });
      out += "\n";
    });
    navigator.clipboard.writeText(out); toast.success("Сводка скопирована");
  };

  const total = Object.values(data).reduce((a, b) => a + b.items.length, 0);
  const done = Object.keys(checked).filter((k) => k.startsWith(method) && checked[k]).length;

  return (
    <div className={`flex flex-col h-full overflow-hidden ${className}`}>
      <header className="px-5 py-4 border-b border-border/50 shrink-0">
        <div className="flex items-center gap-2 mb-1"><ListChecks className="w-4 h-4 text-primary" /><h2 className="text-base font-semibold text-foreground">Discovery-чеклист</h2></div>
        <p className="text-xs text-muted-foreground">Структурированные вопросы для квалификации клиента</p>
      </header>

      <div className="px-5 py-3 border-b border-border/30 shrink-0 flex items-center justify-between gap-3 flex-wrap">
        <div className="inline-flex glass-card border border-border/50 rounded-lg p-0.5">
          {(["SPIN", "BANT"] as const).map((m) => (
            <button key={m} onClick={() => setMethod(m)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${method === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>{m}</button>
          ))}
        </div>
        <div className="text-xs text-muted-foreground">{done}/{total} отвечено</div>
        <div className="flex gap-1.5">
          <button onClick={exportSummary} className="text-xs px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 btn-tactile flex items-center gap-1"><Copy className="w-3 h-3" />Сводка</button>
          <button onClick={resetAll} className="text-xs px-3 py-1.5 rounded-lg border border-border/50 text-muted-foreground hover:text-foreground btn-tactile flex items-center gap-1"><RotateCcw className="w-3 h-3" />Сброс</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {Object.entries(data).map(([k, block]) => (
          <div key={k} className="glass-card border border-border/50 rounded-xl p-4">
            <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">{block.label}</p>
            <div className="space-y-3">
              {block.items.map((q, i) => {
                const key = `${method}-${k}-${i}`;
                return (
                  <div key={i}>
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input type="checkbox" checked={!!checked[key]} onChange={() => toggle(key)} className="mt-1 accent-primary" />
                      <span className={`text-sm leading-snug ${checked[key] ? "text-muted-foreground line-through" : "text-foreground"}`}>{q}</span>
                    </label>
                    <input value={notes[key] || ""} onChange={(e) => setNote(key, e.target.value)} placeholder="Ответ клиента / заметка" className="mt-1.5 ml-6 w-[calc(100%-1.5rem)] glass-input border border-border/40 rounded-md px-2 py-1 text-xs" />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
