import { useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { GenerationMode } from "./ConfigSidebar";
import type { DisplaySettings } from "@/hooks/useDisplaySettings";
import { FONT_FAMILIES } from "@/hooks/useDisplaySettings";
import { parseStages, exportToHtml } from "@/lib/exportHtml";
import { Download, Copy, ChevronRight, Zap, Shield, Gift, Target, Star, FileText, Type, BarChart3, QrCode, Loader2 } from "lucide-react";

interface Props {
  script: string;
  isGenerating: boolean;
  mode: GenerationMode;
  displaySettings: DisplaySettings;
  className?: string;
  onCompanionGenerate?: (type: "objections" | "arguments" | "benefits" | "dozim") => void;
  onScoreScript?: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  isScoring?: boolean;
}

const MODE_EMPTY: Record<string, { title: string; subtitle: string }> = {
  script: { title: "Stop pitching. Start closing.", subtitle: "Настрой параметры и нажми «Сгенерировать»" },
  "service-info": { title: "Знай свой продукт", subtitle: "Выбери услугу — получи полный разбор" },
  arguments: { title: "Факты побеждают", subtitle: "Аргументы, факты и выгоды" },
  "buffer-questions": { title: "Правильный вопрос — половина продажи", subtitle: "Вопросы для выявления потребностей" },
  "transcript-analysis": { title: "Учись на реальных диалогах", subtitle: "Вставь транскрибацию — получи анализ" },
  email: { title: "Каждое письмо — шаг к сделке", subtitle: "Готовые тексты писем" },
  "knowledge-base": { title: "Знания — сила продаж", subtitle: "Описания для базы знаний" },
  dozim: { title: "Дожми. Не упусти.", subtitle: "Скрипт для возврата клиента" },
  messenger: { title: "Короткие сообщения — быстрый результат", subtitle: "Скрипты для мессенджеров" },
  "touch-chain": { title: "Серия касаний — путь к сделке", subtitle: "5-7 последовательных контактов" },
  funnel: { title: "Воронка продаж от А до Я", subtitle: "Скрипт на каждый этап" },
  "anti-script": { title: "Учись на ошибках", subtitle: "Типичные ошибки менеджеров" },
  utp: { title: "Уникальность продаёт", subtitle: "Генератор торговых предложений" },
  sms: { title: "160 символов — одна продажа", subtitle: "Короткие SMS-сообщения" },
  voicemail: { title: "Голос вместо гудков", subtitle: "Скрипт для автоответчика" },
  "social-posts": { title: "Контент = Клиенты", subtitle: "Посты для соцсетей" },
  "crm-template": { title: "Порядок в CRM", subtitle: "Шаблоны и заметки" },
  checklist: { title: "Ничего не забыть", subtitle: "Пошаговый чек-лист звонка" },
  glossary: { title: "Говори на языке клиента", subtitle: "Глоссарий терминов" },
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
  { type: "objections" as const, label: "Возражения", icon: Shield, desc: "Возражения клиента" },
  { type: "arguments" as const, label: "Аргументы", icon: Zap, desc: "Аргументы в пользу" },
  { type: "benefits" as const, label: "Выгоды", icon: Gift, desc: "Выгоды для клиента" },
  { type: "dozim" as const, label: "Дожим", icon: Target, desc: "Закрытие сделки" },
];

function renderRichText(text: string, highlightVars: boolean): React.ReactNode[] {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  for (let li = 0; li < lines.length; li++) {
    const line = lines[li];
    const numberedMatch = line.match(/^(\d+)[.)]\s+(.+)/);
    if (numberedMatch) { elements.push(<div key={li} className="flex gap-3 py-1.5 pl-1"><span className="text-muted-foreground font-mono text-xs mt-0.5 shrink-0 w-5 text-right">{numberedMatch[1]}.</span><span className="flex-1">{formatInline(numberedMatch[2], highlightVars)}</span></div>); continue; }
    const bulletMatch = line.match(/^[-•]\s+(.+)/);
    if (bulletMatch) { elements.push(<div key={li} className="flex gap-3 py-1 pl-1"><span className="text-primary/60 mt-1.5 shrink-0">●</span><span className="flex-1">{formatInline(bulletMatch[1], highlightVars)}</span></div>); continue; }
    if (line.match(/^□\s+(.+)/)) { elements.push(<div key={li} className="flex gap-2 py-1 pl-1"><span className="text-muted-foreground shrink-0">☐</span><span className="flex-1">{formatInline(line.slice(2), highlightVars)}</span></div>); continue; }
    if (line.match(/^→\s+(.+)/)) { elements.push(<div key={li} className="flex gap-2 py-0.5 pl-6 text-muted-foreground"><span>→</span><span className="flex-1 italic">{formatInline(line.slice(2), highlightVars)}</span></div>); continue; }
    if (line.trim() === "---" || line.trim() === "***") { elements.push(<hr key={li} className="border-border/50 my-4" />); continue; }
    if (line.trim() === "") { elements.push(<div key={li} className="h-2" />); continue; }
    elements.push(<div key={li} className="py-0.5">{formatInline(line, highlightVars)}</div>);
  }
  return elements;
}

