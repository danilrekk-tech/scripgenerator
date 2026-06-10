import { useState } from "react";
import { useLocalStore, uid } from "@/lib/moduleStore";
import { BookOpen, Plus, Trash2, Search } from "lucide-react";

interface Page { id: string; title: string; tag: string; body: string; updated: number; }

const DEFAULTS: Page[] = [
  { id: uid(), title: "Регламент звонка", tag: "Процессы", body: "1. Приветствие — 15 секунд\n2. Подтверждение времени собеседника\n3. Цель звонка одной фразой\n4. Вопросы Discovery\n5. Презентация решения\n6. Работа с возражениями\n7. Договорённость о следующем шаге", updated: Date.now() },
  { id: uid(), title: "Шаблон КП (структура)", tag: "Шаблоны", body: "## Заголовок\nТочный оффер в одну строку\n\n## Проблема клиента\n2-3 предложения\n\n## Наше решение\nЭтапы и сроки\n\n## Результаты\nКонкретные метрики\n\n## Цена и условия\n\n## Гарантии\n\n## Следующий шаг", updated: Date.now() },
  { id: uid(), title: "ФЗ-152: чек-лист", tag: "Юридическое", body: "- Политика конфиденциальности на сайте\n- Cookie-баннер с согласием\n- Уведомление в Роскомнадзор\n- Согласие на обработку ПДн в формах\n- Локализация ПДн в РФ\n- Назначить ответственного за ПДн", updated: Date.now() },
  { id: uid(), title: "Top-5 возражений и заготовки", tag: "Продажи", body: "1. \"Дорого\" → перевести в ценность\n2. \"Подумаю\" → понять что именно тревожит\n3. \"Уже есть подрядчик\" → дополнить, не заменить\n4. \"Нет бюджета\" → разнести на этапы\n5. \"Не сезон\" → подготовиться к сезону", updated: Date.now() },
];

export default function WikiKnowledge({ className = "" }: { className?: string }) {
  const [pages, setPages] = useLocalStore<Page[]>("scriptengine-wiki", DEFAULTS);
  const [activeId, setActiveId] = useState<string>(pages[0]?.id || "");
  const [filter, setFilter] = useState("");

  const active = pages.find((p) => p.id === activeId);
  const filtered = pages.filter((p) => !filter || `${p.title} ${p.tag} ${p.body}`.toLowerCase().includes(filter.toLowerCase()));

  const create = () => {
    const np: Page = { id: uid(), title: "Новая страница", tag: "Общее", body: "", updated: Date.now() };
    setPages([np, ...pages]); setActiveId(np.id);
  };
  const update = (patch: Partial<Page>) => {
    if (!active) return;
    setPages(pages.map((p) => p.id === active.id ? { ...p, ...patch, updated: Date.now() } : p));
  };
  const remove = (id: string) => {
    setPages(pages.filter((p) => p.id !== id));
    if (id === activeId) setActiveId(pages[0]?.id || "");
  };

  return (
    <div className={`flex h-full overflow-hidden ${className}`}>
      <aside className="w-64 shrink-0 border-r border-border/50 flex flex-col">
        <div className="p-3 border-b border-border/30 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-foreground"><BookOpen className="w-4 h-4 text-primary" /><h3 className="text-sm font-semibold">Wiki</h3></div>
            <button onClick={create} className="p-1.5 rounded-md hover:bg-accent/50 text-muted-foreground"><Plus className="w-3.5 h-3.5" /></button>
          </div>
          <div className="relative">
            <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Поиск..." className="w-full glass-input border border-border/40 rounded-md pl-6 pr-2 py-1.5 text-xs" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
          {filtered.map((p) => (
            <button key={p.id} onClick={() => setActiveId(p.id)} className={`w-full text-left px-2.5 py-2 rounded-lg transition-colors group ${p.id === activeId ? "bg-primary/10 text-primary" : "hover:bg-accent/40 text-foreground"}`}>
              <p className="text-xs font-medium truncate">{p.title}</p>
              <p className="text-[10px] text-muted-foreground truncate">{p.tag}</p>
            </button>
          ))}
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        {active ? (
          <>
            <header className="px-5 py-3 border-b border-border/30 flex items-center gap-2 shrink-0">
              <input value={active.title} onChange={(e) => update({ title: e.target.value })} className="flex-1 bg-transparent text-base font-semibold text-foreground outline-none" />
              <input value={active.tag} onChange={(e) => update({ tag: e.target.value })} className="w-32 glass-input border border-border/40 rounded-md px-2 py-1 text-xs" />
              <button onClick={() => remove(active.id)} className="p-1.5 rounded-md hover:bg-destructive/10 text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
            </header>
            <textarea value={active.body} onChange={(e) => update({ body: e.target.value })} placeholder="Markdown поддерживается визуально (отступы, списки, заголовки)" className="flex-1 bg-transparent text-sm text-foreground p-5 font-mono leading-relaxed resize-none outline-none overflow-y-auto" />
            <div className="px-5 py-2 border-t border-border/30 text-[10px] text-muted-foreground shrink-0">Обновлено: {new Date(active.updated).toLocaleString("ru-RU")}</div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">Нет страниц. Создайте первую.</div>
        )}
      </main>
    </div>
  );
}
