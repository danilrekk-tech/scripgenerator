import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle, Send, Loader2, RotateCcw, Settings2, Save, FolderOpen,
  Trash2, Clock, GraduationCap, Lightbulb, Trophy, BarChart3,
  Zap, Shield, Wrench, X, ChevronRight, Sparkles
} from "lucide-react";
import { useSavedDialogs, type SavedDialog } from "@/hooks/useSavedDialogs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { SIMULATOR_SCENARIO_PRESETS, TRAINER_TIPS_EXTENDED } from "@/lib/toolPresets";
import heroSimulator from "@/assets/hero-simulator.jpg";

interface Message {
  role: "user" | "client";
  content: string;
  score?: number;
  feedback?: string;
}

interface SimConfig {
  service: string;
  clientType: string;
  mood: string;
  budget: string;
  objectionLevel: string;
}

type SimMode = "free" | "trainer";

const CLIENT_TYPES = ["Директор малого бизнеса", "Маркетолог", "IT-директор", "Владелец e-commerce", "Стартапер"];
const MOODS = ["Заинтересованный", "Скептичный", "Раздражённый", "Торопится", "Вежливый но холодный"];
const BUDGETS = ["Нет бюджета", "Ограниченный", "Средний", "Готов платить"];
const OBJECTION_LEVELS = ["Низкий", "Средний", "Высокий", "Максимальный"];

const TRAINER_TIPS = TRAINER_TIPS_EXTENDED;

interface Props {
  serviceNames: string[];
  className?: string;
  onOpenTool?: (tool: string) => void;
}