function formatInline(text: string, highlightVars: boolean): React.ReactNode {
  const regex = highlightVars ? /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\])/g : /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  const parts = text.split(regex);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={i} className="text-foreground font-semibold">{part.slice(2, -2)}</strong>;
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) return <em key={i} className="text-muted-foreground">{part.slice(1, -1)}</em>;
    if (highlightVars && part.startsWith("[") && part.endsWith("]")) return <span key={i} className="variable-tag">{part}</span>;
    return <span key={i}>{part}</span>;
  });
}

function getWordCount(text: string): number { return text.split(/\s+/).filter(Boolean).length; }
function getReadingTime(words: number): string { const mins = Math.ceil(words / 150); return mins < 1 ? "< 1 мин" : `~${mins} мин`; }

function exportToTxt(script: string) { const blob = new Blob([script], { type: "text/plain;charset=utf-8" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `script-${Date.now()}.txt`; a.click(); URL.revokeObjectURL(url); }
function exportToMd(script: string) { const blob = new Blob([script], { type: "text/markdown;charset=utf-8" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `script-${Date.now()}.md`; a.click(); URL.revokeObjectURL(url); }

function showQr(script: string) {
  const text = encodeURIComponent(script.slice(0, 1000));
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${text}`;
  window.open(url, "_blank");
}

export default function ScriptOutput({ script, isGenerating, mode, displaySettings, className, onCompanionGenerate, onScoreScript, isFavorite, onToggleFavorite, isScoring }: Props) {
  const stages = useMemo(() => (script ? parseStages(script) : []), [script]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const copyText = (text: string, id: string) => { navigator.clipboard.writeText(text); setCopiedId(id); setTimeout(() => setCopiedId(null), 1500); };

  const wordCount = script ? getWordCount(script) : 0;
  const readingTime = getReadingTime(wordCount);
  const empty = MODE_EMPTY[mode] || MODE_EMPTY.script;

  const textStyle: React.CSSProperties = {
    fontFamily: FONT_FAMILIES[displaySettings.fontFamily],
    fontSize: `${displaySettings.fontSize}px`,
    lineHeight: displaySettings.lineHeight,
    letterSpacing: `${displaySettings.letterSpacing}em`,
  };

  const showCompanionButtons = script && !isGenerating && onCompanionGenerate;

  return (
    <main className={`flex-1 flex flex-col min-w-0 overflow-hidden ${className || ""}`}>
      <div className="border-b border-border/30 px-6 md:px-8 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-base font-semibold tracking-tight text-foreground">ScriptEngine</h1>
            <p className="text-[10px] text-muted-foreground mt-0.5 tracking-wide uppercase">Stop pitching. Start closing.</p>
          </div>
          {script && (
            <div className="hidden md:flex items-center gap-3 ml-4 pl-4 border-l border-border/30">
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><Type className="w-3 h-3" /><span>{wordCount} слов</span></div>
              <span className="text-[11px] text-muted-foreground">•</span>
              <span className="text-[11px] text-muted-foreground">{readingTime} чтения</span>
            </div>
          )}
        </div>
        {script && (
          <div className="flex items-center gap-1.5">
            {onToggleFavorite && (
              <button onClick={onToggleFavorite} className={`p-2 rounded-lg transition-all btn-tactile ${isFavorite ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                <Star className={`w-4 h-4 ${isFavorite ? "fill-current" : ""}`} />
              </button>
            )}
            {onScoreScript && (
              <button onClick={onScoreScript} disabled={isScoring} className="p-2 rounded-lg text-muted-foreground hover:text-foreground transition-all btn-tactile" title="Оценить скрипт">
                {isScoring ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
              </button>
            )}
            <button onClick={() => showQr(script)} className="p-2 rounded-lg text-muted-foreground hover:text-foreground transition-all btn-tactile" title="QR-код">
              <QrCode className="w-4 h-4" />
            </button>
            <button onClick={() => copyText(script, "all")} className="text-[11px] px-3 py-1.5 rounded-lg border border-border/50 glass-card text-foreground hover:bg-accent/50 transition-all btn-tactile flex items-center gap-1.5">
              <Copy className="w-3 h-3" />{copiedId === "all" ? "Скопировано" : "Копировать"}
            </button>
            <div className="relative">
              <button onClick={() => setShowExportMenu(!showExportMenu)} className="text-[11px] px-3 py-1.5 rounded-lg border border-border/50 glass-card text-foreground hover:bg-accent/50 transition-all btn-tactile flex items-center gap-1.5">
                <Download className="w-3 h-3" /> Экспорт
              </button>
              {showExportMenu && (
                <div className="absolute right-0 top-full mt-1 w-44 glass-card border border-border/50 rounded-xl shadow-lg z-50 p-1">
                  <button onClick={() => { exportToHtml(script, displaySettings); setShowExportMenu(false); }} className="w-full text-left text-xs px-3 py-2 rounded-lg hover:bg-accent/50 transition-colors">📄 HTML</button>
                  <button onClick={() => { exportToTxt(script); setShowExportMenu(false); }} className="w-full text-left text-xs px-3 py-2 rounded-lg hover:bg-accent/50 transition-colors">📝 Текст (TXT)</button>
                  <button onClick={() => { exportToMd(script); setShowExportMenu(false); }} className="w-full text-left text-xs px-3 py-2 rounded-lg hover:bg-accent/50 transition-colors">📋 Markdown</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {isGenerating && (<div className="h-0.5 bg-border/30 overflow-hidden"><div className="h-full w-1/4 bg-primary/50 progress-bar rounded-full" /></div>)}

      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <AnimatePresence mode="wait">
          {script ? (
            <motion.div key="script" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} style={{ maxWidth: `${displaySettings.maxWidth}ch` }} className="mx-auto">
              {displaySettings.showStageHeaders && stages.length > 1 && (
                <div className="mb-8 pb-4 border-b border-border/30">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Содержание</p>
                  <div className="flex flex-wrap gap-1.5">
                    {stages.map((s, i) => {
                      const internal = isInternalSection(s.title);
                      return (
                        <button key={i} onClick={() => document.getElementById(`stage-${i}`)?.scrollIntoView({ behavior: "smooth", block: "start" })}
                          className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all btn-tactile flex items-center gap-1 ${internal ? "border-border/30 text-muted-foreground hover:bg-accent/30" : "border-border/50 glass-card text-foreground hover:bg-accent/50"}`}>
                          <ChevronRight className="w-3 h-3 text-muted-foreground" />
                          {internal && <span className="text-[9px] opacity-60">📋</span>}
                          {s.title}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {stages.map((stage, i) => {
                const internal = isInternalSection(stage.title);
                return (
                  <div key={i} id={`stage-${i}`} style={{ marginBottom: `${displaySettings.paragraphSpacing}px` }}>
                    {displaySettings.showStageHeaders && stages.length > 1 && (
                      <div className={`flex items-center gap-3 mb-3 pb-2 border-b ${internal ? "border-dashed border-border/30" : "border-border/30"}`}>
                        {internal && <span className="text-xs opacity-40">📋</span>}
                        <h2 className={`font-medium tracking-tight ${internal ? "text-muted-foreground text-sm" : "text-foreground"}`} style={!internal ? { fontSize: `${displaySettings.stageHeaderSize}px` } : undefined}>
                          {stage.title}
                        </h2>
                        {internal && <span className="text-[9px] uppercase tracking-widest text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md">внутреннее</span>}
                      </div>
                    )}
                    <div className={`script-content ${internal ? "text-muted-foreground glass-card border border-dashed border-border/30 rounded-xl p-5 text-sm" : displaySettings.scriptBgEnabled ? "text-foreground glass-card border border-border/30 rounded-xl p-5" : "text-foreground"}`}
                      style={internal ? { ...textStyle, fontSize: `${Math.max(Number(displaySettings.fontSize) - 1, 12)}px` } : textStyle}>
                      {renderRichText(stage.content, displaySettings.highlightVariables)}
                    </div>
                  </div>
                );
              })}

              {isGenerating && <span className="cursor-blink" />}

              {showCompanionButtons && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-8 pt-6 border-t border-border/30">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Дополнить скрипт</p>
                  <div className="grid grid-cols-2 gap-2">
                    {COMPANION_BUTTONS.map((btn) => (
                      <button key={btn.type} onClick={() => onCompanionGenerate!(btn.type)}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-border/50 glass-card text-foreground hover:bg-accent/50 transition-all btn-tactile text-left group">
                        <btn.icon className="w-4 h-4 text-primary/70 group-hover:text-primary transition-colors shrink-0" />
                        <div><span className="text-xs font-medium block">{btn.label}</span><span className="text-[10px] text-muted-foreground">{btn.desc}</span></div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {script && (
                <div className="md:hidden flex items-center gap-3 mt-6 pt-4 border-t border-border/30 text-[11px] text-muted-foreground">
                  <span>{wordCount} слов</span><span>•</span><span>{readingTime} чтения</span>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex items-center justify-center">
              <div className="text-center max-w-sm px-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                  <FileText className="w-8 h-8 text-primary/60" />
                </div>
                <div className="text-xl md:text-2xl font-semibold tracking-tight mb-3 text-foreground">{empty.title}</div>
                <p className="text-sm text-muted-foreground leading-relaxed">{empty.subtitle}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
