import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { GenerationMode } from "./ConfigSidebar";
import type { DisplaySettings } from "@/hooks/useDisplaySettings";
import { FONT_FAMILIES } from "@/hooks/useDisplaySettings";
import { parseStages, exportToHtml } from "@/lib/exportHtml";
import { Download, Copy, ChevronRight, Zap, Shield, Gift, Target } from "lucide-react";

interface Props {
  script: string;
  isGenerating: boolean;
  mode: GenerationMode;
  displaySettings: DisplaySettings;
  className?: string;
  onCompanionGenerate?: (type: "objections" | "arguments" | "benefits" | "dozim") => void;
}

const MODE_EMPTY: Record<GenerationMode, { title: string; subtitle: string }> = {
  script: { title: "Stop pitching. Start closing.", subtitle: "Настрой параметры, выбери ситуацию и нажми «Сгенерировать скрипт»." },
  "service-info": { title: "Знай свой продукт.", subtitle: "Выбери услугу и получи полный разбор: что входит, результат, сроки." },
  arguments: { title: "Факты побеждают.", subtitle: "Готовые аргументы, факты и выгоды для убеждения клиента." },
  "buffer-questions": { title: "Правильный вопрос — половина продажи.", subtitle: "Вопросы для выявления потребностей и готовности клиента." },
  "transcript-analysis": { title: "Учись на реальных диалогах.", subtitle: "Вставь транскрибацию — получи анализ ошибок и идеальный скрипт." },
  email: { title: "Каждое письмо — шаг к сделке.", subtitle: "Выбери тип письма, укажи услугу и получи готовый текст." },
  "knowledge-base": { title: "Знания — сила продаж.", subtitle: "Описание услуг, терминов и инструкций для базы знаний." },
  dozim: { title: "Дожми. Не упусти.", subtitle: "Выбери ситуацию дожима — получи скрипт для возврата клиента." },
  messenger: { title: "Короткие сообщения — быстрый результат.", subtitle: "Скрипты для WhatsApp, Telegram и других мессенджеров." },
};

const INTERNAL_MARKERS = [
  "АНАЛИЗ ДИАЛОГА", "АНАЛИЗ", "ЧТО БЫЛО ХОРОШО", "ОШИБКИ", "УПУЩЕННЫЕ ВОЗМОЖНОСТИ",
  "ВЫЯВЛЕННЫЕ ПОТРЕБНОСТИ", "СИЛЬНЫЕ СТОРОНЫ", "СЛАБЫЕ СТОРОНЫ", "РЕКОМЕНДАЦИИ",
  "КОММЕНТАРИЙ", "ПОЯСНЕНИЕ", "ПРИМЕЧАНИЕ", "ДЛЯ МЕНЕДЖЕРА", "ВНУТРЕННИЕ ЗАМЕТКИ",
];

