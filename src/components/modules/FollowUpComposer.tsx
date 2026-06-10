import { useState } from "react";
import { streamScript } from "@/lib/streamChat";
import { Send, Copy, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function FollowUpComposer({ serviceNames, className = "" }: { serviceNames: string[]; className?: string }) {
  const [service, setService] = useState(serviceNames[0] || "SEO");
  const [channel, setChannel] = useState<"email" | "telegram">("email");
  const [steps, setSteps] = useState(4);
  const [context, setContext] = useState("Клиент: e-commerce. Обсуждали SEO, попросил подумать. Возражение — нет уверенности в окупаемости.");
  const [out, setOut] = useState("");
  const [loading, setLoading] = useState(false);

  const generate = () => {
    if (loading) return; setLoading(true); setOut("");
    const channelLabel = channel === "email" ? "email-цепочка" : "Telegram-сообщения";
    const prompt = `Сгенерируй ${channelLabel} из ${steps} касаний после звонка по услуге "${service}".
КОНТЕКСТ РАЗГОВОРА: ${context}

Для каждого касания укажи:
- Номер и день отправки (Д+1, Д+3, Д+7, Д+14...)
- Тема письма (только для email)
- Цель касания одной фразой
- Полный текст сообщения (короткий, дружелюбный, без воды, ${channel === "telegram" ? "до 4 строк" : "до 8 строк"})
- Один CTA в конце

Используй [Имя клиента] и [Имя менеджера]. Раздели касания горизонтальной чертой ---.`;

    streamScript({
      config: { mode: "arguments", service, context: prompt, managerName: "", clientName: "", situation: "Follow-up", tone: "Дружелюбный эксперт" },
      onDelta: (c) => setOut((p) => p + c),
      onDone: () => setLoading(false),
      onError: (m) => { toast.error(m); setLoading(false); },
    });
  };

  return (
    <div className={`flex flex-col h-full overflow-hidden ${className}`}>
      <header className="px-5 py-4 border-b border-border/50 shrink-0">
        <div className="flex items-center gap-2 mb-1"><Send className="w-4 h-4 text-primary" /><h2 className="text-base font-semibold text-foreground">Follow-up серии</h2></div>
        <p className="text-xs text-muted-foreground">Цепочка касаний после звонка — Email или Telegram</p>
      </header>

      <div className="px-5 py-3 border-b border-border/30 space-y-2 shrink-0">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <select value={service} onChange={(e) => setService(e.target.value)} className="glass-input border border-border/50 rounded-lg px-3 py-2 text-sm">
            {serviceNames.map((s) => <option key={s}>{s}</option>)}
          </select>
          <div className="inline-flex glass-card border border-border/50 rounded-lg p-0.5">
            {(["email", "telegram"] as const).map((c) => (
              <button key={c} onClick={() => setChannel(c)} className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition ${channel === c ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>{c === "email" ? "Email" : "Telegram"}</button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground">Касаний:</label>
            <input type="number" min={2} max={7} value={steps} onChange={(e) => setSteps(parseInt(e.target.value) || 3)} className="flex-1 glass-input border border-border/50 rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>
        <textarea value={context} onChange={(e) => setContext(e.target.value)} rows={2} placeholder="Контекст разговора, возражения, договорённости..." className="w-full glass-input border border-border/50 rounded-lg px-3 py-2 text-sm" />
        <button onClick={generate} disabled={loading} className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium btn-tactile flex items-center justify-center gap-2 disabled:opacity-50">
          <Sparkles className="w-4 h-4" />{loading ? "Генерация..." : "Сгенерировать цепочку"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 pb-[max(2rem,env(safe-area-inset-bottom))]">
        {out ? (
          <div className="glass-card border border-border/50 rounded-xl p-5">
            <div className="flex justify-end mb-2">
              <button onClick={() => { navigator.clipboard.writeText(out); toast.success("Скопировано"); }} className="text-xs px-2 py-1 rounded-md hover:bg-accent/50 text-muted-foreground flex items-center gap-1"><Copy className="w-3 h-3" />Копировать</button>
            </div>
            <pre className="whitespace-pre-wrap text-sm text-foreground font-sans leading-relaxed">{out}</pre>
          </div>
        ) : (
          <div className="text-center py-12 text-sm text-muted-foreground">Заполните контекст и нажмите «Сгенерировать»</div>
        )}
      </div>
    </div>
  );
}
