import { FileText, Globe, Brain, MessageCircle, Zap, BookOpen, Package, History, Star, GitBranch, Headphones, FileSearch, Shield, Palette, Mic, Users, BookMarked, Briefcase, ListChecks, GitCompare, Calculator, Send, Sparkles, ShieldCheck, ArrowUpRight } from "lucide-react";
import type { ModuleId } from "@/hooks/useModules";

type ToneKey = "primary" | "emerald" | "amber" | "indigo" | "rose" | "violet" | "cyan" | "fuchsia" | "pink" | "teal" | "orange" | "sky" | "yellow" | "blue" | "purple" | "green" | "stone" | "slate";

interface Tool {
  id: string;
  label: string;
  desc: string;
  icon: React.ReactNode;
  tone: ToneKey;
  size?: "sm" | "md" | "lg";
  group: string;
}

interface Props {
  onOpen: (id: string) => void;
  enabledModules: Record<ModuleId, boolean>;
}

// Concrete HSL swatches so icon/text contrast is guaranteed against every theme.
const TONE_MAP: Record<ToneKey, { from: string; to: string; ink: string; ring: string }> = {
  primary:  { from: "hsl(var(--primary) / 0.35)",  to: "hsl(var(--primary) / 0.05)",  ink: "hsl(var(--primary))",         ring: "hsl(var(--primary) / 0.4)" },
  emerald:  { from: "hsl(158 64% 52% / 0.28)",     to: "hsl(158 64% 52% / 0.04)",     ink: "hsl(158 70% 60%)",            ring: "hsl(158 64% 52% / 0.45)" },
  amber:    { from: "hsl(38 92% 55% / 0.28)",      to: "hsl(38 92% 55% / 0.04)",      ink: "hsl(38 95% 65%)",             ring: "hsl(38 92% 55% / 0.45)" },
  indigo:   { from: "hsl(239 84% 67% / 0.28)",     to: "hsl(239 84% 67% / 0.04)",     ink: "hsl(239 90% 75%)",            ring: "hsl(239 84% 67% / 0.45)" },
  rose:     { from: "hsl(347 87% 65% / 0.28)",     to: "hsl(347 87% 65% / 0.04)",     ink: "hsl(347 90% 72%)",            ring: "hsl(347 87% 65% / 0.45)" },
  violet:   { from: "hsl(262 83% 68% / 0.28)",     to: "hsl(262 83% 68% / 0.04)",     ink: "hsl(262 88% 75%)",            ring: "hsl(262 83% 68% / 0.45)" },
  cyan:     { from: "hsl(189 94% 55% / 0.28)",     to: "hsl(189 94% 55% / 0.04)",     ink: "hsl(189 95% 65%)",            ring: "hsl(189 94% 55% / 0.45)" },
  fuchsia:  { from: "hsl(292 85% 65% / 0.28)",     to: "hsl(292 85% 65% / 0.04)",     ink: "hsl(292 88% 72%)",            ring: "hsl(292 85% 65% / 0.45)" },
  pink:     { from: "hsl(330 81% 65% / 0.28)",     to: "hsl(330 81% 65% / 0.04)",     ink: "hsl(330 85% 72%)",            ring: "hsl(330 81% 65% / 0.45)" },
  teal:     { from: "hsl(172 66% 50% / 0.28)",     to: "hsl(172 66% 50% / 0.04)",     ink: "hsl(172 70% 60%)",            ring: "hsl(172 66% 50% / 0.45)" },
  orange:   { from: "hsl(24 95% 60% / 0.28)",      to: "hsl(24 95% 60% / 0.04)",      ink: "hsl(24 95% 68%)",             ring: "hsl(24 95% 60% / 0.45)" },
  sky:      { from: "hsl(199 89% 60% / 0.28)",     to: "hsl(199 89% 60% / 0.04)",     ink: "hsl(199 92% 68%)",            ring: "hsl(199 89% 60% / 0.45)" },
  yellow:   { from: "hsl(48 96% 60% / 0.28)",      to: "hsl(48 96% 60% / 0.04)",      ink: "hsl(48 98% 68%)",             ring: "hsl(48 96% 60% / 0.45)" },
  blue:     { from: "hsl(217 91% 65% / 0.28)",     to: "hsl(217 91% 65% / 0.04)",     ink: "hsl(217 95% 72%)",            ring: "hsl(217 91% 65% / 0.45)" },
  purple:   { from: "hsl(270 80% 68% / 0.28)",     to: "hsl(270 80% 68% / 0.04)",     ink: "hsl(270 85% 75%)",            ring: "hsl(270 80% 68% / 0.45)" },
  green:    { from: "hsl(142 71% 50% / 0.28)",     to: "hsl(142 71% 50% / 0.04)",     ink: "hsl(142 75% 60%)",            ring: "hsl(142 71% 50% / 0.45)" },
  stone:    { from: "hsl(30 8% 55% / 0.28)",       to: "hsl(30 8% 55% / 0.04)",       ink: "hsl(30 10% 72%)",             ring: "hsl(30 8% 55% / 0.45)" },
  slate:    { from: "hsl(215 20% 55% / 0.28)",     to: "hsl(215 20% 55% / 0.04)",     ink: "hsl(215 25% 72%)",            ring: "hsl(215 20% 55% / 0.45)" },
};

