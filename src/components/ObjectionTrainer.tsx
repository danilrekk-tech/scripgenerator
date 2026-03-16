import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, RefreshCw, Loader2, Copy, ChevronDown } from "lucide-react";

interface Props {
  className?: string;
}

const SERVICES = [
  "SEO-продвижение",
  "AI-оптимизация (LLM/Answer Engines)",
  "Оптимизация под Нейропоиск",
  "Наполнение контентом",
  "Техническая оптимизация",
  "Комплексное продвижение",
  "Юридические правки (ФЗ-152/ФЗ-168)",
];

const DIFFICULTY = [
  { value: "easy", label: "Лёгкие", desc: "Базовые возражения" },
  { value: "medium", label: "Средние", desc: "Типичные возражения" },
  { value: "hard", label: "Сложные", desc: "Нестандартные кейсы" },
];

const OBJECTION_COUNT = [3, 5, 8, 10];

export default function ObjectionTrainer({ className }: Props) {
  const [service, setService] = useState("SEO-продвижение");
  const [difficulty, setDifficulty] = useState("medium");
  const [count, setCount] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [objections, setObjections] = useState("");
  const [showAnswer, setShowAnswer] = useState<Record<number, boolean>>({});

  const generate = useCallback(async () => {
    setIsGenerating(true);
    setObjections("");
    setShowAnswer({});

    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-script`;
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          mode: "objection-training",
          service,
          difficulty,
          count: count.toString(),
          situation: "",
          tone: "",
          context: "",
          transcript: "",
          priceRub: "",
          currency: "RUB",
          emailSubtype: "",
          emailObjection: "",
          managerName: "",
          clientName: "",
        }),
      });

      if (!resp.ok || !resp.body) throw new Error("Ошибка генерации");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) setObjections((prev) => prev + content);
          } catch {}
        }
      }
    } catch {
      setObjections("Ошибка генерации. Попробуйте ещё раз.");
    } finally {
      setIsGenerating(false);
    }
  }, [service, difficulty, count]);

  return (
    <div className={`flex flex-col h-full overflow-y-auto ${className || ""}`}>
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-2 mb-1">
          <Zap className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Генератор возражений</h2>
          <span className="text-[10px] uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">BETA</span>
        </div>
        <p className="text-xs text-muted-foreground">Тренируйте отработку возражений с автоматически сгенерированными кейсами</p>
      </div>

      <div className="p-6 space-y-4">
        <Field label="Услуга">
          <div className="flex flex-wrap gap-1.5">
            {SERVICES.map((s) => (
              <button
                key={s}
                onClick={() => setService(s)}
                className={`text-xs px-2.5 py-1.5 rounded-sm border transition-all duration-200 btn-tactile ${
                  service === s
                    ? "bg-primary/15 text-primary border-primary/30"
                    : "bg-secondary border-border text-secondary-foreground hover:border-primary/20"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Сложность">
          <div className="flex gap-2">
            {DIFFICULTY.map((d) => (
              <button
                key={d.value}
                onClick={() => setDifficulty(d.value)}
                className={`flex-1 text-xs px-3 py-2 rounded-md border transition-all duration-200 btn-tactile text-center ${
                  difficulty === d.value
                    ? "bg-primary/15 text-primary border-primary/30"
                    : "bg-secondary border-border text-secondary-foreground hover:border-primary/20"
                }`}
              >
                <span className="block font-medium">{d.label}</span>
                <span className="block text-[10px] text-muted-foreground">{d.desc}</span>
              </button>
            ))}
          </div>
        </Field>

        <Field label="Количество">
          <div className="flex gap-2">
            {OBJECTION_COUNT.map((n) => (
              <button
                key={n}
                onClick={() => setCount(n)}
                className={`text-xs px-3 py-1.5 rounded-sm border transition-all duration-200 btn-tactile ${
                  count === n
                    ? "bg-primary/15 text-primary border-primary/30"
                    : "bg-secondary border-border text-secondary-foreground hover:border-primary/20"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </Field>

        <button
          onClick={generate}
          disabled={isGenerating}
          className="w-full bg-primary text-primary-foreground font-medium py-3 rounded-md transition-all duration-200 btn-tactile shadow-glow hover:opacity-90 disabled:opacity-50 text-sm tracking-wide flex items-center justify-center gap-2"
        >
          {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {isGenerating ? "Генерация..." : "Сгенерировать возражения"}
        </button>

        <AnimatePresence>
          {objections && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 space-y-2"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Результат</h3>
                <button
                  onClick={() => navigator.clipboard.writeText(objections)}
                  className="text-xs px-2 py-1 rounded-sm border border-border bg-secondary text-secondary-foreground hover:border-primary/20 btn-tactile flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  Копировать
                </button>
              </div>
              <div className="bg-secondary/50 border border-border rounded-md p-4 text-sm text-foreground whitespace-pre-wrap">
                {objections}
                {isGenerating && <span className="cursor-blink" />}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}
