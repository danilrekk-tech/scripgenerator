import { useState } from "react";
import BlueprintHero from "@/components/BlueprintHero";
import { motion } from "framer-motion";
import { Mic, Loader2, Copy, RotateCcw, Sparkles } from "lucide-react";
import { streamScript } from "@/lib/streamChat";
interface Props {
  serviceNames: string[];
  className?: string;
}

const EXAMPLE = `Менеджер: Добрый день, [Имя клиента], это [Имя менеджера] из агентства SEO-X.
Клиент: Слушаю.
Менеджер: Хотел рассказать про SEO для вашего интернет-магазина.
Клиент: Мы уже работаем с подрядчиком, спасибо.
Менеджер: А давайте я вам всё-таки пришлю КП?
Клиент: Не надо. Всего доброго.`;

export default function CallAnalyzer({ serviceNames, className }: Props) {
  const [transcript, setTranscript] = useState("");
  const [service, setService] = useState(serviceNames[0] || "SEO-продвижение");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!transcript.trim() || loading) return;
    setLoading(true);
    setOutput("");
    await streamScript({
      config: {
        mode: "transcript-analysis",
        service, situation: "", tone: "", context: "",
        transcript, priceRub: "", currency: "RUB",
        emailSubtype: "", emailObjection: "", managerName: "", clientName: "",
        transcriptSubmode: "next-call",
      },
      onDelta: (t) => setOutput((p) => p + t),
      onDone: () => setLoading(false),
      onError: (m) => { setOutput(m); setLoading(false); },
    });
  };

  return (
    <div className={`flex flex-col h-full min-h-0 overflow-hidden ${className || ""}`}>
      <div className="p-4 border-b border-border/50 shrink-0 flex items-center gap-2">
        <Mic className="w-5 h-5 text-primary" />
        <h2 className="text-sm font-semibold flex-1">AI-Аналитик звонков</h2>
        {output && (
          <>
            <button onClick={() => navigator.clipboard.writeText(output)} className="p-2 rounded-lg hover:bg-accent/50 text-muted-foreground hover:text-foreground" title="Копировать"><Copy className="w-4 h-4" /></button>
            <button onClick={() => { setOutput(""); setTranscript(""); }} className="p-2 rounded-lg hover:bg-accent/50 text-muted-foreground hover:text-foreground" title="Сбросить"><RotateCcw className="w-4 h-4" /></button>
          </>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 space-y-4 pb-[max(2rem,env(safe-area-inset-bottom))]" style={{ WebkitOverflowScrolling: "touch" }}>
        <div className="relative rounded-2xl overflow-hidden border border-primary/20">
          <BlueprintHero variant="call-analyzer" className="w-full h-32" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          <div className="absolute bottom-2 left-3 right-3">
            <p className="text-xs font-medium text-foreground">Загрузите расшифровку звонка</p>
            <p className="text-[10px] text-muted-foreground">ИИ найдёт ошибки, упущения и предложит идеальный сценарий</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {serviceNames.map((s) => (
            <button key={s} onClick={() => setService(s)} className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all btn-tactile ${service === s ? "chip-active" : "chip-inactive"}`}>{s}</button>
          ))}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Транскрипт</label>
            <button onClick={() => setTranscript(EXAMPLE)} className="text-[10px] text-primary hover:underline flex items-center gap-1"><Sparkles className="w-3 h-3" /> Пример</button>
          </div>
          <textarea value={transcript} onChange={(e) => setTranscript(e.target.value)} placeholder="Менеджер: Добрый день...&#10;Клиент: Слушаю..." rows={8}
            className="w-full glass-input border border-border/50 rounded-xl px-3 py-2.5 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30" />
        </div>

        <button onClick={run} disabled={loading || !transcript.trim()} className="w-full bg-primary text-primary-foreground font-medium py-3 rounded-xl btn-tactile shadow-glow hover:opacity-90 disabled:opacity-50 text-sm flex items-center justify-center gap-2">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Анализируем...</> : <>🔍 Разобрать звонок</>}
        </button>

        {output && (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="glass-card border border-border/50 rounded-xl p-4">
            <div className="text-xs whitespace-pre-wrap text-foreground script-content">{output}</div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
