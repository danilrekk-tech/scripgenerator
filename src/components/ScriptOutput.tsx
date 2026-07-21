import { useMemo, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { GenerationMode } from "./ConfigSidebar";
import type { DisplaySettings } from "@/hooks/useDisplaySettings";
import { FONT_FAMILIES } from "@/hooks/useDisplaySettings";
import { parseStages, exportToHtml } from "@/lib/exportHtml";
import { Download, Copy, ChevronRight, ChevronDown, Zap, Shield, Gift, Target, Star, FileText, Type, BarChart3, QrCode, Loader2, Edit3, Check, X, StickyNote, MessageSquarePlus, ArrowUp, ShoppingBag, Settings2 } from "lucide-react";
import type { Upsell } from "@/hooks/useUpsells";

export type CompanionType = "objections" | "arguments" | "benefits" | "dozim" | "upsell";

interface Props {
  script: string;
  isGenerating: boolean;
  mode: GenerationMode;
  displaySettings: DisplaySettings;
  className?: string;
  onCompanionGenerate?: (type: CompanionType, upsellIds?: string[]) => void;
  onScoreScript?: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  isScoring?: boolean;
  onScriptEdit?: (newScript: string) => void;
  notes?: { id: string; paragraphIndex: number; text: string }[];
  onAddNote?: (paragraphIndex: number, text: string) => void;
  onRemoveNote?: (id: string) => void;
  upsells?: Upsell[];
  onOpenUpsellManager?: () => void;
}

const MODE_EMPTY: Record<string, { title: string; subtitle: string }> = {
  script: { title: "Хватит уговаривать. Пора закрывать.", subtitle: "Настрой параметры и нажми «Сгенерировать»" },
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
  { type: "objections" as const, label: "Возражения", icon: Shield, desc: "Ответы на 5 возражений" },
  { type: "arguments" as const, label: "Аргументы", icon: Zap, desc: "Факты и доказательства" },
  { type: "benefits" as const, label: "Выгоды", icon: Gift, desc: "Что получит клиент" },
  { type: "dozim" as const, label: "Дожим", icon: Target, desc: "Фразы закрытия" },
];

function highlightKeywords(text: string): boolean {
  return /\?|руб|₽|\d+\s*000|позвоните|оставьте|напишите|закажите|оформите/i.test(text);
}

function renderRichText(text: string, highlightVars: boolean): React.ReactNode[] {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  for (let li = 0; li < lines.length; li++) {
    const line = lines[li];
    const isKeyword = highlightKeywords(line);
    const numberedMatch = line.match(/^(\d+)[.)]\s+(.+)/);
    if (numberedMatch) {
      elements.push(
        <div key={li} className={`flex gap-3 py-1.5 pl-1 ${isKeyword ? "bg-primary/5 rounded-lg -mx-1 px-2" : ""}`}>
          <span className="text-primary/60 font-mono text-xs mt-0.5 shrink-0 w-5 text-right">{numberedMatch[1]}.</span>
          <span className="flex-1">{formatInline(numberedMatch[2], highlightVars)}</span>
        </div>
      );
      continue;
    }
    const bulletMatch = line.match(/^[-•]\s+(.+)/);
    if (bulletMatch) { elements.push(<div key={li} className="flex gap-3 py-1 pl-1"><span className="text-primary/60 mt-1.5 shrink-0">●</span><span className="flex-1">{formatInline(bulletMatch[1], highlightVars)}</span></div>); continue; }
    if (line.match(/^□\s+(.+)/)) { elements.push(<div key={li} className="flex gap-2 py-1 pl-1"><span className="text-muted-foreground shrink-0">☐</span><span className="flex-1">{formatInline(line.slice(2), highlightVars)}</span></div>); continue; }
    if (line.match(/^→\s+(.+)/)) { elements.push(<div key={li} className="flex gap-2 py-0.5 pl-6 text-muted-foreground"><span>→</span><span className="flex-1 italic">{formatInline(line.slice(2), highlightVars)}</span></div>); continue; }
    if (line.trim() === "---" || line.trim() === "***") { elements.push(<hr key={li} className="border-border/50 my-4" />); continue; }
    if (line.trim() === "") { elements.push(<div key={li} className="h-2" />); continue; }
    elements.push(
      <div key={li} className={`py-0.5 ${isKeyword ? "bg-primary/5 rounded-lg -mx-1 px-2" : ""}`}>
        {formatInline(line, highlightVars)}
      </div>
    );
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
  window.open(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${text}`, "_blank");
}

export default function ScriptOutput({ script, isGenerating, mode, displaySettings, className, onCompanionGenerate, onScoreScript, isFavorite, onToggleFavorite, isScoring, onScriptEdit, notes, onAddNote, onRemoveNote, upsells = [], onOpenUpsellManager }: Props) {
  const stages = useMemo(() => {
    if (!script) return [];
    const parsed = parseStages(script);
    // Filter out empty stages (fix white blocks)
    return parsed.filter(s => s.content.trim().length > 0 || s.title.trim().length > 0);
  }, [script]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [collapsedStages, setCollapsedStages] = useState<Set<number>>(new Set());
  const [editingStage, setEditingStage] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [noteStage, setNoteStage] = useState<number | null>(null);
  const [noteText, setNoteText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showUpsellPicker, setShowUpsellPicker] = useState(false);
  const [selectedUpsells, setSelectedUpsells] = useState<Set<string>>(new Set());

  const copyText = (text: string, id: string) => { navigator.clipboard.writeText(text); setCopiedId(id); setTimeout(() => setCopiedId(null), 1500); };

  const toggleCollapse = (i: number) => {
    setCollapsedStages((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const startEdit = (i: number, content: string) => {
    setEditingStage(i);
    setEditText(content);
  };

  const saveEdit = () => {
    if (editingStage === null || !onScriptEdit) return;
    const newStages = stages.map((s, i) =>
      i === editingStage ? { ...s, content: editText } : s
    );
    const newScript = newStages.map((s) =>
      s.title ? `## ${s.title}\n\n${s.content}` : s.content
    ).join("\n\n");
    onScriptEdit(newScript);
    setEditingStage(null);
  };

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
      {/* Header */}
      <div className="border-b border-border/30 px-4 md:px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-foreground">Результат</h1>
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
          <div className="flex items-center gap-1">
            {onToggleFavorite && (
              <button onClick={onToggleFavorite} className={`p-1.5 rounded-lg transition-all btn-tactile ${isFavorite ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                <Star className={`w-4 h-4 ${isFavorite ? "fill-current" : ""}`} />
              </button>
            )}
            {onScoreScript && (
              <button onClick={onScoreScript} disabled={isScoring} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-all btn-tactile" title="Оценить скрипт">
                {isScoring ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
              </button>
            )}
            <button onClick={() => showQr(script)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-all btn-tactile" title="QR-код">
              <QrCode className="w-4 h-4" />
            </button>
            <button onClick={() => copyText(script, "all")} className="text-[11px] px-2.5 py-1.5 rounded-lg border border-border/50 glass-card text-foreground hover:bg-accent/50 transition-all btn-tactile flex items-center gap-1">
              <Copy className="w-3 h-3" />{copiedId === "all" ? "✓" : "Копировать"}
            </button>
            <div className="relative">
              <button onClick={() => setShowExportMenu(!showExportMenu)} className="text-[11px] px-2.5 py-1.5 rounded-lg border border-border/50 glass-card text-foreground hover:bg-accent/50 transition-all btn-tactile flex items-center gap-1">
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

      <div className="flex-1 flex min-h-0">
        {/* Main content */}
        <div ref={scrollRef} onScroll={(e) => setShowScrollTop((e.currentTarget as HTMLDivElement).scrollTop > 400)} className="flex-1 overflow-y-auto overscroll-contain p-4 md:p-8 pb-[max(6rem,calc(env(safe-area-inset-bottom)+5rem))] relative" style={{ WebkitOverflowScrolling: "touch" }}>
          <AnimatePresence mode="wait">
            {script ? (
              <motion.div key="script" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} style={{ maxWidth: `${displaySettings.maxWidth}ch` }} className="mx-auto">
                {/* Table of contents */}
                {displaySettings.showStageHeaders && stages.length > 1 && (
                  <div className="mb-8 pb-4 border-b border-border/30">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Содержание</p>
                    <div className="flex flex-wrap gap-1.5">
                      {stages.map((s, i) => {
                        if (!s.title) return null;
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

                {/* Stages */}
                {stages.map((stage, i) => {
                  // Skip stages with no content and no title
                  if (!stage.content.trim() && !stage.title.trim()) return null;
                  
                  const internal = isInternalSection(stage.title);
                  const isCollapsed = collapsedStages.has(i);
                  const stageNotes = notes?.filter((n) => n.paragraphIndex === i) || [];

                  return (
                    <div key={i} id={`stage-${i}`} style={{ marginBottom: `${displaySettings.paragraphSpacing}px` }}>
                      {displaySettings.showStageHeaders && stages.length > 1 && stage.title && (
                        <div className={`flex items-center gap-2 mb-3 pb-2 border-b ${internal ? "border-dashed border-border/30" : "border-border/30"} group`}>
                          <button onClick={() => toggleCollapse(i)} className="p-0.5 rounded hover:bg-accent/50 transition-colors text-muted-foreground">
                            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                          {internal && <span className="text-xs opacity-40">📋</span>}
                          <h2 className={`flex-1 font-medium tracking-tight ${internal ? "text-muted-foreground text-sm" : "text-foreground"}`} style={!internal ? { fontSize: `${displaySettings.stageHeaderSize}px` } : undefined}>
                            {stage.title}
                          </h2>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => copyText(stage.content, `stage-${i}`)} className="p-1.5 rounded-lg hover:bg-accent/50 text-muted-foreground transition-colors" title="Копировать блок">
                              {copiedId === `stage-${i}` ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                            {onScriptEdit && !isGenerating && (
                              <button onClick={() => startEdit(i, stage.content)} className="p-1.5 rounded-lg hover:bg-accent/50 text-muted-foreground transition-colors" title="Редактировать">
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {onAddNote && (
                              <button onClick={() => setNoteStage(noteStage === i ? null : i)} className="p-1.5 rounded-lg hover:bg-accent/50 text-muted-foreground transition-colors" title="Заметка">
                                <StickyNote className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          {internal && <span className="text-[9px] uppercase tracking-widest text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md">внутреннее</span>}
                        </div>
                      )}

                      {/* Note input */}
                      {noteStage === i && onAddNote && (
                        <div className="mb-3 flex gap-2">
                          <input value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Добавить заметку..." className="flex-1 glass-input border border-border/50 rounded-lg px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30" onKeyDown={(e) => { if (e.key === "Enter" && noteText.trim()) { onAddNote(i, noteText.trim()); setNoteText(""); setNoteStage(null); } }} />
                          <button onClick={() => { if (noteText.trim()) { onAddNote(i, noteText.trim()); setNoteText(""); setNoteStage(null); } }} className="px-2 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs btn-tactile">+</button>
                        </div>
                      )}

                      {/* Notes display */}
                      {stageNotes.length > 0 && (
                        <div className="mb-3 space-y-1">
                          {stageNotes.map((note) => (
                            <div key={note.id} className="flex items-start gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/10">
                              <StickyNote className="w-3 h-3 text-primary/60 mt-0.5 shrink-0" />
                              <span className="flex-1 text-xs text-foreground/80">{note.text}</span>
                              {onRemoveNote && <button onClick={() => onRemoveNote(note.id)} className="text-muted-foreground hover:text-destructive p-0.5"><X className="w-3 h-3" /></button>}
                            </div>
                          ))}
                        </div>
                      )}

                      {!isCollapsed && stage.content.trim() && (
                        <>
                          {editingStage === i ? (
                            <div className="space-y-2">
                              <textarea value={editText} onChange={(e) => setEditText(e.target.value)} className="w-full glass-input border border-border/50 rounded-xl p-4 text-sm text-foreground font-mono resize-y min-h-[200px] focus:outline-none focus:ring-2 focus:ring-primary/30" style={textStyle} />
                              <div className="flex gap-2">
                                <button onClick={saveEdit} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium btn-tactile">Сохранить</button>
                                <button onClick={() => setEditingStage(null)} className="px-3 py-1.5 border border-border/50 rounded-lg text-xs text-muted-foreground btn-tactile">Отмена</button>
                              </div>
                            </div>
                          ) : (
                            <div className={`script-content ${internal ? "text-muted-foreground glass-card border border-dashed border-border/30 rounded-xl p-4 text-sm" : displaySettings.scriptBgEnabled ? "text-foreground glass-card border border-border/30 rounded-xl p-4" : "text-foreground"}`}
                              style={internal ? { ...textStyle, fontSize: `${Math.max(Number(displaySettings.fontSize) - 1, 12)}px` } : textStyle}>
                              {renderRichText(stage.content, displaySettings.highlightVariables)}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}

                {isGenerating && <span className="cursor-blink" />}

                {showCompanionButtons && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-8 pt-6 border-t border-border/30">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Дополнить скрипт</p>
                      <p className="text-[10px] text-muted-foreground/70">Продолжает логику диалога</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {COMPANION_BUTTONS.map((btn) => (
                        <button key={btn.type} onClick={() => onCompanionGenerate!(btn.type)}
                          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-border/50 glass-card text-foreground hover:bg-accent/50 transition-all btn-tactile text-left group">
                          <btn.icon className="w-4 h-4 text-primary/70 group-hover:text-primary transition-colors shrink-0" />
                          <div><span className="text-xs font-medium block">{btn.label}</span><span className="text-[10px] text-muted-foreground">{btn.desc}</span></div>
                        </button>
                      ))}
                    </div>

                    {/* Upsell block */}
                    <div className="mt-3 glass-card border border-primary/30 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <ShoppingBag className="w-4 h-4 text-primary" />
                          <span className="text-xs font-semibold">Допродажи</span>
                        </div>
                        {onOpenUpsellManager && (
                          <button onClick={onOpenUpsellManager} className="text-[10px] px-2 py-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 flex items-center gap-1" title="Управлять допами">
                            <Settings2 className="w-3 h-3" /> Управлять
                          </button>
                        )}
                      </div>
                      {upsells.length === 0 ? (
                        <p className="text-[11px] text-muted-foreground">Добавьте свои допы через «Управлять», и AI встроит их в скрипт логично.</p>
                      ) : (
                        <>
                          {!showUpsellPicker ? (
                            <button onClick={() => setShowUpsellPicker(true)} className="w-full text-left text-[11px] text-muted-foreground hover:text-foreground p-2 rounded-lg hover:bg-accent/30">
                              Выбрать, что предложить сверху ({upsells.length} доступно) →
                            </button>
                          ) : (
                            <div className="space-y-1.5">
                              <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                                {upsells.map((u) => {
                                  const on = selectedUpsells.has(u.id);
                                  return (
                                    <label key={u.id} className={`flex items-start gap-2 p-2 rounded-lg cursor-pointer transition ${on ? "bg-primary/10 border border-primary/30" : "border border-border/30 hover:bg-accent/30"}`}>
                                      <input type="checkbox" checked={on} onChange={() => {
                                        setSelectedUpsells((prev) => { const n = new Set(prev); n.has(u.id) ? n.delete(u.id) : n.add(u.id); return n; });
                                      }} className="mt-0.5" />
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-baseline gap-2">
                                          <span className="text-xs font-medium text-foreground">{u.name}</span>
                                          {u.price && <span className="text-[10px] text-primary">{u.price}</span>}
                                        </div>
                                        <p className="text-[10px] text-muted-foreground line-clamp-2">{u.description}</p>
                                      </div>
                                    </label>
                                  );
                                })}
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => { onCompanionGenerate!("upsell", Array.from(selectedUpsells.size ? selectedUpsells : new Set(upsells.map(u => u.id)))); setShowUpsellPicker(false); }}
                                  className="flex-1 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-medium btn-tactile flex items-center justify-center gap-1.5">
                                  <ShoppingBag className="w-3.5 h-3.5" /> Встроить {selectedUpsells.size || "все"} в скрипт
                                </button>
                                <button onClick={() => setShowUpsellPicker(false)} className="px-3 py-2 border border-border/50 rounded-lg text-xs text-muted-foreground">Отмена</button>
                              </div>
                            </div>
                          )}
                        </>
                      )}
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
                  <div className="mt-4 text-[10px] text-muted-foreground/50">
                    <kbd className="px-1.5 py-0.5 rounded bg-muted/50">Ctrl+G</kbd> — генерация
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Floating action bar — sticky while scrolling */}
          {script && (
            <div className="sticky bottom-4 mt-6 z-30 flex justify-center pointer-events-none">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="pointer-events-auto flex items-center gap-1 px-2 py-1.5 rounded-full glass-card border border-border/60 shadow-lg backdrop-blur-xl"
              >
                <button onClick={() => copyText(script, "all")} className="px-3 py-1.5 rounded-full text-xs font-medium hover:bg-accent/60 text-foreground transition-colors flex items-center gap-1.5" title="Копировать всё">
                  <Copy className="w-3.5 h-3.5" />{copiedId === "all" ? "✓" : "Копировать"}
                </button>
                <div className="w-px h-5 bg-border/50" />
                <button onClick={() => exportToHtml(script, displaySettings)} className="p-2 rounded-full hover:bg-accent/60 text-muted-foreground hover:text-foreground transition-colors" title="HTML">
                  <Download className="w-3.5 h-3.5" />
                </button>
                {onToggleFavorite && (
                  <button onClick={onToggleFavorite} className={`p-2 rounded-full hover:bg-accent/60 transition-colors ${isFavorite ? "text-primary" : "text-muted-foreground hover:text-foreground"}`} title="Избранное">
                    <Star className={`w-3.5 h-3.5 ${isFavorite ? "fill-current" : ""}`} />
                  </button>
                )}
                {onScoreScript && (
                  <button onClick={onScoreScript} disabled={isScoring} className="p-2 rounded-full hover:bg-accent/60 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50" title="Оценить">
                    {isScoring ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BarChart3 className="w-3.5 h-3.5" />}
                  </button>
                )}
                {showScrollTop && (
                  <>
                    <div className="w-px h-5 bg-border/50" />
                    <button onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" })} className="p-2 rounded-full hover:bg-accent/60 text-muted-foreground hover:text-foreground transition-colors" title="Наверх">
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </motion.div>
            </div>
          )}
        </div>

        {/* Minimap - desktop only */}
        {script && stages.length > 1 && (
          <div className="hidden lg:flex flex-col w-8 shrink-0 border-l border-border/20 py-4 px-1 gap-1">
            {stages.map((s, i) => {
              const height = Math.max(8, Math.min(40, s.content.length / 20));
              const internal = isInternalSection(s.title);
              return (
                <button
                  key={i}
                  onClick={() => document.getElementById(`stage-${i}`)?.scrollIntoView({ behavior: "smooth", block: "start" })}
                  className={`w-full rounded-sm transition-colors hover:bg-primary/30 ${internal ? "bg-muted-foreground/10" : "bg-primary/15"}`}
                  style={{ height: `${height}px` }}
                  title={s.title}
                />
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