// SVG background patterns — vector, borderless, integrated into the tile itself.
const PATTERN_URLS = {
  grid: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Cpath d='M0 20h40M20 0v40' stroke='%23fff' stroke-opacity='0.08' stroke-width='1'/%3E%3C/svg%3E")`,
  dots: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24'%3E%3Ccircle cx='12' cy='12' r='1' fill='%23fff' fill-opacity='0.12'/%3E%3C/svg%3E")`,
  wave: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='60' viewBox='0 0 120 60'%3E%3Cpath d='M0 30 Q30 0 60 30 T120 30' fill='none' stroke='%23fff' stroke-opacity='0.09' stroke-width='1.5'/%3E%3C/svg%3E")`,
  rings: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Ccircle cx='40' cy='40' r='30' fill='none' stroke='%23fff' stroke-opacity='0.08'/%3E%3Ccircle cx='40' cy='40' r='18' fill='none' stroke='%23fff' stroke-opacity='0.06'/%3E%3C/svg%3E")`,
  diag: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16'%3E%3Cpath d='M-4 4L4 -4M0 16L16 0M12 20L20 12' stroke='%23fff' stroke-opacity='0.08' stroke-width='1'/%3E%3C/svg%3E")`,
};

const GROUP_PATTERN: Record<string, keyof typeof PATTERN_URLS> = {
  "Основное": "rings",
  "Тренировка": "diag",
  "AI Studio": "dots",
  "Библиотека": "grid",
  "Модули": "wave",
};