function isInternalSection(title: string): boolean {
  const upper = title.toUpperCase().replace(/[*#]/g, "").trim();
  return INTERNAL_MARKERS.some((m) => upper.includes(m));
}

const COMPANION_BUTTONS = [
  { type: "objections" as const, label: "Возражения", icon: Shield, desc: "Возможные возражения клиента" },
  { type: "arguments" as const, label: "Аргументы", icon: Zap, desc: "Дополнительные аргументы" },
  { type: "benefits" as const, label: "Выгоды", icon: Gift, desc: "Выгоды для клиента" },
  { type: "dozim" as const, label: "Дожим", icon: Target, desc: "Фразы для закрытия сделки" },
];

/** Render rich text: bold, italic, variables, numbered lists */
function renderRichText(text: string, highlightVars: boolean): React.ReactNode[] {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];

  for (let li = 0; li < lines.length; li++) {
    const line = lines[li];

    // Numbered list item: "1. Text" or "1) Text"
    const numberedMatch = line.match(/^(\d+)[.)]\s+(.+)/);
    if (numberedMatch) {
      elements.push(
        <div key={li} className="flex gap-3 py-1.5 pl-1">
          <span className="text-muted-foreground font-mono text-xs mt-0.5 shrink-0 w-5 text-right">{numberedMatch[1]}.</span>
          <span className="flex-1">{formatInline(numberedMatch[2], highlightVars)}</span>
        </div>
      );
      continue;
    }

    // Bullet: "- Text" or "• Text"
    const bulletMatch = line.match(/^[-•]\s+(.+)/);
    if (bulletMatch) {
      elements.push(
        <div key={li} className="flex gap-3 py-1 pl-1">
          <span className="text-muted-foreground mt-1.5 shrink-0">·</span>
          <span className="flex-1">{formatInline(bulletMatch[1], highlightVars)}</span>
        </div>
      );
      continue;
    }

    // Separator line
    if (line.trim() === "---" || line.trim() === "***") {
      elements.push(<hr key={li} className="border-border my-3" />);
      continue;
    }

    // Empty line
    if (line.trim() === "") {
      elements.push(<div key={li} className="h-2" />);
      continue;
    }

    // Regular line
    elements.push(<div key={li} className="py-0.5">{formatInline(line, highlightVars)}</div>);
  }

  return elements;
}

function formatInline(text: string, highlightVars: boolean): React.ReactNode {
  // Split by bold **text**, italic *text*, and variables [text]
  const regex = highlightVars
    ? /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\])/g
    : /(\*\*[^*]+\*\*|\*[^*]+\*)/g;

  const parts = text.split(regex);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="text-foreground font-semibold">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return <em key={i} className="text-muted-foreground">{part.slice(1, -1)}</em>;
    }
    if (highlightVars && part.startsWith("[") && part.endsWith("]")) {
      return <span key={i} className="variable-tag">{part}</span>;
    }
    return <span key={i}>{part}</span>;
  });
}

