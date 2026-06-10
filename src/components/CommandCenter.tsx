import { Sparkles, History, Star, MessageCircle, FileText, Zap, BookOpen, Briefcase, ShieldCheck } from "lucide-react";

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

  const quickActions = [
    { id: "main",       label: "Сгенерировать скрипт", icon: <Sparkles className="w-4 h-4" />,    color: "from-primary/30 to-primary/5",         onClick: onQuickGenerate },
    { id: "simulator",  label: "Тренировка с клиентом", icon: <MessageCircle className="w-4 h-4" />, color: "from-emerald-500/25 to-emerald-500/5", onClick: () => onOpenPanel("simulator") },
    { id: "pre-call-brief", label: "Пре-сейл бриф",    icon: <FileText className="w-4 h-4" />,    color: "from-violet-500/25 to-violet-500/5",   onClick: () => onOpenPanel("pre-call-brief") },
    { id: "kp-constructor", label: "Конструктор КП",   icon: <FileText className="w-4 h-4" />,    color: "from-amber-500/25 to-amber-500/5",     onClick: () => onOpenPanel("kp-constructor") },
  ];

  const moduleQuick = [
    { id: "mod-pipeline",     enabled: modulesEnabled.pipeline,      label: "Воронка",      icon: <Briefcase className="w-4 h-4" /> },
    { id: "mod-battle-cards", enabled: modulesEnabled["battle-cards"], label: "Battle-cards", icon: <ShieldCheck className="w-4 h-4" /> },
    { id: "mod-wiki",         enabled: modulesEnabled.wiki,          label: "Wiki",         icon: <BookOpen className="w-4 h-4" /> },
  ].filter((m) => m.enabled);

  return (
    <div className="h-full overflow-y-auto p-6 lg:p-10 pb-20">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Greeting */}
        <header className="space-y-1">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">{new Date().toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" })}</p>
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-foreground">{greeting}{userName ? `, ${userName}` : ""}</h1>
          <p className="text-sm text-muted-foreground">Что делаем сегодня?</p>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Генераций" value={historyCount} icon={<History className="w-4 h-4" />} />
          <StatCard label="Избранных" value={favoritesCount} icon={<Star className="w-4 h-4" />} />
          <StatCard label="Активных модулей" value={Object.values(modulesEnabled).filter(Boolean).length} icon={<Zap className="w-4 h-4" />} />
          <StatCard label="Сегодня" value={recentItems.filter((r) => Date.now() - r.timestamp < 24 * 3600 * 1000).length} icon={<Sparkles className="w-4 h-4" />} />
        </div>

        {/* Quick actions */}
        <section>
          <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-3 font-medium">Быстрые действия</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {quickActions.map((a) => (
              <button key={a.id} onClick={a.onClick}
                className={`group relative overflow-hidden rounded-2xl border border-border/50 p-5 text-left bg-gradient-to-br ${a.color} hover:border-primary/40 hover:scale-[1.02] transition-all btn-tactile`}>
                <div className="w-10 h-10 rounded-xl bg-background/40 backdrop-blur flex items-center justify-center text-primary mb-3">{a.icon}</div>
                <p className="text-sm font-semibold text-foreground">{a.label}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Modules row */}
        {moduleQuick.length > 0 && (
          <section>
            <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-3 font-medium">Ваши модули</h2>
            <div className="flex flex-wrap gap-2">
              {moduleQuick.map((m) => (
                <button key={m.id} onClick={() => onOpenPanel(m.id)} className="flex items-center gap-2 px-4 py-2 rounded-full glass-card border border-border/50 hover:border-primary/40 hover:text-primary text-sm text-foreground transition-all btn-tactile">
                  {m.icon}{m.label}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Recent */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Недавние генерации</h2>
            <button onClick={() => onOpenPanel("history")} className="text-xs text-primary hover:underline">Все →</button>
          </div>
          {recentItems.length === 0 ? (
            <div className="glass-card border border-border/50 rounded-2xl p-8 text-center text-sm text-muted-foreground">Пока ничего нет — начните с быстрой генерации</div>
          ) : (
            <div className="space-y-2">
              {recentItems.slice(0, 5).map((r) => (
                <button key={r.id} onClick={() => onLoadHistory((r as any).content)} className="w-full text-left glass-card border border-border/50 rounded-xl px-4 py-3 hover:border-primary/40 transition-all btn-tactile">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{r.label}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{r.service} · {r.mode} · {new Date(r.timestamp).toLocaleString("ru-RU")}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="glass-card border border-border/50 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-2"><span className="text-muted-foreground">{icon}</span></div>
      <p className="text-2xl font-bold text-foreground tabular-nums">{value}</p>
      <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}
