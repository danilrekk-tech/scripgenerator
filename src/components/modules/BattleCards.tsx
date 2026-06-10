import { useState } from "react";
import { streamScript } from "@/lib/streamChat";
import { ShieldCheck, Sparkles, Copy, Download } from "lucide-react";
import { toast } from "sonner";

export default function BattleCards({ serviceNames, className = "" }: { serviceNames: string[]; className?: string }) {
  const [service, setService] = useState(serviceNames[0] || "SEO");
  const [audience, setAudience] = useState("Малый и средний бизнес");
  const [card, setCard] = useState("");
  const [loading, setLoading] = useState(false);

  const generate = () => {
    if (loading) return; setLoading(true); setCard("");
    const prompt = `Создай Battle-Card по услуге "${service}" для целевой аудитории "${audience}".
Формат (СТРОГО ПО РАЗДЕЛАМ, каждый с заголовком ##):

## ОФФЕР
Одна строка с уникальным торговым предложением

## ПРОБЛЕМА КЛИЕНТА
3 пункта боли

## ВЫГОДЫ
4-5 ключевых выгод с цифрами где возможно

## КОМУ ИДЕАЛЬНО
3-4 признака идеального клиента

## ЦЕНА И УСЛОВИЯ
Вилка стоимости и сроки

## ТОП-3 ВОЗРАЖЕНИЯ И ОТВЕТЫ
По шаблону: "Возражение → Ответ"

## KILLER-АРГУМЕНТЫ
3 коротких аргумента-факта, которые закрывают сделку

## ВОПРОСЫ ДЛЯ КВАЛИФИКАЦИИ
3-4 вопроса

Будь конкретен, без воды.`;

    streamScript({
      config: { mode: "arguments", service, context: prompt, managerName: "", clientName: "", situation: "Battle-card", tone: "Эксперт" },
      onDelta: (c) => setCard((p) => p + c),
      onDone: () => setLoading(false),
      onError: (m) => { toast.error(m); setLoading(false); },
    });
  };

  const download = () => {
    const blob = new Blob([card], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `battle-card-${service}.md`; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className={`flex flex-col h-full overflow-hidden ${className}`}>
      <header className="px-5 py-4 border-b border-border/50 shrink-0">
        <div className="flex items-center gap-2 mb-1"><ShieldCheck className="w-4 h-4 text-primary" /><h2 className="text-base font-semibold text-foreground">Battle-cards</h2></div>
        <p className="text-xs text-muted-foreground">Одностраничник по услуге — всё для разговора в одном месте</p>
      </header>

      <div className="px-5 py-3 border-b border-border/30 grid grid-cols-1 md:grid-cols-[1fr,1fr,auto] gap-2 shrink-0">
        <select value={service} onChange={(e) => setService(e.target.value)} className="glass-input border border-border/50 rounded-lg px-3 py-2 text-sm">
          {serviceNames.map((s) => <option key={s}>{s}</option>)}
        </select>
        <input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="Целевая аудитория" className="glass-input border border-border/50 rounded-lg px-3 py-2 text-sm" />
        <button onClick={generate} disabled={loading} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium btn-tactile flex items-center justify-center gap-1.5 disabled:opacity-50"><Sparkles className="w-4 h-4" />{loading ? "..." : "Создать"}</button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 pb-[max(2rem,env(safe-area-inset-bottom))]">
        {card ? (
          <>
            <div className="flex justify-end gap-1.5 mb-3">
              <button onClick={() => { navigator.clipboard.writeText(card); toast.success("Скопировано"); }} className="text-xs px-2.5 py-1 rounded-md hover:bg-accent/50 text-muted-foreground flex items-center gap-1"><Copy className="w-3 h-3" />Копировать</button>
              <button onClick={download} className="text-xs px-2.5 py-1 rounded-md hover:bg-accent/50 text-muted-foreground flex items-center gap-1"><Download className="w-3 h-3" />Скачать .md</button>
            </div>
            <div className="glass-card border border-border/50 rounded-xl p-6">
              <pre className="whitespace-pre-wrap text-sm text-foreground font-sans leading-relaxed">{card}</pre>
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-sm text-muted-foreground">Выберите услугу и нажмите «Создать»</div>
        )}
      </div>
    </div>
  );
}
