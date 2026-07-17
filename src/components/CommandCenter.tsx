import { Sparkles, History, Star, MessageCircle, FileText, Zap, BookOpen, Briefcase, ShieldCheck, Rocket, ArrowUpRight, TrendingUp, Layers } from "lucide-react";

interface Props {
  historyCount: number;
  favoritesCount: number;
  recentItems: { id: string; label: string; mode: string; service: string; timestamp: number }[];
  onQuickGenerate: () => void;
  onOpenPanel: (panel: string) => void;
  onLoadHistory: (content: string) => void;
  modulesEnabled: Record<string, boolean>;
  userName?: string;
}

export default function CommandCenter({
  historyCount, favoritesCount, recentItems, onQuickGenerate, onOpenPanel, onLoadHistory, modulesEnabled, userName,
}: Props) {
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 6) return "Доброй ночи";
    if (h < 12) return "Доброе утро";
    if (h < 18) return "Добрый день";
    return "Добрый вечер";
  })();

  const activeModules = Object.values(modulesEnabled).filter(Boolean).length;
  const todayCount = recentItems.filter((r) => Date.now() - r.timestamp < 24 * 3600 * 1000).length;

  const moduleQuick = [
    { id: "mod-pipeline",     enabled: modulesEnabled.pipeline,      label: "Воронка",      icon: <Briefcase className="w-4 h-4" /> },
    { id: "mod-battle-cards", enabled: modulesEnabled["battle-cards"], label: "Battle-cards", icon: <ShieldCheck className="w-4 h-4" /> },
    { id: "mod-wiki",         enabled: modulesEnabled.wiki,          label: "Wiki",         icon: <BookOpen className="w-4 h-4" /> },
  ].filter((m) => m.enabled);

  return (
    <div className="h-full overflow-y-auto relative">
      {/* Ambient glows */}
      <div className="pointer-events-none absolute -top-24 -left-24 w-[420px] h-[420px] rounded-full opacity-40 blur-[120px]" style={{ background: 'radial-gradient(circle, hsl(var(--primary)/0.4), transparent 70%)' }} />
      <div className="pointer-events-none absolute -bottom-24 -right-24 w-[420px] h-[420px] rounded-full opacity-30 blur-[120px]" style={{ background: 'radial-gradient(circle, hsl(var(--accent)/0.5), transparent 70%)' }} />

      <div className="relative p-6 lg:p-10 pb-24 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground/70">{new Date().toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" })}</p>
            <h1 className="font-display text-3xl lg:text-4xl font-bold tracking-tight text-foreground mt-1">
              {greeting}{userName ? `, ${userName}` : ""}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              <p className="text-sm text-muted-foreground">Командный центр · {activeModules} модулей активно</p>
            </div>
          </div>
          <button onClick={onQuickGenerate}
            className="group px-5 py-3 rounded-2xl font-semibold text-primary-foreground shadow-glow btn-tactile flex items-center gap-2 hover:scale-[1.02] transition-all"
            style={{ background: 'var(--accent-gradient)' }}>
            <Sparkles className="w-4 h-4" />
            Новый скрипт
            <ArrowUpRight className="w-4 h-4 opacity-70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </header>

        {/* Bento grid */}
        <div className="grid grid-cols-4 gap-4 lg:gap-5">
          {/* Big hero — Generator */}
          <button onClick={onQuickGenerate}
            className="col-span-4 lg:col-span-2 lg:row-span-2 group relative overflow-hidden rounded-[2rem] p-8 text-left border border-border/50 glass-card hover:border-accent/40 transition-all btn-tactile min-h-[280px] flex flex-col justify-between"
            style={{ background: 'linear-gradient(135deg, hsl(var(--card)/0.6), hsl(var(--background)/0.4))' }}>
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-30 blur-3xl" style={{ background: 'hsl(var(--accent))' }} />
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl border border-border/40 bg-background/30 flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-display text-2xl font-bold text-foreground mb-2">Генератор скриптов</h3>
              <p className="text-muted-foreground leading-relaxed max-w-sm">AI-разметка диалога с адаптацией под персону клиента и стиль менеджера.</p>
            </div>
            <div className="relative mt-6">
              <div className="flex gap-2 mb-4">
                <span className="px-3 py-1 rounded-full text-xs text-accent border border-border/40 bg-background/20">Sales</span>
                <span className="px-3 py-1 rounded-full text-xs text-accent border border-border/40 bg-background/20">Retention</span>
                <span className="px-3 py-1 rounded-full text-xs text-accent border border-border/40 bg-background/20">Objections</span>
              </div>
              <div className="h-1.5 w-full rounded-full overflow-hidden bg-background/40">
                <div className="h-full w-2/3 rounded-full" style={{ background: 'var(--accent-gradient)' }} />
              </div>
            </div>
          </button>

          {/* Simulator */}
          <button onClick={() => onOpenPanel("simulator")}
            className="col-span-4 lg:col-span-2 group relative overflow-hidden rounded-[2rem] p-6 border border-border/50 glass-card hover:border-accent/40 transition-all btn-tactile flex items-center gap-5 min-h-[130px] text-left">
            <div className="shrink-0 w-20 h-20 rounded-2xl p-[1.5px]" style={{ background: 'var(--accent-gradient)' }}>
              <div className="w-full h-full rounded-2xl bg-background/70 flex items-center justify-center">
                <MessageCircle className="w-8 h-8 text-accent" />
              </div>
            </div>
            <div className="min-w-0">
              <h4 className="font-display text-lg font-semibold text-foreground">Симулятор клиента</h4>
              <p className="text-sm text-muted-foreground mt-1">Тренируй закрытие возражений против 12 типов персон.</p>
            </div>
          </button>

          {/* Micro stat: history */}
          <div className="col-span-2 lg:col-span-1 glass-card border border-border/50 rounded-[2rem] p-5 flex flex-col justify-between min-h-[130px]">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Генераций</p>
            <div className="flex items-end justify-between">
              <span className="font-display text-3xl font-bold text-foreground tabular-nums">{historyCount}</span>
              <History className="w-5 h-5 text-accent/70" />
            </div>
          </div>

          {/* Micro stat: favorites */}
          <div className="col-span-2 lg:col-span-1 glass-card border border-border/50 rounded-[2rem] p-5 flex flex-col justify-between min-h-[130px]">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Избранное</p>
            <div className="flex items-end justify-between">
              <span className="font-display text-3xl font-bold text-foreground tabular-nums">{favoritesCount}</span>
              <Star className="w-5 h-5 text-accent/70" />
            </div>
          </div>

          {/* Quick actions row */}
          <button onClick={() => onOpenPanel("pre-call-brief")}
            className="col-span-2 lg:col-span-1 glass-card border border-border/50 rounded-[2rem] p-5 hover:border-accent/40 transition-all btn-tactile text-left min-h-[130px] flex flex-col justify-between">
            <FileText className="w-5 h-5 text-accent" />
            <div>
              <p className="font-semibold text-foreground text-sm">Пре-сейл бриф</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Готовься к звонку</p>
            </div>
          </button>

          <button onClick={() => onOpenPanel("kp-constructor")}
            className="col-span-2 lg:col-span-1 glass-card border border-border/50 rounded-[2rem] p-5 hover:border-accent/40 transition-all btn-tactile text-left min-h-[130px] flex flex-col justify-between">
            <Layers className="w-5 h-5 text-accent" />
            <div>
              <p className="font-semibold text-foreground text-sm">Конструктор КП</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Собери предложение</p>
            </div>
          </button>

          {/* Today ticker */}
          <div className="col-span-4 lg:col-span-2 glass-card border border-border/50 rounded-[2rem] p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'hsl(var(--primary)/0.2)' }}>
                <TrendingUp className="w-5 h-5 text-accent" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">Сегодня: {todayCount} генераций</p>
                <p className="text-[11px] text-muted-foreground">{activeModules} модулей · {historyCount} всего</p>
              </div>
            </div>
            {moduleQuick.length > 0 && (
              <div className="hidden sm:flex gap-1.5">
                {moduleQuick.slice(0, 3).map((m) => (
                  <button key={m.id} onClick={(e) => { e.stopPropagation(); onOpenPanel(m.id); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-background/40 border border-border/40 hover:border-accent/40 hover:text-accent text-muted-foreground transition-all">
                    {m.icon}{m.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Recent row full-width */}
          <div className="col-span-4 glass-card border border-border/50 rounded-[2rem] p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'hsl(var(--primary)/0.2)' }}>
                  <History className="w-5 h-5 text-accent" />
                </div>
                <h3 className="font-display font-semibold text-foreground">Недавние генерации</h3>
              </div>
              <button onClick={() => onOpenPanel("history")} className="text-xs text-accent hover:underline flex items-center gap-1">
                Все <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>

            {recentItems.length === 0 ? (
              <div className="py-10 flex flex-col items-center gap-3 text-center">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'hsl(var(--accent)/0.15)' }}>
                  <Rocket className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">Время первой генерации</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm">Здесь появятся ваши скрипты, КП и аналитика. Начните с кнопки «Новый скрипт».</p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-border/30">
                {recentItems.slice(0, 5).map((r) => (
                  <button key={r.id} onClick={() => onLoadHistory((r as any).content)}
                    className="w-full text-left py-3 flex items-center justify-between gap-4 hover:bg-background/20 rounded-xl px-2 transition-all btn-tactile">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-2 h-2 rounded-full bg-accent shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm text-foreground truncate">{r.label}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{r.service} · {r.mode}</p>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground shrink-0">{new Date(r.timestamp).toLocaleString("ru-RU", { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
