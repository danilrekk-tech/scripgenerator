// Типы сценариев и шаблоны формулировок с автоподстановкой под услугу.

export type ScenarioTypeId =
  | ""
  | "cold-call"
  | "inbound"
  | "follow-up"
  | "upsell"
  | "renewal"
  | "win-back"
  | "meeting"
  | "closing";

export const SCENARIO_TYPES: { id: ScenarioTypeId; label: string; desc: string; guidance: string }[] = [
  { id: "cold-call", label: "Холодный контакт", desc: "Первый звонок без интереса", guidance: "Клиент не ждёт звонка. Быстрый крюк внимания за 15 секунд, право на минуту разговора, один сильный факт по нише, мягкий переход к вопросам." },
  { id: "inbound", label: "Входящий лид", desc: "Клиент сам обратился", guidance: "Интерес уже есть. Не продавай заново — квалифицируй: задача, сроки, бюджет, ЛПР. Веди к конкретному следующему шагу." },
  { id: "follow-up", label: "Повторное касание", desc: "Второй-третий контакт", guidance: "Опирайся на прошлый разговор, напомни договорённость, добавь новую ценность (кейс/факт), не начинай с нуля." },
  { id: "upsell", label: "Допродажа", desc: "Расширение текущего клиента", guidance: "Клиент уже платит. Отталкивайся от достигнутых результатов, предлагай логичное усиление, покажи связь доп-услуги с его текущей задачей." },
  { id: "renewal", label: "Продление", desc: "Пролонгация договора", guidance: "Подведи итоги периода цифрами, зафиксируй прогресс, покажи риск отката при паузе, предложи план на следующий период." },
  { id: "win-back", label: "Возврат клиента", desc: "Ушедший / отказавшийся", guidance: "Признай прошлый опыт без оправданий, покажи что изменилось, предложи низкорисковый вход (пилот/аудит)." },
  { id: "meeting", label: "Назначение встречи", desc: "Цель — календарь", guidance: "Единственная цель — согласовать время. Не продавай услугу целиком, продавай ценность встречи. Давай выбор из двух слотов." },
  { id: "closing", label: "Закрытие сделки", desc: "Финальный этап", guidance: "Резюмируй договорённости, сними последние риски, дай прямой призыв и конкретику по договору/оплате/старту." },
];

export type TemplateCategory = "objections" | "benefits" | "cases" | "voice-search";

export const TEMPLATE_CATEGORIES: { id: TemplateCategory; label: string }[] = [
  { id: "objections", label: "Возражения" },
  { id: "benefits", label: "Выгоды" },
  { id: "cases", label: "Кейсы" },
  { id: "voice-search", label: "Голосовой поиск" },
];

export interface PhraseTemplate {
  id: string;
  category: TemplateCategory;
  label: string;
  /** {service} подставляется автоматически */
  text: string;
}

export const PHRASE_TEMPLATES: PhraseTemplate[] = [
  // Возражения
  { id: "o-price", category: "objections", label: "Дорого", text: "Клиент: «{service} — это дорого». Ответ: [Имя менеджера] не спорит о цене, а разбирает её на стоимость одной заявки и сравнивает с текущими потерями [Имя клиента]." },
  { id: "o-later", category: "objections", label: "Не сейчас", text: "Клиент: «Давайте вернёмся к {service} позже». Ответ: показать цену отсрочки — сколько трафика и заявок теряется за каждый месяц ожидания." },
  { id: "o-vendor", category: "objections", label: "Есть подрядчик", text: "Клиент: «{service} у нас уже делает другая компания». Ответ: не критиковать подрядчика, предложить независимый аудит как второе мнение." },
  { id: "o-diy", category: "objections", label: "Делаем сами", text: "Клиент: «{service} закрываем внутри». Ответ: уточнить метрики и показать слепые зоны, которые не видны без внешней экспертизы." },
  { id: "o-trust", category: "objections", label: "Не верю в результат", text: "Клиент: «Не верю, что {service} даст эффект». Ответ: кейс из ниши клиента с цифрами + предложение пилота с измеримым KPI." },
  // Выгоды
  { id: "b-leads", category: "benefits", label: "Рост заявок", text: "{service} даёт [Имя клиента] управляемый поток заявок: не разовый всплеск, а накопительный эффект, который остаётся после окончания бюджета." },
  { id: "b-cost", category: "benefits", label: "Снижение цены лида", text: "{service} снижает стоимость привлечения: органический канал не требует оплаты за каждый клик, поэтому цена заявки падает от месяца к месяцу." },
  { id: "b-trust", category: "benefits", label: "Доверие и экспертность", text: "{service} формирует репутацию: клиент видит компанию в топе и в ответах AI-поиска — это снимает половину вопросов ещё до звонка." },
  { id: "b-forecast", category: "benefits", label: "Прогнозируемость", text: "{service} делает маркетинг предсказуемым: понятные метрики, план работ и отчётность позволяют планировать продажи на квартал вперёд." },
  // Кейсы
  { id: "c-ecom", category: "cases", label: "E-commerce", text: "Кейс: интернет-магазин, {service} — за 6 месяцев рост небрендового трафика в 2,4 раза и +38% заказов из органики при том же бюджете на рекламу." },
  { id: "c-b2b", category: "cases", label: "B2B / услуги", text: "Кейс: B2B-компания, {service} — 74 целевые заявки в месяц против 19 на старте, цена лида снизилась в 3 раза за 8 месяцев." },
  { id: "c-local", category: "cases", label: "Локальный бизнес", text: "Кейс: сеть из 3 филиалов, {service} — топ-3 по 120 гео-запросам и +61% звонков с карт за 4 месяца." },
  { id: "c-recovery", category: "cases", label: "Выход из просадки", text: "Кейс: сайт после падения трафика на 55%, {service} — восстановление позиций за 3 месяца и выход выше прежних показателей к пятому." },
  // Голосовой поиск
  { id: "v-intro", category: "voice-search", label: "Зачем голосовой поиск", text: "Через голосовые ассистенты и AI-ответы клиент получает ОДИН ответ, а не десять ссылок. {service} готовит сайт так, чтобы этим ответом были вы." },
  { id: "v-longtail", category: "voice-search", label: "Разговорные запросы", text: "Люди спрашивают голосом целыми фразами. В рамках {service} мы собираем такие запросы и делаем под них блоки «вопрос — короткий ответ»." },
  { id: "v-snippet", category: "voice-search", label: "Быстрые ответы", text: "{service} выводит страницы в быстрые ответы: структурированная разметка и чёткие формулировки повышают шанс, что ассистент процитирует именно вас." },
  { id: "v-local", category: "voice-search", label: "Локальный голосовой", text: "«Окей, найди рядом» — половина голосовых запросов локальные. {service} закрывает карточки, отзывы и гео-страницы, чтобы попадать в этот ответ." },
];

export function fillService(text: string, service: string) {
  return text.replace(/\{service\}/g, service || "услуга");
}

export function templatesFor(category: TemplateCategory) {
  return PHRASE_TEMPLATES.filter((t) => t.category === category);
}

export function scenarioGuidance(id: string | undefined) {
  return SCENARIO_TYPES.find((s) => s.id === id)?.guidance || "";
}

export function scenarioLabel(id: string | undefined) {
  return SCENARIO_TYPES.find((s) => s.id === id)?.label || "";
}
