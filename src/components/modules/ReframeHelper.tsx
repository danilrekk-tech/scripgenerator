import { useState } from "react";
import { streamScript } from "@/lib/streamChat";
import { Sparkles, Copy, ArrowRight } from "lucide-react";
import { toast } from "sonner";

const STYLES = [
  { id: "stronger",   label: "Сильнее",     hint: "более уверенно и весомо" },
  { id: "shorter",    label: "Короче",      hint: "сжато, без воды" },
  { id: "friendly",   label: "Дружелюбнее", hint: "тепло, по-человечески" },
  { id: "expert",     label: "Экспертнее",  hint: "профессиональная подача" },
  { id: "client-lang", label: "На языке клиента", hint: "просто, без терминов" },
];

export default function ReframeHelper({ className = "" }: { className?: string }) {
  const [input, setInput] = useState("Мы можем сделать SEO, это поможет вашему сайту.");
  const [style, setStyle] = useState(STYLES[0].id);
  const [out, setOut] = useState("");
  const [loading, setLoading] = useState(false);

  const rewrite = () => {
    if (!input.trim() || loading) return;
    setLoading(true); setOut("");
    const selectedStyle = STYLES.find((s) => s.id === style)!;
    const prompt = `Перефразируй фразу 3 разными способами в стиле "${selectedStyle.label}" (${selectedStyle.hint}).
ИСХОДНАЯ ФРАЗА: "${input}"

Верни строго 3 варианта, пронумерованных 1., 2., 3., без вступлений и комментариев. Каждый вариант — одна-две связные фразы, сохраняй смысл.`;

    streamScript({
      config: { mode: "arguments", service: "—", context: prompt, managerName: "", clientName: "", situation: "Reframe", tone: "Эксперт" },
      onDelta: (c) => setOut((p) => p + c),
      onDone: () => setLoading(false),
      onError: (m) => { toast.error(m); setLoading(false); },
    });
  };

  return (
    <div className={`flex flex-col h-full overflow-hidden ${className}`}>
      <header className="px-5 py-4 border-b border-border/50 shrink-0">
        <div className="flex items-center gap-2 mb-1"><Sparkles className="w-4 h-4 text-primary" /><h2 className="text-base font-semibold text-foreground">Reframe-помощник</h2></div>
        <p className="text-xs text-muted-foreground">Переформулируйте фразу в нужном стиле за секунды</p>
      </header>

      <div className="flex-1 overflow-y-auto p-5 space-y-4 pb-[max(2rem,env(safe-area-inset-bottom))]">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Исходная фраза</label>
          <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={3} className="w-full glass-input border border-border/50 rounded-lg px-3 py-2 text-sm" />
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Стиль переформулировки</label>
          <div className="flex flex-wrap gap-1.5">
            {STYLES.map((s) => (
              <button key={s.id} onClick={() => setStyle(s.id)} className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${style === s.id ? "bg-primary text-primary-foreground border-primary" : "border-border/50 text-muted-foreground hover:text-foreground"}`}>{s.label}</button>
            ))}
          </div>
        </div>

        <button onClick={rewrite} disabled={loading || !input.trim()} className="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium btn-tactile flex items-center justify-center gap-2 disabled:opacity-50">
          <ArrowRight className="w-4 h-4" />{loading ? "Генерация..." : "Переформулировать"}
        </button>

        {out && (
          <div className="glass-card border border-border/50 rounded-xl p-4">
            <pre className="whitespace-pre-wrap text-sm text-foreground font-sans leading-relaxed">{out}</pre>
            <button onClick={() => { navigator.clipboard.writeText(out); toast.success("Скопировано"); }} className="mt-3 text-xs px-2 py-1 rounded-md hover:bg-accent/50 text-muted-foreground flex items-center gap-1"><Copy className="w-3 h-3" />Копировать всё</button>
          </div>
        )}
      </div>
    </div>
  );
}
