import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { GenerationMode } from "./ConfigSidebar";
import type { DisplaySettings } from "@/hooks/useDisplaySettings";
import { FONT_FAMILIES } from "@/hooks/useDisplaySettings";
import { parseStages, exportToHtml } from "@/lib/exportHtml";
import { Download, Copy, ChevronRight } from "lucide-react";

interface Props {
  script: string;
  isGenerating: boolean;
  mode: GenerationMode;
  displaySettings: DisplaySettings;
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

export default function ScriptOutput({ script, isGenerating, mode, displaySettings, className }: Props) {
  const stages = useMemo(() => {
    if (!script) return [];
    return parseStages(script);
  }, [script]);

  const renderText = (text: string) => {
    if (!displaySettings.highlightVariables) {
      return <span>{text}</span>;
    }
    const parts = text.split(/(\[[^\]]+\])/g);
    return parts.map((part, i) =>
      part.startsWith("[") && part.endsWith("]") ? (
        <span key={i} className="variable-tag">{part}</span>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };

  const empty = MODE_EMPTY[mode];

  const textStyle: React.CSSProperties = {
    fontFamily: FONT_FAMILIES[displaySettings.fontFamily],
    fontSize: `${displaySettings.fontSize}px`,
    lineHeight: displaySettings.lineHeight,
    letterSpacing: `${displaySettings.letterSpacing}em`,
  };

  return (
    <main className={`flex-1 flex flex-col min-w-0 overflow-hidden ${className || ""}`}>
      {/* Header */}
      <div className="border-b border-border px-6 md:px-8 py-4 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">ScriptEngine</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Stop pitching. Start closing.</p>
        </div>
        {script && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigator.clipboard.writeText(script)}
              className="text-xs px-3 py-1.5 rounded-sm border border-border bg-secondary text-secondary-foreground hover:border-primary/20 transition-all duration-200 btn-tactile flex items-center gap-1.5"
            >
              <Copy className="w-3 h-3" />
              Копировать
            </button>
            <button
              onClick={() => exportToHtml(script, displaySettings)}
              className="text-xs px-3 py-1.5 rounded-sm border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-all duration-200 btn-tactile flex items-center gap-1.5"
            >
              <Download className="w-3 h-3" />
              HTML
            </button>
          </div>
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
              style={{ maxWidth: `${displaySettings.maxWidth}ch` }}
              className="mx-auto"
            >
              {/* Mini stage nav */}
              {displaySettings.showStageHeaders && stages.length > 1 && (
                <div className="mb-6 pb-4 border-b border-border">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Этапы</p>
                  <div className="flex flex-wrap gap-1.5">
                    {stages.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          document.getElementById(`stage-${i}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                        }}
                        className="text-[11px] px-2 py-1 rounded-sm border border-border bg-secondary text-secondary-foreground hover:border-primary/30 hover:text-primary transition-all btn-tactile flex items-center gap-1"
                      >
                        <ChevronRight className="w-3 h-3" />
                        {s.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Stages */}
              {stages.map((stage, i) => (
                <div
                  key={i}
                  id={`stage-${i}`}
                  className="mb-2"
                  style={{ marginBottom: `${displaySettings.paragraphSpacing}px` }}
                >
                  {displaySettings.showStageHeaders && stages.length > 1 && (
                    <h2
                      className="font-semibold text-primary mb-3 pb-2 border-b border-primary/10"
                      style={{ fontSize: `${displaySettings.stageHeaderSize}px` }}
                    >
                      {stage.title}
                    </h2>
                  )}
                  <div
                    className={`text-foreground whitespace-pre-wrap ${
                      displaySettings.scriptBgEnabled
                        ? "bg-secondary/50 border border-border rounded-md p-4"
                        : ""
                    }`}
                    style={textStyle}
                  >
                    {renderText(stage.content)}
                  </div>
                </div>
              ))}

              {isGenerating && <span className="cursor-blink" />}
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
