import { useState } from "react";
import { streamScript } from "@/lib/streamChat";
import {
  ShieldCheck, Sparkles, Copy, Download, Target, AlertTriangle, TrendingUp,
  UserCheck, DollarSign, MessageSquareWarning, Zap, HelpCircle, BookOpen, Rocket,
} from "lucide-react";
import { toast } from "sonner";

type Section = { key: string; title: string; icon: React.ReactNode; accent: string; body: string };

const SECTION_MAP: Record<string, { title: string; icon: React.ReactNode; accent: string }> = {
  offer:       { title: "Оффер",                    icon: <Rocket className="w-5 h-5" />,               accent: "from-primary/30 to-primary/5" },
  problem:     { title: "Проблема клиента",         icon: <AlertTriangle className="w-5 h-5" />,        accent: "from-rose-500/30 to-rose-500/5" },
  benefits:    { title: "Выгоды",                   icon: <TrendingUp className="w-5 h-5" />,           accent: "from-emerald-500/30 to-emerald-500/5" },
  ideal:       { title: "Кому идеально",            icon: <UserCheck className="w-5 h-5" />,            accent: "from-cyan-500/30 to-cyan-500/5" },
  price:       { title: "Цена и условия",           icon: <DollarSign className="w-5 h-5" />,           accent: "from-amber-500/30 to-amber-500/5" },
  objections:  { title: "Топ-3 возражения",         icon: <MessageSquareWarning className="w-5 h-5" />, accent: "from-orange-500/30 to-orange-500/5" },
  killer:      { title: "Killer-аргументы",         icon: <Zap className="w-5 h-5" />,                  accent: "from-fuchsia-500/30 to-fuchsia-500/5" },
  quals:       { title: "Вопросы квалификации",     icon: <HelpCircle className="w-5 h-5" />,           accent: "from-indigo-500/30 to-indigo-500/5" },
  glossary:    { title: "Термины простым языком",   icon: <BookOpen className="w-5 h-5" />,             accent: "from-violet-500/30 to-violet-500/5" },
  metaphors:   { title: "Аналогии для клиента",     icon: <Sparkles className="w-5 h-5" />,             accent: "from-teal-500/30 to-teal-500/5" },
  cases:       { title: "Мини-кейсы",               icon: <Target className="w-5 h-5" />,               accent: "from-blue-500/30 to-blue-500/5" },
};

const HEAD_ALIASES: Record<string, string> = {
  "оффер": "offer",
  "проблема клиента": "problem",
  "выгоды": "benefits",
  "кому идеально": "ideal",
  "цена и условия": "price",
  "топ-3 возражения и ответы": "objections",
  "возражения и ответы": "objections",
  "killer-аргументы": "killer",
  "вопросы для квалификации": "quals",
  "термины простым языком": "glossary",
  "простые аналогии": "metaphors",
  "аналогии для клиента": "metaphors",
  "мини-кейсы": "cases",
};

function parseSections(md: string): { hero: string; sections: Section[] } {
  const lines = md.split("\n");
  let hero = "";
  const found: Section[] = [];
  let current: { key: string; body: string[] } | null = null;

  const flush = () => {
    if (!current) return;
    const meta = SECTION_MAP[current.key];
    if (meta) {
      found.push({ key: current.key, title: meta.title, icon: meta.icon, accent: meta.accent, body: current.body.join("\n").trim() });
    }
    current = null;
  };

  for (const raw of lines) {
    const m = raw.match(/^##\s+(.+?)\s*$/);
    if (m) {
      flush();
      const heading = m[1].toLowerCase().replace(/[*_]/g, "").trim();
      const key = HEAD_ALIASES[heading] ||
        Object.entries(HEAD_ALIASES).find(([k]) => heading.includes(k))?.[1] ||
        heading;
      current = { key, body: [] };
      continue;
    }
    if (current) current.body.push(raw);
    else if (raw.trim() && !hero) hero = raw.trim();
  }
  flush();
  return { hero, sections: found };
}

function renderBody(key: string, body: string) {
  const lines = body.split("\n").map((l) => l.trim()).filter(Boolean);

  if (key === "objections") {
    // "возражение → ответ" pairs
    return (
      <div className="space-y-2.5">
        {lines.map((l, i) => {
          const cleaned = l.replace(/^[-*\d.)\s]+/, "");
          const parts = cleaned.split(/\s*→\s*|\s*->\s*|\s*—\s*—\s*/);
          if (parts.length >= 2) {
            return (
              <div key={i} className="rounded-lg bg-background/40 border border-border/40 p-3">
                <p className="text-xs font-semibold text-rose-400 mb-1">✕ {parts[0]}</p>
                <p className="text-sm text-foreground leading-relaxed">→ {parts.slice(1).join(" ")}</p>
              </div>
            );
          }
          return <p key={i} className="text-sm text-foreground">{cleaned}</p>;
        })}
      </div>
    );
  }

  if (key === "glossary") {
    return (
      <div className="space-y-2">
        {lines.map((l, i) => {
          const cleaned = l.replace(/^[-*\d.)\s]+/, "");
          const [term, ...rest] = cleaned.split(/\s*[—:–-]\s*/);
          const def = rest.join(" — ");
          return (
            <div key={i} className="rounded-lg bg-background/40 border border-border/40 p-3">
              <p className="text-xs font-semibold text-primary mb-0.5">{term}</p>
              {def && <p className="text-sm text-muted-foreground leading-relaxed">{def}</p>}
            </div>
          );
        })}
      </div>
    );
  }

  // Bullet-style rendering with numbering
  return (
    <ul className="space-y-2">
      {lines.map((l, i) => {
        const cleaned = l.replace(/^[-*•]\s+/, "").replace(/^\d+[.)]\s+/, "");
        return (
          <li key={i} className="flex gap-2.5 text-sm text-foreground leading-relaxed">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0" />
            <span>{cleaned}</span>
          </li>
        );
      })}
    </ul>
  );
}

