import { useMemo } from "react";
import { Sparkles, PhoneCall, AudioLines, ShieldQuestion, Bot, FileSignature, Send, History, Users, LayoutGrid } from "lucide-react";
import QuickActionCard from "./QuickActionCard";
import type { LiteModuleId } from "@/hooks/useLiteModules";

interface Scenario {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  /** модуль, который нужно включить, чтобы сценарий был доступен */
  requires: LiteModuleId;
  /** модули, которые сценарий использует под капотом (показываем шагами) */
  steps?: string[];
}

const SCENARIOS: Scenario[] = [
  { id: "script", label: "Создать скрипт", description: "Быстро собрать скрипт продаж под услугу и ситуацию", icon: Sparkles, requires: "scripts" },
  {
    id: "prepare", label: "Подготовиться к звонку", description: "Клиент, сайт, история, что продаём и план разговора",
    icon: PhoneCall, requires: "pre-call-brief",
    steps: ["Клиент", "Сайт", "История", "Что продаём", "Рекомендации AI", "План звонка"],
  },
  { id: "analyze", label: "Анализировать звонок", description: "Расшифровка записи, оценка и разбор возражений", icon: AudioLines, requires: "calls" },
  { id: "objection", label: "Отработать возражение", description: "Готовые ответы на частые возражения клиента", icon: ShieldQuestion, requires: "objections" },
  { id: "train", label: "Потренироваться с AI-клиентом", description: "Диалог с виртуальным клиентом и оценка навыка", icon: Bot, requires: "simulator" },
  { id: "kp", label: "Собрать КП", description: "Коммерческое предложение за минуту", icon: FileSignature, requires: "kp" },
  { id: "followup", label: "Написать follow-up", description: "Цепочка касаний после разговора", icon: Send, requires: "follow-up" },
  { id: "clients", label: "Открыть клиентов", description: "Карточки компаний, ЛПР и заметки", icon: Users, requires: "clients" },
  { id: "history", label: "Вернуться к прошлым материалам", description: "Все сохранённые генерации", icon: History, requires: "history" },
];

interface Props {
  isEnabled: (id: LiteModuleId) => boolean;
  onOpen: (id: LiteModuleId) => void;
  onOpenModules: () => void;
}

export default function LightweightHome({ isEnabled, onOpen, onOpenModules }: Props) {
  const available = useMemo(() => SCENARIOS.filter((s) => isEnabled(s.requires)), [isEnabled]);
  const prepare = available.find((s) => s.id === "prepare");

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 5) return "Доброй ночи";
    if (h < 12) return "Доброе утро";
    if (h < 18) return "Добрый день";
    return "Добрый вечер";
  }, []);

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-3xl px-5 py-8 pb-28 sm:px-8 sm:py-12">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">{greeting}</p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-foreground sm:text-4xl">Что будем делать?</h1>
        <p className="mt-2 text-sm text-muted-foreground">Выберите действие — остальное подставится автоматически.</p>

        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          {available.map((s) => (
            <QuickActionCard key={s.id} label={s.label} description={s.description} icon={s.icon} onClick={() => onOpen(s.requires)} />
          ))}
        </div>

        {prepare?.steps && (
          <div className="mt-8 rounded-2xl border border-border/60 bg-card/30 p-4">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Подготовка к звонку — шаги</p>
            <ol className="mt-3 grid gap-2 sm:grid-cols-3">
              {prepare.steps.map((step, i) => (
                <li key={step} className="flex items-center gap-2 text-[13px] text-foreground">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full border border-border/60 text-[10px] text-muted-foreground">{i + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        )}

        <button
          onClick={onOpenModules}
          className="mt-8 flex items-center gap-2 rounded-xl border border-border/60 px-3.5 py-2.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
        >
          <LayoutGrid className="h-3.5 w-3.5" /> Настроить набор модулей
        </button>
      </div>
    </div>
  );
}
