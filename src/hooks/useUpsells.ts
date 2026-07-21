import { useCallback, useEffect, useState } from "react";

export interface Upsell {
  id: string;
  name: string;
  price?: string;
  description: string;
  bestFor?: string; // when to offer
  service?: string; // linked base service (optional)
}

const KEY = "scriptengine_upsells_v1";

const DEFAULTS: Upsell[] = [
  {
    id: "default-1",
    name: "Аудит контента",
    price: "от 35 000 ₽",
    description: "Разбор текущих текстов на сайте: релевантность запросам, LSI, коммерческие факторы.",
    bestFor: "Клиент уже покупает SEO/SGE — усилит результат через 1-2 месяца",
    service: "SEO-продвижение",
  },
  {
    id: "default-2",
    name: "Юридический аудит ФЗ-152",
    price: "15 000 ₽",
    description: "Проверка формы согласия, политики обработки ПДн, документов оператора.",
    bestFor: "Работает с формами, обрабатывает ПДн клиентов",
  },
  {
    id: "default-3",
    name: "Схема микроразметки (schema.org)",
    price: "от 12 000 ₽",
    description: "Внедрение Organization, Product, FAQPage, Breadcrumbs — рост CTR из поиска.",
    bestFor: "Покупает SEO, есть каталог/статьи",
    service: "SEO-продвижение",
  },
];

export function useUpsells() {
  const [items, setItems] = useState<Upsell[]>(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return DEFAULTS;
  });

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {}
  }, [items]);

  const add = useCallback((u: Omit<Upsell, "id">) => {
    setItems((prev) => [...prev, { ...u, id: `u-${Date.now()}` }]);
  }, []);
  const update = useCallback((id: string, patch: Partial<Upsell>) => {
    setItems((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)));
  }, []);
  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((u) => u.id !== id));
  }, []);
  const reset = useCallback(() => setItems(DEFAULTS), []);

  return { items, add, update, remove, reset };
}
