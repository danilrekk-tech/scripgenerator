import { useMemo, useState, useCallback } from "react";
import { BarChart3, TrendingUp, Clock, Target, Zap, RefreshCw } from "lucide-react";
import type { HistoryItem } from "@/hooks/useHistory";

interface Props {
  history: HistoryItem[];
  className?: string;
  serviceNames: string[];
}

const MODE_LABELS: Record<string, string> = {
  script: "Скрипт", "service-info": "Услуга", arguments: "Аргументы",
  "buffer-questions": "Вопросы", "transcript-analysis": "Анализ", email: "Письмо",
  "knowledge-base": "База знаний", dozim: "Дожим", messenger: "Мессенджер",
  "touch-chain": "Цепочка", funnel: "Воронка", "anti-script": "Антискрипт",
  utp: "УТП", sms: "SMS", voicemail: "Автоответчик", "social-posts": "Посты",
  "crm-template": "CRM", checklist: "Чек-лист", glossary: "Глоссарий",
};

const DAILY_CHALLENGES = [
  "Отработай возражение «Дорого» за 3 предложения",
  "Продай SEO клиенту который не знает что это",
  "Запиши голосовое сообщение клиенту за 20 секунд",
  "Придумай УТП для наполнения контентом за 1 минуту",
  "Ответь на «У нас уже есть подрядчик» без критики конкурентов",
  "Продай аудит сайта скептичному IT-директору",
  "Напиши follow-up письмо за 2 минуты",
  "Назови 5 выгод SEO без слова «трафик»",
];

export default function ActivityDashboard({ history, className, serviceNames }: Props) {
  const [dailyChallenge] = useState(() => {
    const day = Math.floor(Date.now() / 86400000);
    return DAILY_CHALLENGES[day % DAILY_CHALLENGES.length];
  });
  const [challengeDone, setChallengeDone] = useState(false);

  const stats = useMemo(() => {
    const now = Date.now();
    const today = history.filter(h => now - h.timestamp < 86400000).length;
    const week = history.filter(h => now - h.timestamp < 604800000).length;
    const month = history.filter(h => now - h.timestamp < 2592000000).length;

    const modeCounts: Record<string, number> = {};
    const serviceCounts: Record<string, number> = {};
    const dayCounts: Record<string, number> = {};
    
    history.forEach(h => {
      modeCounts[h.mode] = (modeCounts[h.mode] || 0) + 1;
      serviceCounts[h.service] = (serviceCounts[h.service] || 0) + 1;
      const day = new Date(h.timestamp).toLocaleDateString("ru-RU");
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    });

    const topMode = Object.entries(modeCounts).sort((a, b) => b[1] - a[1])[0];
    const topService = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1])[0];

    return { today, week, month, total: history.length, modeCounts, serviceCounts, dayCounts, topMode, topService };
  }, [history]);

  const maxModeCount = Math.max(...Object.values(stats.modeCounts), 1);
  const maxServiceCount = Math.max(...Object.values(stats.serviceCounts), 1);

  return (
    <div className={`flex flex-col h-full overflow-y-auto ${className || ""}`}>
      <div className="p-6 border-b border-border/50 shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Дашборд активности</h2>
        </div>
        <p className="text-xs text-muted-foreground">Статистика и аналитика генераций</p>
      </div>

      <div className="p-6 space-y-6 flex-1">
        {/* Daily challenge */}
        <div className={`glass-card border rounded-xl p-4 ${challengeDone ? "border-green-500/30 bg-green-500/5" : "border-primary/30"}`}>
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-primary" />
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Вызов дня</p>
          </div>
          <p className="text-sm font-medium text-foreground">{dailyChallenge}</p>
          <button onClick={() => setChallengeDone(!challengeDone)}
            className={`mt-3 text-xs px-3 py-1.5 rounded-lg btn-tactile ${challengeDone ? "bg-green-500/10 text-green-500 border border-green-500/30" : "bg-primary text-primary-foreground"}`}>
            {challengeDone ? "✓ Выполнено!" : "Отметить выполненным"}
          </button>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={<Clock className="w-4 h-4" />} label="Сегодня" value={stats.today} />
          <StatCard icon={<TrendingUp className="w-4 h-4" />} label="Неделя" value={stats.week} />
          <StatCard icon={<BarChart3 className="w-4 h-4" />} label="Месяц" value={stats.month} />
          <StatCard icon={<Target className="w-4 h-4" />} label="Всего" value={stats.total} />
        </div>

        {/* Mode heatmap */}
        {Object.keys(stats.modeCounts).length > 0 && (
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3">По режимам</p>
            <div className="space-y-1.5">
              {Object.entries(stats.modeCounts).sort((a, b) => b[1] - a[1]).map(([mode, count]) => (
                <div key={mode} className="flex items-center gap-2">
                  <span className="text-xs text-foreground w-24 shrink-0 truncate">{MODE_LABELS[mode] || mode}</span>
                  <div className="flex-1 h-5 bg-border/20 rounded-md overflow-hidden">
                    <div className="h-full bg-primary/30 rounded-md transition-all" style={{ width: `${(count / maxModeCount) * 100}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground w-6 text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Service heatmap */}
        {Object.keys(stats.serviceCounts).length > 0 && (
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3">По услугам</p>
            <div className="space-y-1.5">
              {Object.entries(stats.serviceCounts).sort((a, b) => b[1] - a[1]).map(([svc, count]) => (
                <div key={svc} className="flex items-center gap-2">
                  <span className="text-xs text-foreground w-28 shrink-0 truncate">{svc}</span>
                  <div className="flex-1 h-5 bg-border/20 rounded-md overflow-hidden">
                    <div className="h-full bg-accent-foreground/20 rounded-md transition-all" style={{ width: `${(count / maxServiceCount) * 100}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground w-6 text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {stats.topMode && (
          <div className="glass-card border border-border/50 rounded-xl p-4 text-xs text-muted-foreground space-y-1">
            <p>🏆 Самый используемый режим: <span className="text-foreground font-medium">{MODE_LABELS[stats.topMode[0]] || stats.topMode[0]}</span> ({stats.topMode[1]})</p>
            {stats.topService && <p>📦 Популярная услуга: <span className="text-foreground font-medium">{stats.topService[0]}</span> ({stats.topService[1]})</p>}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="glass-card border border-border/50 rounded-xl p-4">
      <div className="flex items-center gap-1.5 text-muted-foreground mb-2">{icon}<span className="text-[10px] uppercase tracking-wider">{label}</span></div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}
