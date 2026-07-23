import { useCallback, useEffect, useState } from "react";

export interface ArmoryItem {
  id: string;
  label: string;
  category?: string;
  prompt: string;
  principles?: string; // ключевые принципы отработки (короткие тезисы)
}

const KEY = "scriptengine-armory-v2";

export const DEFAULT_ARMORY: ArmoryItem[] = [
  { id: "a-price",     label: "Дорого",              category: "Цена",       prompt: "Клиент говорит что услуга слишком дорогая. Отработай возражение о цене, покажи ROI и выгоду.", principles: "Не оправдываться, вернуть к ценности. Разложить цену на выгоду в месяц. Спросить: 'дорого относительно чего?'" },
  { id: "a-diy",       label: "Делаем сами",         category: "Компетенция", prompt: "Клиент говорит что они делают продвижение своими силами. Покажи почему профессиональный подход эффективнее.", principles: "Признать усилия. Уточнить результаты. Показать 'слепые зоны' и упущенную выгоду." },
  { id: "a-notime",    label: "Нет времени",         category: "Отсрочка",   prompt: "Клиент говорит что сейчас не до этого. Покажи упущенную выгоду и создай срочность.", principles: "Не давить. Согласовать формат 'коротко за 5 минут'. Показать цену бездействия." },
  { id: "a-havevendor", label: "Уже есть подрядчик",  category: "Конкурент",  prompt: "Клиент говорит что у них уже есть подрядчик. Предложи аудит или покажи что можно лучше.", principles: "Не критиковать конкурента. Предложить бесплатный аудит/второе мнение. Найти незакрытые задачи." },
  { id: "a-noseo",     label: "Не верю в SEO",       category: "Скептицизм", prompt: "Клиент скептически настроен к SEO. Приведи факты, кейсы и конкретные результаты.", principles: "Согласиться с прошлым опытом. Показать кейс из его ниши. Предложить малый пилот." },
  { id: "a-nobudget",  label: "Нет бюджета",         category: "Цена",       prompt: "Клиент говорит что нет бюджета. Покажи как инвестиция окупается.", principles: "Уточнить: 'нет вообще' или 'не заложен'. Предложить поэтапный старт. Показать окупаемость." },
  { id: "a-think",     label: "Подумаю",             category: "Отсрочка",   prompt: "Клиент говорит 'я подумаю'. Уточни что смущает и подведи к решению.", principles: "Не отпускать. Спросить: 'что именно смущает?'. Дать выбор без выбора." },
  { id: "a-noresult",  label: "Нет результатов",     category: "Скептицизм", prompt: "Клиент был у другого подрядчика без результатов. Покажи чем ваш подход отличается.", principles: "Разобрать причины прошлого провала. Показать методику. Дать гарантии/KPI." },
];

export function useArmoryItems() {
  const [items, setItems] = useState<ArmoryItem[]>(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return DEFAULT_ARMORY;
  });

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {}
  }, [items]);

  const add = useCallback((item: Omit<ArmoryItem, "id">) => {
    setItems((prev) => [...prev, { ...item, id: `a-${Date.now()}` }]);
  }, []);
  const update = useCallback((id: string, patch: Partial<ArmoryItem>) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }, []);
  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);
  const reset = useCallback(() => setItems(DEFAULT_ARMORY), []);

  return { items, add, update, remove, reset };
}
