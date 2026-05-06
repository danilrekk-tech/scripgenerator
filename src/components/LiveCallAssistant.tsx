import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Headphones, Send, Loader2, RotateCcw, Volume2, Zap } from "lucide-react";
import { streamScript } from "@/lib/streamChat";
import { toast } from "sonner";
import { QUICK_CLIENT_LINES } from "@/lib/toolPresets";
import heroSuflyor from "@/assets/hero-suflyor.jpg";

interface Props {
  serviceNames: string[];
  className?: string;
}

export default function LiveCallAssistant({ serviceNames, className }: Props) {
  const [service, setService] = useState(serviceNames[0] || "SEO-продвижение");
  const [clientSaid, setClientSaid] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState<{ client: string; response: string }[]>([]);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const getSuggestion = useCallback(() => {
    if (!clientSaid.trim() || isGenerating) return;
    setIsGenerating(true);
    setSuggestion("");

    const historyContext = history.slice(-5).map(h => `Клиент: ${h.client}\nМенеджер: ${h.response}`).join("\n\n");

    streamScript({
      config: {
        mode: "live-call",
        service,
        context: `${historyContext ? `ИСТОРИЯ РАЗГОВОРА:\n${historyContext}\n\n` : ""}КЛИЕНТ СЕЙЧАС ГОВОРИТ: "${clientSaid.trim()}"`,
        tone: "Уверенный эксперт",
        situation: "Живой звонок",
      },
      onDelta: (chunk) => setSuggestion(prev => prev + chunk),
      onDone: () => {
        setIsGenerating(false);
        setHistory(prev => [...prev, { client: clientSaid.trim(), response: "" }]);
      },
      onError: (msg) => { setIsGenerating(false); toast.error(msg); },
    });
  }, [clientSaid, isGenerating, service, history]);

  const reset = () => {
    setHistory([]);
    setSuggestion("");
    setClientSaid("");
  };

  const copyAndClear = () => {
    if (suggestion) {
      navigator.clipboard.writeText(suggestion);
      toast.success("Скопировано");
      // Update last history entry with response
      setHistory(prev => {
        const next = [...prev];
        if (next.length > 0) next[next.length - 1].response = suggestion;
        return next;
      });
    }
    setSuggestion("");
    setClientSaid("");
    inputRef.current?.focus();
  };

  return (
    <div className={`flex flex-col h-full ${className || ""}`}>
      {/* Compact header */}
      <div className="p-4 border-b border-border/50 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-destructive/10 flex items-center justify-center">
              <Headphones className="w-4 h-4 text-destructive" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Суфлёр</h2>
              <p className="text-[10px] text-muted-foreground">Подсказки во время звонка</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
            <span className="text-[10px] text-destructive font-medium uppercase tracking-wider">Live</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {serviceNames.map(s => (
            <button key={s} onClick={() => setService(s)} className={`text-[11px] px-2 py-1 rounded-lg border transition-all btn-tactile ${service === s ? "chip-active" : "chip-inactive"}`}>{s}</button>
          ))}
        </div>
      </div>

      {/* Response area */}
      <div className="flex-1 overflow-y-auto p-4">
        {suggestion ? (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <div className="glass-card border border-primary/20 rounded-xl p-4">
              <p className="text-[10px] uppercase tracking-widest text-primary mb-2 flex items-center gap-1.5">
                <Volume2 className="w-3 h-3" /> Скажите:
              </p>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{suggestion}</p>
              {isGenerating && <span className="cursor-blink" />}
            </div>
            {!isGenerating && (
              <button onClick={copyAndClear} className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-medium hover:opacity-90 btn-tactile">
                Копировать и продолжить →
              </button>
            )}
          </motion.div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Mic className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Введите что говорит клиент</p>
              <p className="text-xs text-muted-foreground mt-1">AI мгновенно подскажет ответ</p>
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="p-4 border-t border-border/50 shrink-0">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={clientSaid}
            onChange={(e) => setClientSaid(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); getSuggestion(); } }}
            placeholder="Что говорит клиент..."
            className="flex-1 glass-input border border-border/50 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none h-[44px]"
          />
          <button onClick={getSuggestion} disabled={!clientSaid.trim() || isGenerating} className="px-3 py-2.5 bg-primary text-primary-foreground rounded-xl hover:opacity-90 disabled:opacity-50 btn-tactile shrink-0">
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
          <button onClick={reset} className="px-3 py-2.5 border border-border/50 glass-card rounded-xl text-muted-foreground hover:text-foreground btn-tactile shrink-0" title="Начать заново">
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
        {history.length > 0 && (
          <p className="text-[10px] text-muted-foreground mt-2">Реплик в контексте: {history.length}</p>
        )}
      </div>
    </div>
  );
}
