import { useState, useEffect, useCallback } from "react";

export interface ClientPersona {
  id: string;
  name: string;
  role: string;
  traits: string;
  communication: string;
}

const STORAGE_KEY = "scriptengine-client-personas";

const DEFAULTS: ClientPersona[] = [
  { id: "lpr", name: "ЛПР (Директор)", role: "Руководитель", traits: "Занят, ценит время, решает быстро", communication: "Конкретно, с цифрами, без воды" },
  { id: "buh", name: "Бухгалтер", role: "Финансовый специалист", traits: "Консервативный, считает каждый рубль", communication: "Документы, гарантии, точные суммы" },
  { id: "it", name: "IT-директор", role: "Технический специалист", traits: "Разбирается в теме, скептичен к обещаниям", communication: "Технические детали, кейсы, результаты" },
  { id: "marketing", name: "Маркетолог", role: "Маркетинг", traits: "Мыслит метриками, интересуют KPI", communication: "ROI, конверсии, аналитика" },
  { id: "owner", name: "Собственник бизнеса", role: "Владелец", traits: "Эмоциональный, принимает решения интуитивно, важен личный контакт", communication: "История, успехи, доверие, видение перспективы" },
  { id: "hr", name: "HR-директор", role: "Управление персоналом", traits: "Внимательна к людям, важны процессы и команда", communication: "Кейсы по корпоративной культуре, отзывы команд" },
  { id: "purchase", name: "Закупщик B2B", role: "Снабжение/закупки", traits: "Сравнивает 5+ предложений, главное — условия", communication: "Прайс, скидки, отсрочка, сравнительные таблицы" },
  { id: "cfo", name: "CFO/Финдиректор", role: "Финансы", traits: "Считает unit-экономику, требует обоснования каждой статьи затрат", communication: "Юнит-экономика, окупаемость, сравнение с альтернативами" },
  { id: "startup", name: "Стартапер", role: "Основатель раннего бизнеса", traits: "Амбициозный, ограниченный бюджет, жаждет роста", communication: "Скорость, рост, простой запуск, MVP-подход" },
  { id: "skeptic", name: "Эксперт-скептик", role: "Технический эксперт в нише", traits: "Знает рынок лучше вас, ищет подвох в каждом слове", communication: "Глубокая экспертиза, факты, отсутствие маркетингового шума" },
];

export function useClientPersonas() {
  const [personas, setPersonas] = useState<ClientPersona[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : DEFAULTS;
    } catch {
      return DEFAULTS;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(personas));
  }, [personas]);

  const addPersona = useCallback((p: Omit<ClientPersona, "id">) => {
    setPersonas((prev) => [...prev, { ...p, id: Date.now().toString(36) }]);
  }, []);

  const updatePersona = useCallback((id: string, updates: Partial<ClientPersona>) => {
    setPersonas((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  }, []);

  const removePersona = useCallback((id: string) => {
    setPersonas((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return { personas, addPersona, updatePersona, removePersona };
}
