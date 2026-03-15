import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { GenerationMode } from "./ConfigSidebar";

interface Props {
  script: string;
  isGenerating: boolean;
  mode: GenerationMode;
  className?: string;
}

const MODE_EMPTY: Record<GenerationMode, { title: string; subtitle: string }> = {
  script: {
    title: "Stop pitching. Start closing.",
    subtitle: "Настрой параметры, выбери ситуацию и нажми «Сгенерировать скрипт».",
  },
  "service-info": {
    title: "Знай свой продукт.",
    subtitle: "Выбери услугу и получи полный разбор: что входит, какой результат, какие сроки.",
  },
  arguments: {
    title: "Факты побеждают.",
    subtitle: "Получи готовые аргументы, факты и выгоды для убеждения клиента.",
  },
  "buffer-questions": {
    title: "Правильный вопрос — половина продажи.",
    subtitle: "Получи вопросы для выявления потребностей, болей и готовности клиента.",
  },
  "transcript-analysis": {
    title: "Учись на реальных диалогах.",
    subtitle: "Вставь транскрибацию разговора — получи анализ ошибок и идеальный скрипт.",
  },
};

export default function ScriptOutput({ script, isGenerating, mode, className }: Props) {
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

  const empty = MODE_EMPTY[mode];

  return (
    <main className={`flex-1 flex flex-col min-w-0 overflow-hidden ${className || ""}`}>
      {/* Header */}
      <div className="border-b border-border px-6 md:px-8 py-4 flex items-center justify-between shrink-0">
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
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
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
              <div className="text-center max-w-md px-4">
                <div className="text-3xl md:text-4xl font-semibold tracking-tight mb-3 text-foreground">
                  {empty.title.includes("closing") ? (
                    <>
                      Stop pitching.
                      <br />
                      <span className="text-primary">Start closing.</span>
                    </>
                  ) : (
                    <span className="text-primary">{empty.title}</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {empty.subtitle}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
