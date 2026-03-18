import { useState, useEffect, useCallback } from "react";

export interface ServiceItem {
  id: string;
  name: string;
  description: string;
  keyPoints: string[];
}

const DEFAULT_SERVICES: ServiceItem[] = [
  { id: "1", name: "SEO-продвижение", description: "Комплексная оптимизация сайта для поисковых систем", keyPoints: ["Аудит сайта", "Семантическое ядро", "Оптимизация контента", "Наращивание ссылочной массы"] },
  { id: "2", name: "AI-оптимизация (LLM/Answer Engines)", description: "Оптимизация контента для ответов AI-систем и LLM", keyPoints: ["Структурирование данных", "Schema.org разметка", "Оптимизация под AI-поиск"] },
  { id: "3", name: "Голосовой поиск", description: "Оптимизация для голосовых ассистентов", keyPoints: ["Featured snippets", "Разговорные запросы", "Локальный поиск"] },
  { id: "4", name: "Наполнение контентом", description: "Создание и публикация качественного контента", keyPoints: ["Статьи", "Описания товаров", "Блог", "Лендинги"] },
  { id: "5", name: "Техническая оптимизация", description: "Улучшение технических параметров сайта", keyPoints: ["Скорость загрузки", "Мобильная адаптация", "Чистка кода", "Индексация"] },
  { id: "6", name: "Комплексное продвижение", description: "Полный цикл интернет-маркетинга", keyPoints: ["SEO + Контент + Реклама", "Единая стратегия", "Отчётность"] },
  { id: "7", name: "SEO-оптимизация (разовая)", description: "Разовый аудит и оптимизация сайта", keyPoints: ["Технический аудит", "Базовая оптимизация", "Рекомендации"] },
  { id: "8", name: "Оптимизация под Нейропоиск", description: "Оптимизация для нейросетевых поисковых систем", keyPoints: ["Структурированные данные", "E-E-A-T факторы", "Экспертный контент"] },
  { id: "9", name: "Юридические правки (ФЗ-152/ФЗ-168)", description: "Приведение сайта в соответствие законодательству", keyPoints: ["Политика конфиденциальности", "Cookie-баннер", "Согласие на обработку данных"] },
];

const STORAGE_KEY = "scriptengine-services";

export function useServices() {
  const [services, setServices] = useState<ServiceItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_SERVICES;
    } catch {
      return DEFAULT_SERVICES;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(services));
  }, [services]);

  const addService = useCallback((service: Omit<ServiceItem, "id">) => {
    setServices((prev) => [...prev, { ...service, id: Date.now().toString() }]);
  }, []);

  const updateService = useCallback((id: string, updates: Partial<Omit<ServiceItem, "id">>) => {
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  }, []);

  const deleteService = useCallback((id: string) => {
    setServices((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const resetToDefaults = useCallback(() => {
    setServices(DEFAULT_SERVICES);
  }, []);

  const serviceNames = services.map((s) => s.name);

  const getServiceContext = useCallback((serviceName: string) => {
    const svc = services.find((s) => s.name === serviceName);
    if (!svc) return "";
    return `ДАННЫЕ ОБ УСЛУГЕ (СТРОГО ПРИДЕРЖИВАЙСЯ ЭТОГО ОПИСАНИЯ, НЕ ДОБАВЛЯЙ НИЧЕГО ОТ СЕБЯ):
Название: ${svc.name}
Описание: ${svc.description}
Что ВХОДИТ в услугу (ТОЛЬКО эти пункты, НЕ придумывай другие): ${svc.keyPoints.join("; ")}
ВАЖНО: Если какой-то аспект НЕ указан в ключевых пунктах выше — НЕ включай его в генерацию. Используй ТОЛЬКО перечисленные пункты.`;
  }, [services]);

  return { services, serviceNames, addService, updateService, deleteService, resetToDefaults, getServiceContext };
}
