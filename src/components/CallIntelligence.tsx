import { useCallback, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  UploadCloud, FileAudio, Loader2, Clock, Trash2, ChevronRight, ListChecks,
  ShieldAlert, Sparkles, TrendingUp, Target, ArrowLeft, CheckCircle2, XCircle,
  AlertTriangle, Trophy, Radio, PlayCircle, FileDown, Users,
} from "lucide-react";
import { toast } from "sonner";
import {
  analyzeCall, fmtTime, useCallRecords,
  type CallRecord, type CallGrade, type HandlingQuality, type CallMoment,
} from "@/lib/callIntelligence";
import { exportCallReportPdf } from "@/lib/callReportPdf";
import { useElevenLabsQuota, type ElevenLabsQuota } from "@/hooks/useElevenLabsQuota";

const downloadPdf = (call: CallRecord) => {
  const ok = exportCallReportPdf(call);
  if (ok) toast.success("Отчёт готов — выберите «Сохранить как PDF»");
  else toast.error("Разрешите всплывающие окна, чтобы сохранить PDF");
};

function QuotaBar({ quota, loading, error, onRefresh }: {
  quota: ElevenLabsQuota | null; loading: boolean; error: string | null; onRefresh: () => void;
}) {
  const limit = quota?.limit || 0;
  const pct = limit > 0 ? Math.min(100, Math.round((quota!.used / limit) * 100)) : 0;
  const fmt = (n: number) => n.toLocaleString("ru-RU");
  return (
    <div className="glass-card border border-border/50 rounded-2xl p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="w-4 h-4 text-primary shrink-0" />
          <span className="text-xs font-medium text-foreground truncate">Баланс ElevenLabs (символы)</span>
        </div>
        <button onClick={onRefresh} disabled={loading}
          className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground disabled:opacity-50">
          {loading ? "Обновляю…" : "Обновить"}
        </button>
      </div>
      {error ? (
        <p className="mt-2 text-xs text-rose-400">Не удалось получить квоту: {error}</p>
      ) : quota ? (
        <>
          <div className="mt-3 h-2 rounded-full bg-border/40 overflow-hidden">
            <div className="h-full rounded-full transition-all"
              style={{ width: `${pct}%`, background: "var(--accent-gradient)" }} />
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Осталось: <span className="text-foreground font-medium">{fmt(quota.remaining)}</span> из {fmt(limit)}</span>
            {quota.resetsAt ? <span>Обновление {new Date(quota.resetsAt).toLocaleDateString("ru-RU")}</span> : null}
          </div>
        </>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">{loading ? "Загружаю данные…" : "Нет данных о квоте"}</p>
      )}
    </div>
  );
}

export type CallIntelView = "upload" | "report" | "analytics";

interface Props {
  view: CallIntelView;
  onViewChange: (v: CallIntelView) => void;
  serviceNames?: string[];
  className?: string;
}

const GRADE_COLOR: Record<CallGrade, string> = {
  A: "hsl(150 70% 55%)",
  B: "hsl(200 80% 60%)",
  C: "hsl(40 90% 60%)",
  D: "hsl(0 75% 62%)",
};

