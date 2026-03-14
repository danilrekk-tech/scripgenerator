import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  script: string;
  isGenerating: boolean;
}

export default function ScriptOutput({ script, isGenerating }: Props) {
  // Highlight [Variable] patterns
  const rendered = useMemo(() => {
    if (!script) return null;
    const parts = script.split(/(\[[^\]]+\])/g);
    return parts.map((part, i) =>
      part.startsWith("[") && part.endsWith("]") ? (
        <span key={i} className="variable-tag">{part}</span>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  }, [script]);

  return (
    <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
      {/* Header */}
      <div className="border-b border-border px-8 py-4 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">ScriptEngine</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Stop pitching. Start closing.</p>
        </div>
        {script && (
          <button
            onClick={() => navigator.clipboard.writeText(script)}
            className="text-xs px-3 py-1.5 rounded-sm border border-border bg-secondary text-secondary-foreground hover:border-primary/20 transition-all duration-200 btn-tactile"
          >
            Копировать
          </button>
        )}
      </div>

      {/* Progress bar */}
      {isGenerating && (
        <div className="h-0.5 bg-secondary overflow-hidden">
          <div className="h-full w-1/4 bg-primary progress-bar" />
        </div>
      )}

      {/* Script Area */}
      <div className="flex-1 overflow-y-auto p-8">
        <AnimatePresence mode="wait">
          {script ? (
            <motion.div
              key="script"
              initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
              className="max-w-[65ch] mx-auto"
            >
              <div className="script-mono text-sm leading-7 text-foreground whitespace-pre-wrap">
                {rendered}
                {isGenerating && <span className="cursor-blink" />}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full flex items-center justify-center"
            >
              <div className="text-center max-w-md">
                <div className="text-4xl font-semibold tracking-tight mb-3 text-foreground">
                  Stop pitching.
                  <br />
                  <span className="text-primary">Start closing.</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Настрой параметры слева, выбери ситуацию и нажми
                  «Сгенерировать скрипт». Переменные{" "}
                  <span className="variable-tag">[Имя клиента]</span> останутся
                  в тексте для быстрой персонализации.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