export default function BattleCards({ serviceNames, className = "" }: { serviceNames: string[]; className?: string }) {
  const [service, setService] = useState(serviceNames[0] || "SEO");
  const [audience, setAudience] = useState("Малый и средний бизнес");
  const [card, setCard] = useState("");
  const [loading, setLoading] = useState(false);

  const generate = () => {
    if (loading) return; setLoading(true); setCard("");
    const prompt = `Создай Battle-Card — маркетинговый лендинг по услуге "${service}" для аудитории "${audience}".
Тон: экспертный, разжёвывающий, без воды. Пиши так, чтобы менеджер по продажам мог показать это клиенту и сразу всё стало понятно.

СТРОГАЯ СТРУКТУРА (каждый раздел с заголовком уровня ##, ровно в этом порядке):

## ОФФЕР
Одна мощная строка — уникальное торговое предложение услуги.

## ПРОБЛЕМА КЛИЕНТА
3-4 конкретные боли, из-за которых клиент теряет деньги/время.

## ВЫГОДЫ
5 ключевых выгод. Каждая — с цифрой или измеримым результатом.

## КОМУ ИДЕАЛЬНО
4 признака идеального клиента (сфера, размер, ситуация, зрелость).

## ТЕРМИНЫ ПРОСТЫМ ЯЗЫКОМ
5-7 профессиональных терминов по услуге в формате "Термин — простое объяснение на бытовом языке". Каждый на новой строке.

## АНАЛОГИИ ДЛЯ КЛИЕНТА
3 бытовые метафоры, объясняющие суть услуги (например: "SEO — это как ремонт в магазине: без него покупатели проходят мимо"). Каждая на новой строке.

## ЦЕНА И УСЛОВИЯ
Вилка стоимости, сроки, формат сотрудничества, что входит в пакет.

## ТОП-3 ВОЗРАЖЕНИЯ И ОТВЕТЫ
Ровно по шаблону "Возражение → Ответ". Каждая пара с новой строки. 3 штуки.

## KILLER-АРГУМЕНТЫ
3 коротких факта-аргумента, которые закрывают сделку.

## МИНИ-КЕЙСЫ
2-3 короткие истории клиентов: сфера → что сделали → результат в цифрах.

## ВОПРОСЫ ДЛЯ КВАЛИФИКАЦИИ
4 вопроса, которые менеджер задаёт клиенту, чтобы понять, подойдёт ли услуга.

Не добавляй разделов сверх этого списка. Не пиши вступлений между разделами.`;

    streamScript({
      config: { mode: "arguments", service, context: prompt, managerName: "", clientName: "", situation: "Battle-card landing", tone: "Эксперт" },
      onDelta: (c) => setCard((p) => p + c),
      onDone: () => setLoading(false),
      onError: (m) => { toast.error(m); setLoading(false); },
    });
  };

  const download = () => {
    const blob = new Blob([card], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `battle-card-${service}.md`; a.click(); URL.revokeObjectURL(url);
  };

  const { hero, sections } = card ? parseSections(card) : { hero: "", sections: [] };
  const offerSection = sections.find((s) => s.key === "offer");
  const restSections = sections.filter((s) => s.key !== "offer");

  return (
    <div className={`flex flex-col h-full overflow-hidden ${className}`}>
      <header className="px-5 py-4 border-b border-border/50 shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <div className="tool-icon-animated">
            <ShieldCheck className="w-4 h-4 text-primary" />
          </div>
          <h2 className="text-base font-semibold text-foreground">Battle-cards</h2>
        </div>
        <p className="text-xs text-muted-foreground">Визуальный лендинг по услуге — покажи клиенту и продай</p>
      </header>

      <div className="px-5 py-3 border-b border-border/30 grid grid-cols-1 md:grid-cols-[1fr,1fr,auto] gap-2 shrink-0">
        <select value={service} onChange={(e) => setService(e.target.value)} className="glass-input border border-border/50 rounded-lg px-3 py-2 text-sm">
          {serviceNames.map((s) => <option key={s}>{s}</option>)}
        </select>
        <input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="Целевая аудитория" className="glass-input border border-border/50 rounded-lg px-3 py-2 text-sm" />
        <button onClick={generate} disabled={loading} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium btn-tactile flex items-center justify-center gap-1.5 disabled:opacity-50">
          <Sparkles className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Собираю..." : "Создать лендинг"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain p-5 pb-[max(4rem,env(safe-area-inset-bottom))]" style={{ WebkitOverflowScrolling: "touch" }}>
        {!card && !loading && (
          <div className="text-center py-16 text-sm text-muted-foreground max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 tool-icon-animated">
              <ShieldCheck className="w-8 h-8 text-primary" />
            </div>
            <p className="text-foreground font-medium mb-1">Одностраничник по услуге</p>
            <p>Выберите услугу и аудиторию — получите готовый визуальный разбор с терминами, аналогиями, возражениями и кейсами.</p>
          </div>
        )}

        {card && (
          <div className="max-w-5xl mx-auto space-y-5 animate-fade-in-up">
            {/* Action bar */}
            <div className="flex flex-wrap justify-between items-center gap-2">
              <div className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">Battle-Card · {service}</div>
              <div className="flex gap-1.5">
                <button onClick={() => { navigator.clipboard.writeText(card); toast.success("Скопировано"); }} className="text-xs px-2.5 py-1 rounded-md hover:bg-accent/50 text-muted-foreground flex items-center gap-1"><Copy className="w-3 h-3" />Копировать</button>
                <button onClick={download} className="text-xs px-2.5 py-1 rounded-md hover:bg-accent/50 text-muted-foreground flex items-center gap-1"><Download className="w-3 h-3" />Скачать .md</button>
              </div>
            </div>

            {/* Hero */}
            <div className="relative overflow-hidden rounded-3xl border border-primary/30 p-6 md:p-10 bg-gradient-to-br from-primary/25 via-primary/10 to-transparent">
              <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -left-16 w-64 h-64 rounded-full bg-accent/20 blur-3xl pointer-events-none" />
              <div className="relative">
                <p className="text-[11px] uppercase tracking-[0.3em] text-primary/80 font-semibold mb-3">{service} · для {audience}</p>
                <h1 className="text-2xl md:text-4xl font-display font-bold text-foreground leading-tight">
                  {offerSection?.body.replace(/\n/g, " ").trim() || hero || "Готовим оффер..."}
                </h1>
              </div>
            </div>

            {/* Bento grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {restSections.map((s) => {
                const wide = ["glossary", "objections", "cases"].includes(s.key);
                return (
                  <div key={s.key}
                    className={`relative overflow-hidden rounded-2xl border border-border/50 p-5 bg-gradient-to-br ${s.accent} ${wide ? "md:col-span-2" : ""}`}>
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className="w-9 h-9 rounded-xl bg-background/50 backdrop-blur flex items-center justify-center text-primary tool-icon-animated">
                        {s.icon}
                      </div>
                      <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">{s.title}</h3>
                    </div>
                    {s.body ? renderBody(s.key, s.body) : (
                      <div className="h-4 w-2/3 rounded bg-muted/40 animate-pulse" />
                    )}
                  </div>
                );
              })}
            </div>

            {loading && (
              <div className="flex items-center gap-2 justify-center text-xs text-muted-foreground py-4">
                <Sparkles className="w-3 h-3 animate-spin" />
                Собираем разделы...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