export default function ScriptOutput({ script, isGenerating, mode, displaySettings, className, onCompanionGenerate }: Props) {
  const stages = useMemo(() => {
    if (!script) return [];
    return parseStages(script);
  }, [script]);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const empty = MODE_EMPTY[mode];

  const textStyle: React.CSSProperties = {
    fontFamily: FONT_FAMILIES[displaySettings.fontFamily],
    fontSize: `${displaySettings.fontSize}px`,
    lineHeight: displaySettings.lineHeight,
    letterSpacing: `${displaySettings.letterSpacing}em`,
  };

  const showCompanionButtons = script && !isGenerating && onCompanionGenerate;

  return (
    <main className={`flex-1 flex flex-col min-w-0 overflow-hidden ${className || ""}`}>
      {/* Header */}
      <div className="border-b border-border px-6 md:px-8 py-4 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-base font-semibold tracking-tight text-foreground">ScriptEngine</h1>
          <p className="text-[10px] text-muted-foreground mt-0.5 tracking-wide uppercase">Stop pitching. Start closing.</p>
        </div>
        {script && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => copyText(script, "all")}
              className="text-[11px] px-3 py-1.5 rounded-md border border-border bg-card text-foreground hover:bg-accent transition-all duration-150 btn-tactile flex items-center gap-1.5"
            >
              <Copy className="w-3 h-3" />
              {copiedId === "all" ? "Скопировано" : "Копировать"}
            </button>
            <button
              onClick={() => exportToHtml(script, displaySettings)}
              className="text-[11px] px-3 py-1.5 rounded-md border border-border bg-card text-foreground hover:bg-accent transition-all duration-150 btn-tactile flex items-center gap-1.5"
            >
              <Download className="w-3 h-3" />
              HTML
            </button>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {isGenerating && (
        <div className="h-px bg-border overflow-hidden">
          <div className="h-full w-1/4 bg-foreground/30 progress-bar" />
        </div>
      )}

      {/* Script Area */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <AnimatePresence mode="wait">
          {script ? (
            <motion.div
              key="script"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              style={{ maxWidth: `${displaySettings.maxWidth}ch` }}
              className="mx-auto"
            >
              {/* Mini stage nav */}
              {displaySettings.showStageHeaders && stages.length > 1 && (
                <div className="mb-8 pb-4 border-b border-border">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Содержание</p>
                  <div className="flex flex-wrap gap-1.5">
                    {stages.map((s, i) => {
                      const internal = isInternalSection(s.title);
                      return (
                        <button
                          key={i}
                          onClick={() => {
                            document.getElementById(`stage-${i}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                          }}
                          className={`text-[11px] px-2.5 py-1 rounded-md border transition-all btn-tactile flex items-center gap-1 ${
                            internal
                              ? "border-border bg-muted text-muted-foreground hover:bg-accent"
                              : "border-border bg-card text-foreground hover:bg-accent"
                          }`}
                        >
                          <ChevronRight className="w-3 h-3 text-muted-foreground" />
                          {internal && <span className="text-[9px] opacity-60">📋</span>}
                          {s.title}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Stages */}
              {stages.map((stage, i) => {
                const internal = isInternalSection(stage.title);
                return (
                  <div
                    key={i}
                    id={`stage-${i}`}
                    style={{ marginBottom: `${displaySettings.paragraphSpacing}px` }}
                  >
                    {displaySettings.showStageHeaders && stages.length > 1 && (
                      <div className={`flex items-center gap-3 mb-3 pb-2 ${
                        internal ? "border-b border-dashed border-border" : "border-b border-border"
                      }`}>
                        {internal && <span className="text-xs opacity-40">📋</span>}
                        <h2
                          className={`font-medium tracking-tight ${
                            internal ? "text-muted-foreground text-sm" : "text-foreground"
                          }`}
                          style={!internal ? { fontSize: `${displaySettings.stageHeaderSize}px` } : undefined}
                        >
                          {stage.title}
                        </h2>
                        {internal && (
                          <span className="text-[9px] uppercase tracking-widest text-muted-foreground bg-muted px-2 py-0.5 rounded">
                            внутреннее
                          </span>
                        )}
                      </div>
                    )}
                    <div
                      className={`script-content ${
                        internal
                          ? "text-muted-foreground bg-muted/50 border border-dashed border-border rounded-lg p-5 text-sm"
                          : displaySettings.scriptBgEnabled
                          ? "text-foreground bg-card border border-border rounded-lg p-5"
                          : "text-foreground"
                      }`}
                      style={internal ? { ...textStyle, fontSize: `${Math.max(Number(displaySettings.fontSize) - 1, 12)}px` } : textStyle}
                    >
                      {renderRichText(stage.content, displaySettings.highlightVariables)}
                    </div>
                  </div>
                );
              })}

              {isGenerating && <span className="cursor-blink" />}

              {/* Companion generation buttons */}
              {showCompanionButtons && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-8 pt-6 border-t border-border"
                >
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Дополнить скрипт</p>
                  <div className="grid grid-cols-2 gap-2">
                    {COMPANION_BUTTONS.map((btn) => (
                      <button
                        key={btn.type}
                        onClick={() => onCompanionGenerate!(btn.type)}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-border bg-card text-foreground hover:bg-accent transition-all duration-150 btn-tactile text-left group"
                      >
                        <btn.icon className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                        <div>
                          <span className="text-xs font-medium block">{btn.label}</span>
                          <span className="text-[10px] text-muted-foreground">{btn.desc}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full flex items-center justify-center"
            >
              <div className="text-center max-w-sm px-4">
                <div className="text-2xl md:text-3xl font-semibold tracking-tight mb-3 text-foreground">
                  {empty.title.includes("closing") ? (
                    <>
                      Stop pitching.
                      <br />
                      <span className="text-muted-foreground">Start closing.</span>
                    </>
                  ) : (
                    <span>{empty.title}</span>
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
