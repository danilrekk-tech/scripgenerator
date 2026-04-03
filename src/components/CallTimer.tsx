import { useState, useEffect, useCallback, useRef } from "react";
import { Timer, Play, Pause, RotateCcw, ChevronRight } from "lucide-react";

const STAGES = [
  { name: "Приветствие", duration: 30, tip: "Представьтесь, назовите компанию, причину звонка" },
  { name: "Квалификация", duration: 60, tip: "Уточните ЛПР, текущую ситуацию" },
  { name: "Выявление потребностей", duration: 120, tip: "Задайте буферные вопросы, слушайте" },
  { name: "Презентация", duration: 90, tip: "Покажите ценность, приведите аргументы" },
  { name: "Возражения", duration: 90, tip: "Отработайте возражения, дайте факты" },
  { name: "Закрытие", duration: 60, tip: "Предложите следующий шаг, зафиксируйте договорённости" },
];

export default function CallTimer({ className }: { className?: string }) {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [currentStage, setCurrentStage] = useState(0);
  const [stageElapsed, setStageElapsed] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setElapsed(p => p + 1);
        setStageElapsed(p => p + 1);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning]);

  const reset = useCallback(() => {
    setIsRunning(false);
    setElapsed(0);
    setCurrentStage(0);
    setStageElapsed(0);
  }, []);

  const nextStage = useCallback(() => {
    if (currentStage < STAGES.length - 1) {
      setCurrentStage(p => p + 1);
      setStageElapsed(0);
    }
  }, [currentStage]);

  const fmt = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
  const stage = STAGES[currentStage];
  const stageProgress = Math.min(100, (stageElapsed / stage.duration) * 100);
  const overTime = stageElapsed > stage.duration;

  return (
    <div className={`flex flex-col h-full overflow-y-auto ${className || ""}`}>
      <div className="p-6 border-b border-border/50 shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <Timer className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Таймер звонка</h2>
        </div>
        <p className="text-xs text-muted-foreground">Контролируйте время на каждом этапе разговора</p>
      </div>

      <div className="p-6 space-y-6 flex-1">
        {/* Main timer */}
        <div className="text-center">
          <div className="text-5xl font-mono font-bold text-foreground tracking-wider">{fmt(elapsed)}</div>
          <p className="text-xs text-muted-foreground mt-1">Общее время звонка</p>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => setIsRunning(!isRunning)}
            className={`px-6 py-2.5 rounded-xl text-sm font-medium btn-tactile flex items-center gap-2 ${isRunning ? "bg-destructive/10 text-destructive border border-destructive/30" : "bg-primary text-primary-foreground shadow-glow"}`}>
            {isRunning ? <><Pause className="w-4 h-4" /> Пауза</> : <><Play className="w-4 h-4" /> Старт</>}
          </button>
          <button onClick={reset} className="p-2.5 rounded-xl border border-border/50 glass-card text-muted-foreground hover:text-foreground btn-tactile">
            <RotateCcw className="w-4 h-4" />
          </button>
          <button onClick={nextStage} disabled={currentStage >= STAGES.length - 1}
            className="px-4 py-2.5 rounded-xl border border-border/50 glass-card text-foreground hover:bg-accent/50 btn-tactile text-sm flex items-center gap-1 disabled:opacity-30">
            Далее <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Current stage */}
        <div className={`glass-card border rounded-xl p-4 ${overTime ? "border-destructive/30 bg-destructive/5" : "border-border/50"}`}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Этап {currentStage + 1}/{STAGES.length}</p>
            <span className={`text-sm font-mono font-bold ${overTime ? "text-destructive" : "text-foreground"}`}>
              {fmt(stageElapsed)} / {fmt(stage.duration)}
            </span>
          </div>
          <h3 className="text-base font-semibold text-foreground mb-1">{stage.name}</h3>
          <p className="text-xs text-muted-foreground">{stage.tip}</p>
          <div className="mt-3 h-1.5 bg-border/30 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-1000 ${overTime ? "bg-destructive" : "bg-primary"}`} style={{ width: `${stageProgress}%` }} />
          </div>
        </div>

        {/* All stages */}
        <div className="space-y-1.5">
          {STAGES.map((s, i) => (
            <button key={i} onClick={() => { setCurrentStage(i); setStageElapsed(0); }}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all btn-tactile flex items-center gap-2 ${
                i === currentStage ? "glass-card border border-primary/30 text-primary font-medium" :
                i < currentStage ? "text-muted-foreground line-through opacity-50" : "text-foreground hover:bg-accent/30"
              }`}>
              <span className="w-5 h-5 rounded-full border border-border/50 flex items-center justify-center text-[10px] font-mono shrink-0">
                {i + 1}
              </span>
              {s.name}
              <span className="ml-auto text-[10px] text-muted-foreground">{fmt(s.duration)}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