export default function BentoTools({ onOpen, enabledModules }: Props) {
  const tools: Tool[] = [
    { id: "main",             label: "Генератор скриптов",  desc: "Главный инструмент",       icon: <FileText className="w-5 h-5" />,      tone: "primary",  size: "lg",  group: "Основное" },
    { id: "simulator",        label: "Симулятор клиента",   desc: "Тренировка в чате",        icon: <MessageCircle className="w-5 h-5" />, tone: "emerald",  size: "md",  group: "Тренировка" },
    { id: "armory",           label: "Арсенал возражений",  desc: "Готовые скрипты",          icon: <Zap className="w-5 h-5" />,           tone: "amber",    group: "Тренировка" },
    { id: "quiz",             label: "Квиз-тренажёр",       desc: "Проверь знания",           icon: <Brain className="w-5 h-5" />,         tone: "indigo",   group: "Тренировка" },
    { id: "objections",       label: "Тренажёр возражений", desc: "AI-разбор по шагам",       icon: <Shield className="w-5 h-5" />,        tone: "rose",     group: "Тренировка" },

    { id: "scenario-builder", label: "Сценарии",            desc: "Конструктор веток",        icon: <GitBranch className="w-5 h-5" />,     tone: "violet",   group: "AI Studio" },
    { id: "live-call",        label: "Суфлёр",              desc: "Подсказки в звонке",       icon: <Headphones className="w-5 h-5" />,    tone: "cyan",     group: "AI Studio" },
    { id: "pre-call-brief",   label: "Пре-сейл бриф",       desc: "Готовься за минуту",       icon: <FileSearch className="w-5 h-5" />,    tone: "fuchsia",  group: "AI Studio" },
    { id: "sales-style",      label: "Лаборатория стиля",   desc: "Обучи AI вашей манере",    icon: <Palette className="w-5 h-5" />,       tone: "pink",     group: "AI Studio" },
    { id: "call-analyzer",    label: "AI-Аналитик звонков", desc: "Разбор транскриптов",      icon: <Mic className="w-5 h-5" />,           tone: "teal",     group: "AI Studio" },
    { id: "kp-constructor",   label: "Конструктор КП",      desc: "Коммерческие предложения", icon: <FileText className="w-5 h-5" />,      tone: "orange",   group: "AI Studio" },
    { id: "audit",            label: "Аудит сайта",         desc: "SEO/ФЗ/Schema",            icon: <Globe className="w-5 h-5" />,         tone: "sky",      group: "AI Studio" },
    { id: "objection-library",label: "Библиотека возражений", desc: "База ответов",           icon: <Shield className="w-5 h-5" />,        tone: "yellow",   group: "AI Studio" },

    { id: "cases",            label: "Кейсы",               desc: "14+ реальных историй",     icon: <BookOpen className="w-5 h-5" />,      tone: "blue",     group: "Библиотека" },
    { id: "phrases",          label: "Банк фраз",           desc: "Проверенные модули",       icon: <BookMarked className="w-5 h-5" />,    tone: "purple",   group: "Библиотека" },
    { id: "personas",         label: "Персоны клиентов",    desc: "ЛПР, IT, HR и др.",        icon: <Users className="w-5 h-5" />,         tone: "green",    group: "Библиотека" },
    { id: "services",         label: "Услуги",              desc: "Каталог предложений",      icon: <Package className="w-5 h-5" />,       tone: "stone",    group: "Библиотека" },
    { id: "history",          label: "История",             desc: "Последние генерации",      icon: <History className="w-5 h-5" />,       tone: "slate",    group: "Библиотека" },
    { id: "favorites",        label: "Избранное",           desc: "Лучшие скрипты",           icon: <Star className="w-5 h-5" />,          tone: "yellow",   group: "Библиотека" },
  ];

  const moduleTools: Tool[] = [
    { id: "mod-pipeline",     label: "Воронка сделок",       desc: "Канбан",                 icon: <Briefcase className="w-5 h-5" />,   tone: "sky",     group: "Модули" },
    { id: "mod-contacts",     label: "Контакт-карточки",     desc: "Лёгкая CRM",             icon: <Users className="w-5 h-5" />,       tone: "indigo",  group: "Модули" },
    { id: "mod-discovery",    label: "Discovery-чеклист",    desc: "SPIN / BANT",            icon: <ListChecks className="w-5 h-5" />,  tone: "violet",  group: "Модули" },
    { id: "mod-competitors",  label: "Сравнение конкурентов", desc: "AI-таблица",            icon: <GitCompare className="w-5 h-5" />,  tone: "amber",   group: "Модули" },
    { id: "mod-value-calc",   label: "Калькулятор ценности", desc: "Экономика для клиента",  icon: <Calculator className="w-5 h-5" />,  tone: "emerald", group: "Модули" },
    { id: "mod-follow-up",    label: "Follow-up серии",      desc: "Email / Telegram",       icon: <Send className="w-5 h-5" />,        tone: "cyan",    group: "Модули" },
    { id: "mod-wiki",         label: "База знаний",          desc: "Wiki регламентов",       icon: <BookOpen className="w-5 h-5" />,    tone: "blue",    group: "Модули" },
    { id: "mod-voice-rec",    label: "Голосовая запись",     desc: "Запись и транскрипт",    icon: <Mic className="w-5 h-5" />,         tone: "rose",    group: "Модули" },
    { id: "mod-reframe",      label: "Reframe-помощник",     desc: "Переформулировка",       icon: <Sparkles className="w-5 h-5" />,    tone: "fuchsia", group: "Модули" },
    { id: "mod-battle-cards", label: "Battle-cards",         desc: "Одностраничник",         icon: <ShieldCheck className="w-5 h-5" />, tone: "orange",  group: "Модули" },
  ];

  const enabledModuleTools = moduleTools.filter((t) => enabledModules[t.id.replace("mod-", "") as ModuleId]);
  const all = [...tools, ...enabledModuleTools];
  const grouped = all.reduce<Record<string, Tool[]>>((acc, t) => { (acc[t.group] ??= []).push(t); return acc; }, {});

  return (
    <div
      className="h-full overflow-y-auto p-4 sm:p-6 lg:p-10"
      style={{ paddingBottom: "calc(6rem + env(safe-area-inset-bottom, 0px))", WebkitOverflowScrolling: "touch" }}
    >
      <div className="max-w-7xl mx-auto space-y-8 sm:space-y-10">
        <header>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">Все инструменты</h1>
          <p className="text-sm text-muted-foreground mt-1">Выберите, с чего начать</p>
        </header>

        {Object.entries(grouped).map(([group, items]) => {
          const pattern = PATTERN_URLS[GROUP_PATTERN[group] ?? "grid"];
          return (
            <section key={group}>
              <h2 className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-3 font-semibold">{group}</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 auto-rows-[148px]">
                {items.map((t) => {
                  const c = TONE_MAP[t.tone];
                  const isLarge = t.size === "lg";
                  return (
                    <button
                      key={t.id}
                      onClick={() => onOpen(t.id)}
                      className={`group relative overflow-hidden rounded-2xl border p-4 text-left btn-tactile transition-all duration-300 hover:scale-[1.015] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                        isLarge ? "col-span-2 row-span-2" : ""
                      }`}
                      style={{
                        borderColor: c.ring,
                        background: `radial-gradient(120% 100% at 0% 0%, ${c.from} 0%, transparent 55%), linear-gradient(135deg, ${c.to} 0%, hsl(var(--card) / 0.65) 100%)`,
                      }}
                    >
                      {/* Borderless pattern cover — vector, wired into the tile */}
                      <div
                        className="absolute inset-0 opacity-70 pointer-events-none"
                        style={{ backgroundImage: pattern, backgroundSize: isLarge ? "80px 80px" : "40px 40px" }}
                      />
                      {/* Soft glow blob positioned to feel embedded, not stuck on top */}
                      <div
                        className="absolute -top-8 -right-8 w-32 h-32 rounded-full pointer-events-none blur-2xl opacity-70 group-hover:opacity-100 transition-opacity"
                        style={{ background: `radial-gradient(closest-side, ${c.from}, transparent 70%)` }}
                      />

                      <div className="relative flex flex-col h-full">
                        <div
                          className="tool-icon-animated w-11 h-11 rounded-xl flex items-center justify-center mb-3 shrink-0"
                          style={{
                            color: c.ink,
                            background: "hsl(var(--card) / 0.7)",
                            boxShadow: `inset 0 0 0 1px ${c.ring}, 0 6px 18px ${c.from}`,
                            backdropFilter: "blur(6px)",
                          }}
                        >
                          {t.icon}
                        </div>

                        <div className="mt-auto">
                          <p className={`font-semibold text-foreground ${isLarge ? "text-base sm:text-lg" : "text-sm"}`}>
                            {t.label}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{t.desc}</p>
                        </div>

                        <ArrowUpRight
                          className="absolute top-0 right-0 w-4 h-4 opacity-0 group-hover:opacity-90 -translate-x-1 translate-y-1 group-hover:translate-x-0 group-hover:translate-y-0 transition-all"
                          style={{ color: c.ink }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
