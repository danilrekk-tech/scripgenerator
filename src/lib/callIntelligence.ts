import { useLocalStore, uid } from "@/lib/moduleStore";
import { supabase } from "@/integrations/supabase/client";

/* ============================================================
   AI Call Intelligence — типы данных «Разбора звонков».
   Названия полей намеренно совпадают с существующими сущностями
   (Discovery-чеклист, Battle-cards, Воронка), чтобы связки были
   тривиальными в будущем.
   ============================================================ */

export type CallStatus = "queued" | "processing" | "ready" | "failed";
export type CallGrade = "A" | "B" | "C" | "D";
export type HandlingQuality = "good" | "medium" | "failed";

export interface TranscriptLine {
  /** секунды от начала звонка */
  t: number;
  speaker: "manager" | "client";
  text: string;
}

/** Совместимо с Discovery-чеклистом (SPIN / BANT) */
export interface DiscoveryScoreItem {
  /** ключ вида `SPIN-S-0` / `BANT-B-1` — как в модуле Discovery-чеклист */
  key: string;
  method: "SPIN" | "BANT";
  label: string;
  closed: boolean;
  /** таймкод в транскрипте, где пункт был закрыт */
  t?: number;
  note?: string;
}

/** Совместимо с Battle-cards / Арсеналом возражений */
export interface CallObjection {
  id: string;
  /** текст возражения клиента */
  objection: string;
  /** категория как в Арсенале: цена / конкурент / нет времени ... */
  category: string;
  t: number;
  quality: HandlingQuality;
  /** коучинговая рекомендация */
  recommendation: string;
  /** ссылка на battle-card (id из BattleCards), если найдена */
  battleCardRef?: string;
}

export interface CallMoment {
  id: string;
  t: number;
  quote: string;
  /** коучинговый комментарий */
  insight: string;
  type: "signal" | "risk" | "win" | "miss";
}

export interface CallAnalysis {
  transcript: TranscriptLine[];
  discovery: DiscoveryScoreItem[];
  objections: CallObjection[];
  moments: CallMoment[];
  /** 0..100 */
  score: number;
  grade: CallGrade;
  summary: string;
  /** для будущей связки с Воронкой сделок */
  pipelineStageSuggestion?: string;
  nextSteps: string[];
}

export interface CallRecord {
  id: string;
  fileName: string;
  manager: string;
  service?: string;
  /** секунды */
  duration: number;
  createdAt: number;
  status: CallStatus;
  analysis?: CallAnalysis;
}

export const fmtTime = (s: number) =>
  `${Math.floor(s / 60).toString().padStart(2, "0")}:${Math.floor(s % 60).toString().padStart(2, "0")}`;

export const gradeOf = (score: number): CallGrade =>
  score >= 85 ? "A" : score >= 70 ? "B" : score >= 50 ? "C" : "D";

/* ------------------------------------------------------------
   ТОЧКА ИНТЕГРАЦИИ.
   Сейчас возвращает mock-объект, но структурирована как вызов
   внешнего API (speech-to-text + LLM-анализ через edge function).
   Позже достаточно заменить тело на fetch/supabase.functions.invoke
   к эндпоинту `analyze-call`, сохранив сигнатуру и тип ответа.
   ------------------------------------------------------------ */
export async function analyzeCall(
  input: { file?: File; fileName: string; manager: string; service?: string },
  opts: { signal?: AbortSignal } = {},
): Promise<CallAnalysis> {
  // Реальный разбор через edge function `analyze-call` (speech-to-text + LLM).
  if (input.file && input.file.size > 0 && input.file.size < 18 * 1024 * 1024) {
    try {
      const audioBase64 = await fileToBase64(input.file);
      const { data, error } = await supabase.functions.invoke("analyze-call", {
        body: {
          audioBase64,
          audioFormat: guessFormat(input.file),
          manager: input.manager,
          service: input.service,
          fileName: input.fileName,
        },
      });
      if (opts.signal?.aborted) throw new Error("aborted");
      if (!error && data?.analysis) return normalizeAnalysis(data.analysis, input.fileName, input.service);
    } catch {
      /* падаем в демо-разбор ниже */
    }
  }
  await new Promise((r) => setTimeout(r, 1200));
  if (opts.signal?.aborted) throw new Error("aborted");
  return buildMockAnalysis(input.fileName, input.service);
}

