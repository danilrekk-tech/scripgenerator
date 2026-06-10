import { FileText, Globe, Brain, MessageCircle, Zap, BookOpen, Package, History, Star, GitBranch, Headphones, FileSearch, Shield, Palette, Mic, Users, BookMarked, Briefcase, ListChecks, GitCompare, Calculator, Send, Sparkles, ShieldCheck } from "lucide-react";
import type { ModuleId } from "@/hooks/useModules";

interface Tool { id: string; label: string; desc: string; icon: React.ReactNode; tone: string; size?: "sm" | "md" | "lg"; group: string; }

interface Props {
  onOpen: (id: string) => void;
  enabledModules: Record<ModuleId, boolean>;
}

export default function BentoTools({ onOpen, enabledModules }: Props) {
  const tools: Tool[] = [
    { id: "main",            label: "Генератор скриптов",  desc: "Главный инструмент",       icon: <FileText className="w-5 h-5" />,    tone: "from-primary/30 to-primary/5", size: "lg",  group: "Основное" },
    { id: "simulator",       label: "Симулятор клиента",   desc: "Тренировка в чате",        icon: <MessageCircle className="w-5 h-5" />, tone: "from-emerald-500/25 to-emerald-500/5", size: "md", group: "Тренировка" },
    { id: "armory",          label: "Арсенал возражений",  desc: "Готовые скрипты",          icon: <Zap className="w-5 h-5" />,         tone: "from-amber-500/25 to-amber-500/5",  group: "Тренировка" },
    { id: "quiz",            label: "Квиз-тренажёр",       desc: "Проверь знания",           icon: <Brain className="w-5 h-5" />,       tone: "from-indigo-500/25 to-indigo-500/5", group: "Тренировка" },
    { id: "objections",      label: "Тренажёр возражений", desc: "AI-разбор по шагам",       icon: <Shield className="w-5 h-5" />,      tone: "from-rose-500/25 to-rose-500/5",   group: "Тренировка" },

    { id: "scenario-builder", label: "Сценарии",           desc: "Конструктор веток",        icon: <GitBranch className="w-5 h-5" />,   tone: "from-violet-500/25 to-violet-500/5", group: "AI Studio" },
    { id: "live-call",       label: "Суфлёр",             desc: "Подсказки в звонке",       icon: <Headphones className="w-5 h-5" />,  tone: "from-cyan-500/25 to-cyan-500/5",   group: "AI Studio" },
    { id: "pre-call-brief",  label: "Пре-сейл бриф",       desc: "Готовься за минуту",       icon: <FileSearch className="w-5 h-5" />,  tone: "from-fuchsia-500/25 to-fuchsia-500/5", group: "AI Studio" },
    { id: "sales-style",     label: "Лаборатория стиля",   desc: "Обучи AI вашей манере",    icon: <Palette className="w-5 h-5" />,     tone: "from-pink-500/25 to-pink-500/5",   group: "AI Studio" },
    { id: "call-analyzer",   label: "AI-Аналитик звонков", desc: "Разбор транскриптов",      icon: <Mic className="w-5 h-5" />,         tone: "from-teal-500/25 to-teal-500/5",   group: "AI Studio" },
    { id: "kp-constructor",  label: "Конструктор КП",      desc: "Коммерческие предложения", icon: <FileText className="w-5 h-5" />,    tone: "from-orange-500/25 to-orange-500/5", group: "AI Studio" },
    { id: "audit",           label: "Аудит сайта",         desc: "SEO/ФЗ/Schema",            icon: <Globe className="w-5 h-5" />,       tone: "from-sky-500/25 to-sky-500/5",     group: "AI Studio" },
    { id: "objection-library", label: "Библиотека возражений", desc: "База ответов",         icon: <Shield className="w-5 h-5" />,      tone: "from-yellow-500/25 to-yellow-500/5", group: "AI Studio" },

    { id: "cases",           label: "Кейсы",               desc: "14+ реальных историй",     icon: <BookOpen className="w-5 h-5" />,    tone: "from-blue-500/25 to-blue-500/5",   group: "Библиотека" },
    { id: "phrases",         label: "Банк фраз",           desc: "Проверенные модули",       icon: <BookMarked className="w-5 h-5" />,  tone: "from-purple-500/25 to-purple-500/5", group: "Библиотека" },
    { id: "personas",        label: "Персоны клиентов",    desc: "ЛПР, IT, HR и др.",       icon: <Users className="w-5 h-5" />,       tone: "from-green-500/25 to-green-500/5", group: "Библиотека" },
    { id: "services",        label: "Услуги",              desc: "Каталог предложений",      icon: <Package className="w-5 h-5" />,     tone: "from-stone-500/25 to-stone-500/5", group: "Библиотека" },
    { id: "history",         label: "История",             desc: "Последние генерации",      icon: <History className="w-5 h-5" />,     tone: "from-slate-500/25 to-slate-500/5", group: "Библиотека" },
    { id: "favorites",       label: "Избранное",           desc: "Лучшие скрипты",           icon: <Star className="w-5 h-5" />,        tone: "from-yellow-400/25 to-yellow-400/5", group: "Библиотека" },
  ];

  const moduleTools: Tool[] = [
    { id: "mod-pipeline",     label: "Воронка сделок",      desc: "Канбан",              icon: <Briefcase className="w-5 h-5" />,   tone: "from-sky-500/25 to-sky-500/5",     group: "Модули" },
    { id: "mod-contacts",     label: "Контакт-карточки",    desc: "Лёгкая CRM",          icon: <Users className="w-5 h-5" />,       tone: "from-indigo-500/25 to-indigo-500/5", group: "Модули" },
    { id: "mod-discovery",    label: "Discovery-чеклист",   desc: "SPIN / BANT",         icon: <ListChecks className="w-5 h-5" />,  tone: "from-violet-500/25 to-violet-500/5", group: "Модули" },
    { id: "mod-competitors",  label: "Сравнение конкурентов", desc: "AI-таблица",        icon: <GitCompare className="w-5 h-5" />,  tone: "from-amber-500/25 to-amber-500/5",   group: "Модули" },
    { id: "mod-value-calc",   label: "Калькулятор ценности", desc: "Экономика для клиента", icon: <Calculator className="w-5 h-5" />, tone: "from-emerald-500/25 to-emerald-500/5", group: "Модули" },
    { id: "mod-follow-up",    label: "Follow-up серии",     desc: "Email / Telegram",    icon: <Send className="w-5 h-5" />,        tone: "from-cyan-500/25 to-cyan-500/5",     group: "Модули" },
    { id: "mod-wiki",         label: "База знаний",         desc: "Wiki регламентов",    icon: <BookOpen className="w-5 h-5" />,    tone: "from-blue-500/25 to-blue-500/5",     group: "Модули" },
    { id: "mod-voice-rec",    label: "Голосовая запись",    desc: "Запись и транскрипт", icon: <Mic className="w-5 h-5" />,         tone: "from-rose-500/25 to-rose-500/5",     group: "Модули" },
    { id: "mod-reframe",      label: "Reframe-помощник",    desc: "Переформулировка",    icon: <Sparkles className="w-5 h-5" />,    tone: "from-fuchsia-500/25 to-fuchsia-500/5", group: "Модули" },
    { id: "mod-battle-cards", label: "Battle-cards",        desc: "Одностраничник",      icon: <ShieldCheck className="w-5 h-5" />, tone: "from-orange-500/25 to-orange-500/5", group: "Модули" },
  ];

  const enabledModuleTools = moduleTools.filter((t) => enabledModules[t.id.replace("mod-", "") as ModuleId]);
  const all = [...tools, ...enabledModuleTools];

  const grouped = all.reduce<Record<string, Tool[]>>((acc, t) => { (acc[t.group] ??= []).push(t); return acc; }, {});

  return (
    <div className="h-full overflow-y-auto p-6 lg:p-10 pb-20">
      <div className="max-w-7xl mx-auto space-y-10">
        <header>
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-foreground">Все инструменты</h1>
          <p className="text-sm text-muted-foreground mt-1">Выберите, с чего начать</p>
        </header>

        {Object.entries(grouped).map(([group, items]) => (
          <section key={group}>
            <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-3 font-medium">{group}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 auto-rows-[140px]">
              {items.map((t) => (
                <button key={t.id} onClick={() => onOpen(t.id)}
                  className={`group relative overflow-hidden rounded-2xl border border-border/50 p-4 text-left bg-gradient-to-br ${t.tone} hover:border-primary/40 hover:scale-[1.02] hover:shadow-lg transition-all btn-tactile ${t.size === "lg" ? "col-span-2 row-span-2" : ""}`}>
                  <div className="w-10 h-10 rounded-xl bg-background/40 backdrop-blur flex items-center justify-center text-primary mb-3">{t.icon}</div>
                  <p className="text-sm font-semibold text-foreground">{t.label}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{t.desc}</p>
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