export default function ClientSimulator({ serviceNames, className, onOpenTool }: Props) {
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
  const [showSaved, setShowSaved] = useState(false);
  const [simMode, setSimMode] = useState<SimMode>("free");
  const [showHint, setShowHint] = useState(false);
  const [currentHint, setCurrentHint] = useState("");
  const [sessionScore, setSessionScore] = useState(0);
  const [scoreCount, setScoreCount] = useState(0);
  const [showTools, setShowTools] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const { dialogs, saveDialog, deleteDialog } = useSavedDialogs();

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const getHint = useCallback(() => {
    const tip = TRAINER_TIPS[Math.floor(Math.random() * TRAINER_TIPS.length)];
    setCurrentHint(tip);
    setShowHint(true);
  }, []);

  const sendMessage = useCallback(async (userMsg: string) => {
    if (!userMsg.trim() || isLoading) return;
    const newMessages: Message[] = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);
    setShowHint(false);

    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-script`;
      const isTrainer = simMode === "trainer";

      const contextPayload = JSON.stringify({
        clientType: config.clientType,
        mood: config.mood,
        budget: config.budget,
        objectionLevel: config.objectionLevel,
        history: newMessages.map((m) => `${m.role === "user" ? "Менеджер" : "Клиент"}: ${m.content}`).join("\n"),
        ...(isTrainer && {
          trainerMode: true,
          instruction: "После ответа клиента, добавь блок ОЦЕНКА в формате:\n[SCORE:X/10]\n[FEEDBACK:текст]\nОцени ответ менеджера: технику продаж, работу с возражениями, выявление потребностей."
        }),
      });

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
          context: contextPayload,
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

      // Parse trainer score from response
      if (isTrainer) {
        const scoreMatch = clientMsg.match(/\[SCORE:(\d+)\/10\]/);
        const feedbackMatch = clientMsg.match(/\[FEEDBACK:(.*?)\]/s);
        if (scoreMatch) {
          const s = parseInt(scoreMatch[1]);
          setSessionScore(prev => prev + s);
          setScoreCount(prev => prev + 1);
          const cleanContent = clientMsg.replace(/\[SCORE:\d+\/10\]/, "").replace(/\[FEEDBACK:.*?\]/s, "").trim();
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              role: "client",
              content: cleanContent,
              score: s,
              feedback: feedbackMatch?.[1]?.trim() || undefined
            };
            return updated;
          });
        }
      }
    } catch {
      setMessages((prev) => [...prev, { role: "client", content: "Ошибка соединения. Попробуйте ещё раз." }]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, config, simMode]);

  const startSimulation = () => {
    setStarted(true);
    setShowConfig(false);
    setShowSaved(false);
    setMessages([]);
    setSessionScore(0);
    setScoreCount(0);
    setShowReport(false);
    sendMessage("Добрый день!");
  };

  const resetSimulation = () => {
    setStarted(false);
    setShowConfig(true);
    setShowSaved(false);
    setMessages([]);
    setInput("");
    setShowReport(false);
  };

  const finishAndReport = () => {
    setShowReport(true);
  };

  const handleSaveDialog = () => {
    if (messages.length < 2) return;
    saveDialog({ service: config.service, clientType: config.clientType, mood: config.mood, messages });
  };

  const handleLoadDialog = (dialog: SavedDialog) => {
    setConfig((prev) => ({ ...prev, service: dialog.service, clientType: dialog.clientType, mood: dialog.mood }));
    setMessages(dialog.messages);
    setStarted(true);
    setShowConfig(false);
    setShowSaved(false);
  };

  const avgScore = scoreCount > 0 ? (sessionScore / scoreCount).toFixed(1) : "—";

  const toolItems = [
    { id: "armory", label: "Арсенал возражений", icon: <Zap className="w-4 h-4" /> },
    { id: "objection-library", label: "Библиотека возражений", icon: <Shield className="w-4 h-4" /> },
    { id: "phrases", label: "Банк фраз", icon: <MessageCircle className="w-4 h-4" /> },
    { id: "live-call", label: "Суфлёр", icon: <Lightbulb className="w-4 h-4" /> },
  ];

  return (
    <div className={`flex flex-col h-full ${className || ""}`}>
      {/* Header */}
      <div className="p-4 border-b border-border/50 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            <div>
              <h2 className="text-sm font-semibold">Симулятор клиента</h2>
              {started && simMode === "trainer" && (
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <Trophy className="w-3 h-3 text-primary" />
                  <span>Средний балл: {avgScore}/10</span>
                  <span>·</span>
                  <span>Раундов: {scoreCount}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-1">
            {started && (
              <button onClick={() => setShowTools(true)} className="p-2 rounded-lg hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-colors" title="Инструменты">
                <Wrench className="w-4 h-4" />
              </button>
            )}
            {started && messages.length >= 2 && (
              <button onClick={handleSaveDialog} className="p-2 rounded-lg hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-colors" title="Сохранить">
                <Save className="w-4 h-4" />
              </button>
            )}
            <button onClick={() => setShowSaved(!showSaved)} className={`p-2 rounded-lg hover:bg-accent/50 transition-colors ${showSaved ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"}`}>
              <FolderOpen className="w-4 h-4" />
            </button>
            {started && (
              <>
                <button onClick={() => setShowConfig(!showConfig)} className="p-2 rounded-lg hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-colors">
                  <Settings2 className="w-4 h-4" />
                </button>
                {simMode === "trainer" && scoreCount > 0 && (
                  <button onClick={finishAndReport} className="p-2 rounded-lg hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-colors" title="Итоги">
                    <BarChart3 className="w-4 h-4" />
                  </button>
                )}
                <button onClick={resetSimulation} className="p-2 rounded-lg hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-colors">
                  <RotateCcw className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Saved dialogs */}
      <AnimatePresence>
        {showSaved && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-b border-border/50">
            <div className="p-4 max-h-60 overflow-y-auto space-y-2">
              {dialogs.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">Нет сохранённых диалогов</p>
              ) : (
                dialogs.map((d) => (
                  <div key={d.id} className="flex items-center gap-2 p-2.5 border border-border/50 rounded-xl glass-card hover:bg-accent/30 transition-colors">
                    <button onClick={() => handleLoadDialog(d)} className="flex-1 text-left min-w-0">
                      <p className="text-xs font-medium truncate">{d.service} — {d.clientType}</p>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(d.timestamp).toLocaleString("ru-RU")} · {d.messages.length} сообщ.
                      </p>
                    </button>
                    <button onClick={() => deleteDialog(d.id)} className="p-1 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Config panel */}
      <AnimatePresence>
        {showConfig && !showSaved && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-b border-border/50">
            <div className="p-4 space-y-3">
              {!started && (
                <div className="relative w-full max-w-[300px] mx-auto -mt-1 mb-1">
                  <img src={heroSimulator} alt="" loading="lazy" className="w-full rounded-2xl opacity-90" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent rounded-2xl" />
                </div>
              )}
              {/* Mode selector */}
              {!started && (
                <div className="flex gap-2 mb-2">
                  <button onClick={() => setSimMode("free")}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-medium transition-all btn-tactile ${simMode === "free" ? "chip-active" : "chip-inactive"}`}>
                    <MessageCircle className="w-4 h-4" /> Свободный режим
                  </button>
                  <button onClick={() => setSimMode("trainer")}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-medium transition-all btn-tactile ${simMode === "trainer" ? "chip-active" : "chip-inactive"}`}>
                    <GraduationCap className="w-4 h-4" /> Тренер продаж
                  </button>
                </div>
              )}

              {simMode === "trainer" && !started && (
                <div className="glass-card border border-primary/20 rounded-xl p-3 bg-primary/5">
                  <p className="text-xs font-medium text-primary mb-1">🎓 Режим тренера</p>
                  <p className="text-[10px] text-muted-foreground">ИИ оценит каждый ваш ответ по шкале 1-10, даст обратную связь и подскажет как улучшить технику продаж.</p>
                </div>
              )}

              {!started && (
                <div className="space-y-2">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-primary" /> Готовые сценарии
                  </p>
                  <div className="grid grid-cols-1 gap-1.5">
                    {SIMULATOR_SCENARIO_PRESETS.map(p => (
                      <button key={p.label}
                        onClick={() => setConfig(c => ({ ...c, clientType: p.clientType, mood: p.mood, budget: p.budget, objectionLevel: p.objectionLevel }))}
                        className="text-left px-3 py-2 rounded-xl border border-border/50 glass-card hover:border-primary/30 btn-tactile">
                        <p className="text-xs font-medium text-foreground">{p.label}</p>
                        <p className="text-[10px] text-muted-foreground">{p.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

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
                <button onClick={startSimulation} className="w-full bg-primary text-primary-foreground font-medium py-3 rounded-xl transition-all btn-tactile shadow-glow hover:opacity-90 text-sm">
                  {simMode === "trainer" ? "🎓 Начать тренировку" : "🎭 Начать симуляцию"}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Training report */}
      <AnimatePresence>
        {showReport && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="p-4 border-b border-border/50 glass-card m-2 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold flex items-center gap-2"><Trophy className="w-4 h-4 text-primary" /> Итоги тренировки</h3>
              <button onClick={() => setShowReport(false)} className="p-1 rounded-lg hover:bg-accent/50 text-muted-foreground"><X className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-2 rounded-lg bg-primary/5 border border-primary/10">
                <p className="text-lg font-bold text-primary">{avgScore}</p>
                <p className="text-[10px] text-muted-foreground">Средний балл</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-accent/50 border border-border/50">
                <p className="text-lg font-bold text-foreground">{scoreCount}</p>
                <p className="text-[10px] text-muted-foreground">Раундов</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-accent/50 border border-border/50">
                <p className="text-lg font-bold text-foreground">{messages.length}</p>
                <p className="text-[10px] text-muted-foreground">Сообщений</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat area */}
      {started && (
        <>
          <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className="max-w-[80%] space-y-1">
                  <div className={`px-4 py-2.5 rounded-2xl text-sm ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "glass-card border border-border/50 text-foreground rounded-bl-sm"
                  }`}>
                    <p className="text-[10px] font-medium mb-1 opacity-60">
                      {msg.role === "user" ? "Вы (менеджер)" : `Клиент (${config.clientType})`}
                    </p>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    {msg.role === "client" && isLoading && i === messages.length - 1 && <span className="cursor-blink" />}
                  </div>
                  {/* Trainer feedback */}
                  {msg.score !== undefined && (
                    <div className={`px-3 py-2 rounded-xl text-xs border ${
                      msg.score >= 7 ? "border-green-500/20 bg-green-500/5 text-green-600" :
                      msg.score >= 4 ? "border-yellow-500/20 bg-yellow-500/5 text-yellow-600" :
                      "border-red-500/20 bg-red-500/5 text-red-600"
                    }`}>
                      <span className="font-bold">{msg.score}/10</span>
                      {msg.feedback && <span className="ml-2 opacity-80">{msg.feedback}</span>}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}

            {/* Trainer hint */}
            <AnimatePresence>
              {showHint && (
                <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="glass-card border border-primary/20 rounded-xl p-3 bg-primary/5">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-medium text-primary mb-0.5">Подсказка</p>
                      <p className="text-xs text-foreground">{currentHint}</p>
                    </div>
                    <button onClick={() => setShowHint(false)} className="p-0.5 rounded hover:bg-accent/50 text-muted-foreground shrink-0"><X className="w-3 h-3" /></button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Input area */}
          <div className="p-3 border-t border-border/50 shrink-0">
            {simMode === "trainer" && !isLoading && (
              <div className="flex gap-1.5 mb-2">
                <button onClick={getHint} className="flex items-center gap-1 text-[10px] px-2.5 py-1.5 rounded-lg border border-border/50 text-muted-foreground hover:text-primary hover:border-primary/20 transition-all btn-tactile">
                  <Lightbulb className="w-3 h-3" /> Подсказка
                </button>
              </div>
            )}
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
                placeholder="Введите ваш ответ клиенту..."
                disabled={isLoading}
                className="flex-1 glass-input border border-border/50 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              />
              <button onClick={() => sendMessage(input)} disabled={isLoading || !input.trim()} className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl hover:opacity-90 disabled:opacity-50 transition-all btn-tactile">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Tools overlay sheet */}
      <Sheet open={showTools} onOpenChange={setShowTools}>
        <SheetContent side="right" className="glass-panel w-80">
          <SheetHeader>
            <SheetTitle className="text-sm">Инструменты</SheetTitle>
          </SheetHeader>
          <p className="text-[10px] text-muted-foreground mb-4">Используйте инструменты не теряя прогресс диалога</p>
          <div className="space-y-2">
            {toolItems.map((item) => (
              <button key={item.id} onClick={() => { onOpenTool?.(item.id); setShowTools(false); }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl border border-border/50 hover:bg-accent/50 transition-all text-left btn-tactile">
                <span className="text-primary">{item.icon}</span>
                <span className="text-xs font-medium text-foreground flex-1">{item.label}</span>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all btn-tactile ${
      active ? "chip-active" : "chip-inactive"
    }`}>{children}</button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}