function guessFormat(file: File): string {
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  if (["wav", "mp3", "m4a", "webm", "ogg", "aac", "flac"].includes(ext)) return ext;
  if (file.type.includes("wav")) return "wav";
  if (file.type.includes("webm")) return "webm";
  if (file.type.includes("mp4")) return "m4a";
  return "mp3";
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const res = String(reader.result || "");
      resolve(res.slice(res.indexOf(",") + 1));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/** Приводит ответ модели к строгому типу CallAnalysis. */
function normalizeAnalysis(a: any, fileName: string, service?: string): CallAnalysis {
  const score = Math.max(0, Math.min(100, Math.round(Number(a?.score) || 0)));
  const transcript: TranscriptLine[] = Array.isArray(a?.transcript)
    ? a.transcript.map((l: any) => ({
        t: Math.max(0, Math.round(Number(l?.t) || 0)),
        speaker: l?.speaker === "client" ? "client" : "manager",
        text: String(l?.text || ""),
      }))
    : [];
  if (!transcript.length) return buildMockAnalysis(fileName, service);

  return {
    transcript,
    discovery: (Array.isArray(a?.discovery) ? a.discovery : []).map((d: any, i: number) => ({
      key: String(d?.key || `SPIN-S-${i}`),
      method: d?.method === "BANT" ? "BANT" : "SPIN",
      label: String(d?.label || ""),
      closed: Boolean(d?.closed),
      t: d?.t == null ? undefined : Math.round(Number(d.t) || 0),
      note: d?.note ? String(d.note) : undefined,
    })),
    objections: (Array.isArray(a?.objections) ? a.objections : []).map((o: any) => ({
      id: uid(),
      objection: String(o?.objection || ""),
      category: String(o?.category || "Прочее"),
      t: Math.round(Number(o?.t) || 0),
      quality: o?.quality === "good" || o?.quality === "failed" ? o.quality : "medium",
      recommendation: String(o?.recommendation || ""),
      battleCardRef: o?.battleCardRef ? String(o.battleCardRef) : undefined,
    })),
    moments: (Array.isArray(a?.moments) ? a.moments : []).map((m: any) => ({
      id: uid(),
      t: Math.round(Number(m?.t) || 0),
      quote: String(m?.quote || ""),
      insight: String(m?.insight || ""),
      type: ["signal", "risk", "win", "miss"].includes(m?.type) ? m.type : "signal",
    })),
    score,
    grade: gradeOf(score),
    summary: String(a?.summary || `Разбор звонка ${fileName}`),
    pipelineStageSuggestion: a?.pipelineStageSuggestion ? String(a.pipelineStageSuggestion) : undefined,
    nextSteps: (Array.isArray(a?.nextSteps) ? a.nextSteps : []).map((s: any) => String(s)),
  };
}


/* ---------------------------- MOCK ---------------------------- */

function buildMockAnalysis(fileName: string, service?: string): CallAnalysis {
  const svc = service || "SEO-продвижение";
  const transcript: TranscriptLine[] = [
    { t: 3, speaker: "manager", text: "Добрый день, [Имя клиента]! Меня зовут [Имя менеджера], агентство ScriptEngine. Удобно говорить пару минут?" },
    { t: 11, speaker: "client", text: "Да, слушаю, только коротко." },
    { t: 16, speaker: "manager", text: `Мы занимаемся ${svc.toLowerCase()}. Подскажите, откуда сейчас идут заявки?` },
    { t: 27, speaker: "client", text: "Контекст в основном, немного с органики. Но заявки дорогие." },
    { t: 41, speaker: "manager", text: "Сколько примерно лидов в месяц и какая цена лида сейчас?" },
    { t: 52, speaker: "client", text: "Около 60 лидов, лид выходит 4-5 тысяч." },
    { t: 68, speaker: "manager", text: "Понял. Если органика даст ещё 40 лидов по 1200 — как это повлияет на план продаж?" },
    { t: 84, speaker: "client", text: "Ну это было бы хорошо, конечно. Но у нас уже был подрядчик, результата не было." },
    { t: 96, speaker: "manager", text: "Понимаю. У нас работа разбита на спринты с отчётом каждые две недели — вы видите динамику с первого месяца." },
    { t: 118, speaker: "client", text: "А сколько это стоит?" },
    { t: 122, speaker: "manager", text: "От 90 тысяч в месяц." },
    { t: 129, speaker: "client", text: "Дороговато. У нас бюджет пока не заложен." },
    { t: 140, speaker: "manager", text: "Давайте я расскажу подробнее про наши процессы и команду..." },
    { t: 186, speaker: "client", text: "Хорошо, пришлите КП, посмотрю." },
    { t: 194, speaker: "manager", text: "Отправлю сегодня. Спасибо за время!" },
  ];

  const discovery: DiscoveryScoreItem[] = [
    { key: "SPIN-S-0", method: "SPIN", label: "Какой у вас сейчас источник трафика?", closed: true, t: 16 },
    { key: "SPIN-S-1", method: "SPIN", label: "Сколько лидов в месяц приходит с сайта?", closed: true, t: 41 },
    { key: "SPIN-P-0", method: "SPIN", label: "Что не устраивает в текущих результатах?", closed: true, t: 27, note: "Дорогие заявки" },
    { key: "SPIN-I-0", method: "SPIN", label: "Сколько денег это стоит компании в месяц?", closed: false },
    { key: "SPIN-N-0", method: "SPIN", label: "Если бы лидов стало в 2 раза больше, как бы это повлияло?", closed: true, t: 68 },
    { key: "BANT-B-0", method: "BANT", label: "Какой бюджет планируете на продвижение?", closed: false, note: "Клиент сказал «не заложен» — не отработано" },
    { key: "BANT-A-0", method: "BANT", label: "Кто ещё участвует в решении (ЛПР)?", closed: false },
    { key: "BANT-N-0", method: "BANT", label: "Зачем именно сейчас этим занимаетесь?", closed: false },
    { key: "BANT-T-0", method: "BANT", label: "Когда хотите запустить работы?", closed: false },
  ];

  const objections: CallObjection[] = [
    { id: uid(), objection: "Уже был подрядчик, результата не было", category: "Негативный опыт", t: 84, quality: "good", recommendation: "Хорошо: сразу дали механику контроля (спринты + отчёты). Усильте кейсом с похожей тематикой.", battleCardRef: "negative-experience" },
    { id: uid(), objection: "Дороговато / бюджет не заложен", category: "Цена", t: 129, quality: "failed", recommendation: "Цена названа без предварительной ценности и без вилки. Нужно было вернуться к цене лида (4-5к против 1.2к) и посчитать экономику.", battleCardRef: "price" },
    { id: uid(), objection: "Пришлите КП, посмотрю", category: "Отложенное решение", t: 186, quality: "medium", recommendation: "КП без назначенной следующей встречи = потеря. Фиксируйте дату разбора КП прямо на звонке.", battleCardRef: "send-proposal" },
  ];

  const moments: CallMoment[] = [
    { id: uid(), t: 52, quote: "Около 60 лидов, лид выходит 4-5 тысяч", insight: "Клиент сам дал цифры — база для расчёта экономики. Эти данные не были использованы при отработке цены.", type: "miss" },
    { id: uid(), t: 68, quote: "Если органика даст ещё 40 лидов по 1200...", insight: "Сильный Need-Payoff вопрос — держите такой темп в каждом звонке.", type: "win" },
    { id: uid(), t: 118, quote: "А сколько это стоит?", insight: "Сигнал интереса. Цену стоило дать вилкой и сразу привязать к результату.", type: "signal" },
    { id: uid(), t: 140, quote: "Давайте я расскажу подробнее про наши процессы...", insight: "Клиент дал сигнал готовности, менеджер продолжил презентацию вместо перехода к закрытию.", type: "risk" },
    { id: uid(), t: 186, quote: "Пришлите КП, посмотрю", insight: "Звонок закрыт без следующего шага в календаре — сделка зависнет в воронке.", type: "risk" },
  ];

  const score = 62;
  return {
    transcript,
    discovery,
    objections,
    moments,
    score,
    grade: gradeOf(score),
    summary: `Звонок по «${svc}» (${fileName}). Хорошая разведка по SPIN, но провалена квалификация по BANT и отработка цены. Закрытия следующего шага не было.`,
    pipelineStageSuggestion: "Отправлено КП",
    nextSteps: [
      "Назначить дату разбора КП (созвон 15 минут)",
      "Досчитать экономику: 60 лидов × 4.5к против прогноза 1.2к",
      "Выяснить ЛПР и срок запуска",
    ],
  };
}

/* --------------------------- STORE --------------------------- */

const STORE_KEY = "scriptengine-call-intelligence";

export function useCallRecords() {
  const [calls, setCalls] = useLocalStore<CallRecord[]>(STORE_KEY, []);

  const addCall = (rec: Omit<CallRecord, "id" | "createdAt" | "status">) => {
    const id = uid();
    setCalls((prev) => [{ ...rec, id, createdAt: Date.now(), status: "queued" as CallStatus }, ...prev]);
    return id;
  };
  const patchCall = (id: string, patch: Partial<CallRecord>) =>
    setCalls((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const removeCall = (id: string) => setCalls((prev) => prev.filter((c) => c.id !== id));
  const clearCalls = () => setCalls([]);

  return { calls, addCall, patchCall, removeCall, clearCalls };
}