const QUALITY_META: Record<HandlingQuality, { label: string; icon: JSX.Element; cls: string }> = {
  good: { label: "Хорошо", icon: <CheckCircle2 className="w-3.5 h-3.5" />, cls: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10" },
  medium: { label: "Средне", icon: <AlertTriangle className="w-3.5 h-3.5" />, cls: "text-amber-400 border-amber-400/30 bg-amber-400/10" },
  failed: { label: "Провалено", icon: <XCircle className="w-3.5 h-3.5" />, cls: "text-rose-400 border-rose-400/30 bg-rose-400/10" },
};

const MOMENT_META: Record<CallMoment["type"], { icon: JSX.Element; label: string }> = {
  signal: { icon: <Radio className="w-4 h-4 text-primary" />, label: "Сигнал" },
  risk: { icon: <AlertTriangle className="w-4 h-4 text-amber-400" />, label: "Риск" },
  win: { icon: <Trophy className="w-4 h-4 text-emerald-400" />, label: "Удача" },
  miss: { icon: <XCircle className="w-4 h-4 text-rose-400" />, label: "Упущение" },
};

export default function CallIntelligence({ view, onViewChange, serviceNames = [], className = "" }: Props) {
  const { calls, addCall, patchCall, removeCall } = useCallRecords();
  const { quota, loading: quotaLoading, error: quotaError, refresh: refreshQuota } = useElevenLabsQuota();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [manager, setManager] = useState("[Имя менеджера]");
  const [service, setService] = useState(serviceNames[0] || "SEO-продвижение");
  const [activeTime, setActiveTime] = useState<number | null>(null);
  const [speakerFilter, setSpeakerFilter] = useState<"all" | "manager" | "client">("all");
  const inputRef = useRef<HTMLInputElement>(null);
  const lineRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const selected = useMemo(() => calls.find((c) => c.id === selectedId) || null, [calls, selectedId]);
  const readyCalls = useMemo(() => calls.filter((c) => c.status === "ready" && c.analysis), [calls]);

  const process = useCallback(async (rec: { id: string; fileName: string; file?: File }) => {
    patchCall(rec.id, { status: "processing" });
    try {
      const analysis = await analyzeCall({ file: rec.file, fileName: rec.fileName, manager, service });
      patchCall(rec.id, { status: "ready", analysis });
      toast.success("Звонок разобран");
      void refreshQuota();
    } catch {
      patchCall(rec.id, { status: "failed" });
      toast.error("Не удалось разобрать звонок");
    }
  }, [manager, service, patchCall, refreshQuota]);

  const handleFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files).filter((f) => /audio|video|\.(mp3|wav|m4a|mp4)$/i.test(f.type + f.name));
    if (!arr.length) { toast.error("Поддерживаются mp3, wav, m4a, mp4"); return; }
    arr.forEach((f) => {
      const duration = Math.max(60, Math.round(f.size / 16000));
      const id = addCall({ fileName: f.name, manager, service, duration });
      void process({ id, fileName: f.name, file: f });
    });
  }, [addCall, manager, service, process]);

  const addDemo = () => {
    const id = addCall({ fileName: "demo-call-seo.mp3", manager, service, duration: 200 });
    void process({ id, fileName: "demo-call-seo.mp3" });
  };

  const openReport = (id: string) => { setSelectedId(id); onViewChange("report"); };

  const jumpTo = (t: number) => {
    setActiveTime(t);
    lineRefs.current[t]?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  /* ------------------------------ UPLOAD ------------------------------ */
  if (view === "upload") {
    return (
      <div className={`flex flex-col h-full min-h-0 overflow-hidden ${className}`}>
        <Header title="Загрузка записей" subtitle="Разбор звонков · AI Call Intelligence" />
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-5 space-y-5 pb-[max(2rem,env(safe-area-inset-bottom))]">
          <QuotaBar quota={quota} loading={quotaLoading} error={quotaError} onRefresh={refreshQuota} />
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Менеджер</span>
              <input value={manager} onChange={(e) => setManager(e.target.value)}
                className="mt-1 w-full glass-input border border-border/50 rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40" />
            </label>
            <label className="block">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Услуга</span>
              <input value={service} onChange={(e) => setService(e.target.value)} list="ci-services"
                className="mt-1 w-full glass-input border border-border/50 rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40" />
              <datalist id="ci-services">{serviceNames.map((s) => <option key={s} value={s} />)}</datalist>
            </label>
          </div>

          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
            onClick={() => inputRef.current?.click()}
            className={`relative cursor-pointer rounded-[1.75rem] border border-dashed p-10 text-center transition-all glass-card ${
              dragging ? "border-primary/70 shadow-glow scale-[1.01]" : "border-border/60 hover:border-primary/40"
            }`}
          >
            <div className="pointer-events-none absolute inset-0 rounded-[1.75rem] opacity-40 blur-2xl"
              style={{ background: "radial-gradient(circle at 50% 0%, hsl(var(--primary)/0.25), transparent 65%)" }} />
            <div className="relative flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-2xl p-[1.5px]" style={{ background: "var(--accent-gradient)" }}>
                <div className="w-full h-full rounded-2xl bg-background/80 flex items-center justify-center">
                  <UploadCloud className="w-7 h-7 text-primary" />
                </div>
              </div>
              <p className="font-display text-lg font-semibold text-foreground">Перетащите запись звонка</p>
              <p className="text-xs text-muted-foreground max-w-sm">mp3, wav, m4a или видео mp4. Транскрипция и разбор запускаются автоматически.</p>
              <div className="flex gap-2 mt-1">
                <span className="px-3 py-1.5 rounded-xl text-xs font-medium text-primary-foreground shadow-glow" style={{ background: "var(--accent-gradient)" }}>Выбрать файл</span>
                <button onClick={(e) => { e.stopPropagation(); addDemo(); }}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium border border-border/50 text-muted-foreground hover:text-foreground btn-tactile flex items-center gap-1.5">
                  <PlayCircle className="w-3.5 h-3.5" /> Демо-разбор
                </button>
              </div>
            </div>
            <input ref={inputRef} type="file" multiple accept="audio/*,video/mp4,.mp3,.wav,.m4a,.mp4" className="hidden"
              onChange={(e) => e.target.files && handleFiles(e.target.files)} />
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Загруженные звонки · {calls.length}</p>
            {calls.length === 0 ? (
              <div className="glass-card border border-border/50 rounded-2xl p-8 text-center">
                <FileAudio className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="text-sm text-foreground font-medium">Пока нет записей</p>
                <p className="text-xs text-muted-foreground mt-1">Загрузите первый звонок или запустите демо-разбор.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {calls.map((c) => <CallRow key={c.id} call={c} onOpen={() => openReport(c.id)} onRemove={() => removeCall(c.id)} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ------------------------------ REPORT ------------------------------ */
  if (view === "report") {
    const a = selected?.analysis;
    if (!selected || !a) {
      return (
        <div className={`flex flex-col h-full min-h-0 overflow-hidden ${className}`}>
          <Header title="Карточка разбора" subtitle="Выберите звонок из списка" />
          <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-2">
            {readyCalls.length === 0 && (
              <div className="glass-card border border-border/50 rounded-2xl p-8 text-center">
                <p className="text-sm text-foreground font-medium">Нет разобранных звонков</p>
                <button onClick={() => onViewChange("upload")} className="mt-3 px-4 py-2 rounded-xl text-xs font-medium text-primary-foreground shadow-glow" style={{ background: "var(--accent-gradient)" }}>Загрузить запись</button>
              </div>
            )}
            {readyCalls.map((c) => <CallRow key={c.id} call={c} onOpen={() => setSelectedId(c.id)} onRemove={() => removeCall(c.id)} />)}
          </div>
        </div>
      );
    }

    const closed = a.discovery.filter((d) => d.closed).length;

    return (
      <div className={`flex flex-col h-full min-h-0 overflow-hidden ${className}`}>
        <div className="px-5 py-3 border-b border-border/50 shrink-0 flex items-center gap-3">
          <button onClick={() => setSelectedId(null)} className="p-1.5 rounded-lg hover:bg-accent/50 text-muted-foreground hover:text-foreground"><ArrowLeft className="w-4 h-4" /></button>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-sm font-semibold text-foreground truncate">{selected.fileName}</h2>
            <p className="text-[11px] text-muted-foreground">{selected.manager} · {selected.service} · {fmtTime(selected.duration)}</p>
          </div>
          <button onClick={() => downloadPdf(selected)}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-border/50 text-muted-foreground hover:text-foreground btn-tactile">
            <FileDown className="w-3.5 h-3.5" /> <span className="hidden sm:inline">PDF-отчёт</span>
          </button>
          <ScoreBadge score={a.score} grade={a.grade} />
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-5 space-y-4 pb-[max(2.5rem,env(safe-area-inset-bottom))]">
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="glass-card border border-border/50 rounded-2xl p-5">
            <p className="text-sm text-foreground leading-relaxed">{a.summary}</p>
            {a.pipelineStageSuggestion && (
              <p className="mt-3 text-xs text-muted-foreground">Рекомендуемая стадия в воронке: <span className="text-primary font-medium">{a.pipelineStageSuggestion}</span></p>
            )}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {a.nextSteps.map((s, i) => (
                <span key={i} className="px-2.5 py-1 rounded-full text-[11px] border border-border/50 bg-background/30 text-muted-foreground">{s}</span>
              ))}
            </div>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-4">
            {/* Discovery */}
            <Section icon={<ListChecks className="w-4 h-4 text-primary" />} title="Скоринг по Discovery-чеклисту" meta={`${closed}/${a.discovery.length}`}>
              <div className="space-y-1.5">
                {a.discovery.map((d) => (
                  <div key={d.key} className="flex items-start gap-2 rounded-xl px-2.5 py-2 hover:bg-background/30">
                    {d.closed ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 text-rose-400/80 shrink-0 mt-0.5" />}
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs leading-snug ${d.closed ? "text-foreground" : "text-muted-foreground"}`}>{d.label}</p>
                      {d.note && <p className="text-[11px] text-muted-foreground mt-0.5">{d.note}</p>}
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70">{d.method}</span>
                    </div>
                    {typeof d.t === "number" && (
                      <button onClick={() => jumpTo(d.t!)} className="shrink-0 text-[11px] tabular-nums text-primary hover:underline">{fmtTime(d.t)}</button>
                    )}
                  </div>
                ))}
              </div>
            </Section>

            {/* Objections */}
            <Section icon={<ShieldAlert className="w-4 h-4 text-primary" />} title="Возражения на звонке" meta={`${a.objections.length}`}>
              <div className="space-y-2">
                {a.objections.map((o) => {
                  const q = QUALITY_META[o.quality];
                  return (
                    <div key={o.id} className="rounded-xl border border-border/40 bg-background/25 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-medium text-foreground leading-snug">«{o.objection}»</p>
                        <button onClick={() => jumpTo(o.t)} className="shrink-0 text-[11px] tabular-nums text-primary hover:underline">{fmtTime(o.t)}</button>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-medium ${q.cls}`}>{q.icon}{q.label}</span>
                        <span className="text-[10px] text-muted-foreground">{o.category}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">{o.recommendation}</p>
                    </div>
                  );
                })}
              </div>
            </Section>
          </div>

          {/* Key moments */}
          <Section icon={<Sparkles className="w-4 h-4 text-primary" />} title="Ключевые моменты" meta={`${a.moments.length}`}>
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-2.5">
              {a.moments.map((m) => (
                <div key={m.id} className="rounded-2xl border border-border/40 bg-background/25 p-3.5">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">{MOMENT_META[m.type].icon}{MOMENT_META[m.type].label}</span>
                    <button onClick={() => jumpTo(m.t)} className="text-[11px] tabular-nums text-primary hover:underline">{fmtTime(m.t)}</button>
                  </div>
                  <p className="text-xs text-foreground italic leading-snug">«{m.quote}»</p>
                  <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">{m.insight}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* Transcript */}
          <Section icon={<FileAudio className="w-4 h-4 text-primary" />} title="Транскрипт" meta={`${a.transcript.length} реплик`}>
            <div className="flex items-center gap-1.5 mb-3 flex-wrap">
              {([["all", "Все"], ["manager", "Менеджер"], ["client", "Клиент"]] as const).map(([k, label]) => (
                <button key={k} onClick={() => setSpeakerFilter(k)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-medium border transition-colors ${
                    speakerFilter === k
                      ? "border-primary/50 bg-primary/15 text-foreground"
                      : "border-border/50 text-muted-foreground hover:text-foreground"
                  }`}>
                  {label}
                </button>
              ))}
            </div>
            <div className="space-y-1.5 max-h-[420px] overflow-y-auto overscroll-contain pr-1">
              {a.transcript
                .filter((l) => speakerFilter === "all" || l.speaker === speakerFilter)
                .map((l, i) => (
                <div key={i} ref={(el) => { lineRefs.current[l.t] = el; }}
                  className={`flex gap-3 rounded-xl px-3 py-2 transition-colors ${activeTime === l.t ? "bg-primary/15 ring-1 ring-primary/40" : "hover:bg-background/30"}`}>
                  <button onClick={() => jumpTo(l.t)}
                    className="text-[11px] tabular-nums text-primary hover:underline shrink-0 pt-0.5">{fmtTime(l.t)}</button>
                  <span className={`text-[11px] font-semibold shrink-0 pt-0.5 w-16 ${l.speaker === "manager" ? "text-primary" : "text-muted-foreground"}`}>
                    {l.speaker === "manager" ? "Менеджер" : "Клиент"}
                  </span>
                  <p className="text-xs text-foreground leading-relaxed">{l.text}</p>
                </div>
              ))}
            </div>
          </Section>

        </div>
      </div>
    );
  }

  /* ----------------------------- ANALYTICS ----------------------------- */
  const avg = readyCalls.length ? Math.round(readyCalls.reduce((s, c) => s + (c.analysis?.score || 0), 0) / readyCalls.length) : 0;
  const objTotal = readyCalls.reduce((s, c) => s + (c.analysis?.objections.length || 0), 0);
  const objGood = readyCalls.reduce((s, c) => s + (c.analysis?.objections.filter((o) => o.quality === "good").length || 0), 0);
  const points = [...readyCalls].reverse().map((c) => c.analysis!.score);

  return (
    <div className={`flex flex-col h-full min-h-0 overflow-hidden ${className}`}>
      <Header title="История и аналитика" subtitle={`${readyCalls.length} разобранных звонков`} />
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-5 space-y-4 pb-[max(2.5rem,env(safe-area-inset-bottom))]">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Metric label="Разборов" value={String(readyCalls.length)} icon={<FileAudio className="w-5 h-5 text-primary" />} />
          <Metric label="Средняя оценка" value={String(avg)} icon={<Target className="w-5 h-5 text-primary" />} />
          <Metric label="Возражений" value={String(objTotal)} icon={<ShieldAlert className="w-5 h-5 text-primary" />} />
          <Metric label="Отработано" value={objTotal ? `${Math.round((objGood / objTotal) * 100)}%` : "—"} icon={<TrendingUp className="w-5 h-5 text-primary" />} />
        </div>

        <div className="glass-card border border-border/50 rounded-[2rem] p-5">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Динамика оценок</p>
          {points.length < 2 ? (
            <p className="text-xs text-muted-foreground py-8 text-center">Нужно минимум два разбора для графика.</p>
          ) : (
            <Sparkline points={points} />
          )}
        </div>

        <div className="space-y-2">
          {readyCalls.map((c) => <CallRow key={c.id} call={c} onOpen={() => openReport(c.id)} onRemove={() => removeCall(c.id)} />)}
        </div>
      </div>
    </div>
  );
}

/* --------------------------- sub-components --------------------------- */

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="px-5 py-4 border-b border-border/50 shrink-0">
      <h2 className="font-display text-base font-semibold text-foreground">{title}</h2>
      <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
    </div>
  );
}

function Section({ icon, title, meta, children }: { icon: JSX.Element; title: string; meta?: string; children: React.ReactNode }) {
  return (
    <div className="glass-card border border-border/50 rounded-[1.5rem] p-4">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h3 className="text-sm font-semibold text-foreground flex-1">{title}</h3>
        {meta && <span className="text-[11px] text-muted-foreground tabular-nums">{meta}</span>}
      </div>
      {children}
    </div>
  );
}

function ScoreBadge({ score, grade }: { score: number; grade: CallGrade }) {
  return (
    <div className="flex items-center gap-2 shrink-0">
      <div className="text-right">
        <p className="font-display text-xl font-bold tabular-nums text-foreground leading-none">{score}</p>
        <p className="text-[10px] text-muted-foreground">из 100</p>
      </div>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center font-display font-bold text-sm"
        style={{ color: GRADE_COLOR[grade], background: `${GRADE_COLOR[grade]}1f`, border: `1px solid ${GRADE_COLOR[grade]}55` }}>
        {grade}
      </div>
    </div>
  );
}

function CallRow({ call, onOpen, onRemove }: { call: CallRecord; onOpen: () => void; onRemove: () => void }) {
  const status = call.status;
  return (
    <div className="glass-card border border-border/50 rounded-2xl px-4 py-3 flex items-center gap-3 hover:border-primary/40 transition-all">
      <div className="w-9 h-9 rounded-xl bg-background/40 border border-border/40 flex items-center justify-center shrink-0">
        {status === "processing" ? <Loader2 className="w-4 h-4 text-primary animate-spin" />
          : status === "queued" ? <Clock className="w-4 h-4 text-muted-foreground" />
          : <FileAudio className="w-4 h-4 text-primary" />}
      </div>
      <button onClick={status === "ready" ? onOpen : undefined} className="min-w-0 flex-1 text-left">
        <p className="text-sm text-foreground truncate">{call.fileName}</p>
        <p className="text-[11px] text-muted-foreground">
          {new Date(call.createdAt).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
          {" · "}{fmtTime(call.duration)}{" · "}{call.manager}
        </p>
      </button>
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground shrink-0 hidden sm:block">
        {status === "queued" ? "в очереди" : status === "processing" ? "обработка" : status === "failed" ? "ошибка" : "готово"}
      </span>
      {call.analysis && <ScoreBadge score={call.analysis.score} grade={call.analysis.grade} />}
      {status === "ready" && (
        <button onClick={onOpen} className="p-1.5 rounded-lg hover:bg-accent/50 text-muted-foreground hover:text-foreground shrink-0"><ChevronRight className="w-4 h-4" /></button>
      )}
      <button onClick={onRemove} className="p-1.5 rounded-lg hover:bg-accent/50 text-muted-foreground hover:text-destructive shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
    </div>
  );
}

function Metric({ label, value, icon }: { label: string; value: string; icon: JSX.Element }) {
  return (
    <div className="glass-card border border-border/50 rounded-[1.5rem] p-4 flex flex-col justify-between min-h-[110px]">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">{label}</p>
      <div className="flex items-end justify-between">
        <span className="font-display text-2xl font-bold text-foreground tabular-nums">{value}</span>
        {icon}
      </div>
    </div>
  );
}

function Sparkline({ points }: { points: number[] }) {
  const w = 600, h = 140, pad = 10;
  const max = 100, min = 0;
  const step = (w - pad * 2) / (points.length - 1);
  const y = (v: number) => h - pad - ((v - min) / (max - min)) * (h - pad * 2);
  const d = points.map((v, i) => `${i === 0 ? "M" : "L"}${pad + i * step},${y(v)}`).join(" ");
  const area = `${d} L${pad + (points.length - 1) * step},${h - pad} L${pad},${h - pad} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-36">
      <defs>
        <linearGradient id="ci-line" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="hsl(var(--primary))" />
          <stop offset="100%" stopColor="hsl(var(--accent))" />
        </linearGradient>
        <linearGradient id="ci-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.35" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[25, 50, 75].map((g) => (
        <line key={g} x1={pad} x2={w - pad} y1={y(g)} y2={y(g)} stroke="hsl(var(--border))" strokeOpacity="0.4" strokeDasharray="3 5" />
      ))}
      <path d={area} fill="url(#ci-area)" />
      <path d={d} fill="none" stroke="url(#ci-line)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((v, i) => (
        <circle key={i} cx={pad + i * step} cy={y(v)} r="3.5" fill="hsl(var(--background))" stroke="hsl(var(--primary))" strokeWidth="2" />
      ))}
    </svg>
  );
}
