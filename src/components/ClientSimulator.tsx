import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Send, Loader2, RotateCcw, Settings2 } from "lucide-react";

interface Message {
  role: "user" | "client";
  content: string;
}

interface SimConfig {
  service: string;
  clientType: string;
  mood: string;
  budget: string;
  objectionLevel: string;
}

const CLIENT_TYPES = ["Директор малого бизнеса", "Маркетолог", "IT-директор", "Владелец e-commerce", "Стартапер"];
const MOODS = ["Заинтересованный", "Скептичный", "Раздражённый", "Торопится", "Вежливый но холодный"];
const BUDGETS = ["Нет бюджета", "Ограниченный", "Средний", "Готов платить"];
const OBJECTION_LEVELS = ["Низкий", "Средний", "Высокий", "Максимальный"];

interface Props {
  serviceNames: string[];
  className?: string;
}

export default function ClientSimulator({ serviceNames, className }: Props) {
  const [config, setConfig] = useState<SimConfig>({
    service: serviceNames[0] || "SEO-продвижение",
    clientType: "Директор малого бизнеса",
    mood: "Скептичный",
    budget: "Ограниченный",
    objectionLevel: "Средний",
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showConfig, setShowConfig] = useState(true);
  const [started, setStarted] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(async (userMsg: string) => {
    if (!userMsg.trim() || isLoading) return;

    const newMessages: Message[] = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-script`;
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          mode: "client-simulation",
          service: config.service,
          situation: "", tone: "",
          context: JSON.stringify({
            clientType: config.clientType,
            mood: config.mood,
            budget: config.budget,
            objectionLevel: config.objectionLevel,
            history: newMessages.map((m) => `${m.role === "user" ? "Менеджер" : "Клиент"}: ${m.content}`).join("\n"),
          }),
          transcript: "", priceRub: "", currency: "RUB",
          emailSubtype: "", emailObjection: "", managerName: "", clientName: "",
        }),
      });

      if (!resp.ok || !resp.body) throw new Error("Ошибка");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let clientMsg = "";

      setMessages((prev) => [...prev, { role: "client", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              clientMsg += content;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: "client", content: clientMsg };
                return updated;
              });
            }
          } catch {}
        }
      }
    } catch {
      setMessages((prev) => [...prev, { role: "client", content: "Ошибка соединения. Попробуйте ещё раз." }]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, config]);

  const startSimulation = () => {
    setStarted(true);
    setShowConfig(false);
    setMessages([]);
    sendMessage("Добрый день!");
  };

  const resetSimulation = () => {
    setStarted(false);
    setShowConfig(true);
    setMessages([]);
    setInput("");
  };

  return (
    <div className={`flex flex-col h-full ${className || ""}`}>
      <div className="p-6 border-b border-border shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <MessageCircle className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Симулятор клиента</h2>
              <span className="text-[10px] uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">BETA</span>
            </div>
            <p className="text-xs text-muted-foreground">Тренируйте навыки продаж в диалоге с AI-клиентом</p>
          </div>
          {started && (
            <div className="flex gap-2">
              <button onClick={() => setShowConfig(!showConfig)} className="p-2 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                <Settings2 className="w-4 h-4" />
              </button>
              <button onClick={resetSimulation} className="p-2 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showConfig && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-b border-border">
            <div className="p-6 space-y-3">
              <Field label="Услуга">
                <div className="flex flex-wrap gap-1.5">
                  {serviceNames.map((s) => (
                    <Chip key={s} active={config.service === s} onClick={() => setConfig({ ...config, service: s })}>{s}</Chip>
                  ))}
                </div>
              </Field>
              <Field label="Тип клиента">
                <div className="flex flex-wrap gap-1.5">
                  {CLIENT_TYPES.map((ct) => (
                    <Chip key={ct} active={config.clientType === ct} onClick={() => setConfig({ ...config, clientType: ct })}>{ct}</Chip>
                  ))}
                </div>
              </Field>
              <Field label="Настроение">
                <div className="flex flex-wrap gap-1.5">
                  {MOODS.map((m) => (
                    <Chip key={m} active={config.mood === m} onClick={() => setConfig({ ...config, mood: m })}>{m}</Chip>
                  ))}
                </div>
              </Field>
              <Field label="Бюджет">
                <div className="flex flex-wrap gap-1.5">
                  {BUDGETS.map((b) => (
                    <Chip key={b} active={config.budget === b} onClick={() => setConfig({ ...config, budget: b })}>{b}</Chip>
                  ))}
                </div>
              </Field>
              <Field label="Уровень возражений">
                <div className="flex flex-wrap gap-1.5">
                  {OBJECTION_LEVELS.map((o) => (
                    <Chip key={o} active={config.objectionLevel === o} onClick={() => setConfig({ ...config, objectionLevel: o })}>{o}</Chip>
                  ))}
                </div>
              </Field>
              {!started && (
                <button onClick={startSimulation} className="w-full bg-primary text-primary-foreground font-medium py-3 rounded-md transition-all duration-200 btn-tactile shadow-glow hover:opacity-90 text-sm tracking-wide">
                  🎭 Начать симуляцию
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {started && (
        <>
          <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] px-4 py-2.5 rounded-lg text-sm ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-none"
                    : "bg-secondary text-secondary-foreground border border-border rounded-bl-none"
                }`}>
                  <p className="text-[10px] font-medium mb-1 opacity-60">
                    {msg.role === "user" ? "Вы (менеджер)" : `Клиент (${config.clientType})`}
                  </p>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  {msg.role === "client" && isLoading && i === messages.length - 1 && <span className="cursor-blink" />}
                </div>
              </motion.div>
            ))}
          </div>

          <div className="p-4 border-t border-border shrink-0">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
                placeholder="Введите ваш ответ клиенту..."
                disabled={isLoading}
                className="flex-1 bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all duration-200"
              />
              <button onClick={() => sendMessage(input)} disabled={isLoading || !input.trim()} className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50 transition-all btn-tactile">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`text-xs px-2.5 py-1.5 rounded-sm border transition-all duration-200 btn-tactile ${
      active ? "bg-primary/15 text-primary border-primary/30" : "bg-secondary border-border text-secondary-foreground hover:border-primary/20"
    }`}>{children}</button>
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
