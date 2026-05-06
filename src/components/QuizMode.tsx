import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, RefreshCw, Loader2, CheckCircle, XCircle, Send, Sparkles } from "lucide-react";
import { QUIZ_SCENARIOS_EXTENDED } from "@/lib/toolPresets";
import heroQuiz from "@/assets/hero-quiz.jpg";

interface Props {
  serviceNames: string[];
  className?: string;
}

const SCENARIOS = QUIZ_SCENARIOS_EXTENDED.map(s => s.situation);

export default function QuizMode({ serviceNames, className }: Props) {
  const [service, setService] = useState(serviceNames[0] || "SEO-продвижение");
  const [scenario, setScenario] = useState("");
  const [userAnswer, setUserAnswer] = useState("");
  const [evaluation, setEvaluation] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [round, setRound] = useState(0);
  const [totalScore, setTotalScore] = useState(0);

  const startQuiz = useCallback(() => {
    const random = SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)];
    setScenario(random);
    setUserAnswer("");
    setEvaluation("");
    setScore(null);
  }, []);

  const submitAnswer = useCallback(async () => {
    if (!userAnswer.trim() || isEvaluating) return;
    setIsEvaluating(true);
    setEvaluation("");

    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-script`;
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          mode: "script-scoring",
          service,
          context: `ЗАДАНИЕ: Клиент продвижения/оптимизации сайтов. Ситуация: ${scenario}\n\nОТВЕТ МЕНЕДЖЕРА: "${userAnswer}"\n\nОцени ответ менеджера по шкале 1-10. Укажи:\n1. Оценка (число)\n2. Что хорошо\n3. Что можно улучшить\n4. Идеальный ответ\n\nБудь кратким, 5-7 предложений.`,
          situation: "", tone: "", transcript: "", priceRub: "", currency: "RUB",
          emailSubtype: "", emailObjection: "", managerName: "", clientName: "",
        }),
      });

      if (!resp.ok || !resp.body) throw new Error("Ошибка");
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let result = "";

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
            if (content) { result += content; setEvaluation(result); }
          } catch {}
        }
      }

      const scoreMatch = result.match(/(\d+)\s*(?:из|\/)\s*10|[Оо]ценка[:\s]*(\d+)/);
      const s = scoreMatch ? Number(scoreMatch[1] || scoreMatch[2]) : null;
      if (s) { setScore(s); setTotalScore(prev => prev + s); setRound(prev => prev + 1); }
    } catch {
      setEvaluation("Ошибка оценки. Попробуйте ещё раз.");
    } finally {
      setIsEvaluating(false);
    }
  }, [userAnswer, isEvaluating, service, scenario]);

  return (
    <div className={`flex flex-col h-full overflow-y-auto ${className || ""}`}>
      <div className="p-6 border-b border-border/50 shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <Brain className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Квиз-тренажёр</h2>
        </div>
        <p className="text-xs text-muted-foreground">ИИ задаёт ситуацию — вы отвечаете — ИИ оценивает</p>
        {round > 0 && (
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span>Раунд: {round}</span>
            <span>Средний балл: {(totalScore / round).toFixed(1)}/10</span>
          </div>
        )}
      </div>

      <div className="p-6 space-y-4 flex-1">
        <div className="flex flex-wrap gap-1.5">
          {serviceNames.map((s) => (
            <button key={s} onClick={() => setService(s)}
              className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all btn-tactile ${service === s ? "chip-active" : "chip-inactive"}`}>
              {s}
            </button>
          ))}
        </div>

        {!scenario ? (
          <button onClick={startQuiz} className="w-full bg-primary text-primary-foreground font-medium py-3 rounded-xl btn-tactile shadow-glow hover:opacity-90 text-sm flex items-center justify-center gap-2">
            <Brain className="w-4 h-4" /> Начать квиз
          </button>
        ) : (
          <div className="space-y-4">
            <div className="glass-card border border-border/50 rounded-xl p-4">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Ситуация</p>
              <p className="text-sm font-medium text-foreground">{scenario}</p>
              <p className="text-xs text-muted-foreground mt-1">Услуга: {service}</p>
            </div>

            <div>
              <textarea
                className="w-full glass-input border border-border/50 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none h-24"
                placeholder="Напишите ваш ответ клиенту..."
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                disabled={isEvaluating || !!evaluation}
              />
              {!evaluation && (
                <button onClick={submitAnswer} disabled={!userAnswer.trim() || isEvaluating}
                  className="w-full mt-2 bg-primary text-primary-foreground font-medium py-2.5 rounded-xl btn-tactile hover:opacity-90 disabled:opacity-50 text-sm flex items-center justify-center gap-2">
                  {isEvaluating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {isEvaluating ? "Оцениваем..." : "Отправить ответ"}
                </button>
              )}
            </div>

            <AnimatePresence>
              {evaluation && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  {score !== null && (
                    <div className={`flex items-center gap-2 p-3 rounded-xl border ${score >= 7 ? "border-green-500/30 bg-green-500/5" : score >= 4 ? "border-yellow-500/30 bg-yellow-500/5" : "border-red-500/30 bg-red-500/5"}`}>
                      {score >= 7 ? <CheckCircle className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-red-500" />}
                      <span className="text-lg font-bold text-foreground">{score}/10</span>
                    </div>
                  )}
                  <div className="glass-card border border-border/50 rounded-xl p-4 text-sm text-foreground whitespace-pre-wrap">
                    {evaluation}
                    {isEvaluating && <span className="cursor-blink" />}
                  </div>
                  <button onClick={startQuiz} className="w-full border border-border/50 glass-card py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-accent/50 btn-tactile flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4" /> Следующий вопрос
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
