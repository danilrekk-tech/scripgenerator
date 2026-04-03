import { useState } from "react";
import { BookOpen, Copy, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Case {
  id: string;
  title: string;
  category: string;
  situation: string;
  clientSays: string;
  idealResponse: string;
  whyItWorks: string;
}

const CASES: Case[] = [
  {
    id: "1", title: "Классика: «Дорого»", category: "Возражения",
    situation: "Клиент узнал стоимость SEO-продвижения",
    clientSays: "Это слишком дорого. У конкурентов дешевле.",
    idealResponse: "Понимаю вас. Давайте посмотрим с другой стороны — сколько вы сейчас тратите на рекламу в месяц? При правильном SEO через 4-6 месяцев стоимость привлечения клиента снижается в 3-5 раз. То есть сейчас вы платите больше, просто не видите этого.",
    whyItWorks: "Переводим разговор от цены к ROI. Не спорим, а показываем перспективу.",
  },
  {
    id: "2", title: "«Подумаю» на финальном этапе", category: "Дожим",
    situation: "КП отправлено, клиент прочитал, звонит — «подумаю»",
    clientSays: "Всё интересно, но мне нужно подумать. Перезвоню на следующей неделе.",
    idealResponse: "Конечно. А скажите — что именно хотелось бы обдумать? Может я смогу прояснить какие-то моменты прямо сейчас? Часто бывает что после разговора вопросы снимаются и можно быстрее начать получать результат.",
    whyItWorks: "Не давим, но выясняем реальную причину сомнений. Часто «подумаю» = есть конкретный вопрос.",
  },
  {
    id: "3", title: "IT-директор не видит смысла", category: "Скептик",
    situation: "Холодный звонок IT-компании",
    clientSays: "У нас сайт и так работает нормально. Зачем нам SEO?",
    idealResponse: "Ваш сайт действительно хороший. Но давайте проверим один момент — вы знаете сколько клиентов ваши конкуренты получают из поиска? Могу за 5 минут показать анализ — часто компании с хорошим продуктом теряют 60-70% потенциальных клиентов просто потому что их не находят.",
    whyItWorks: "Комплимент + конкретное предложение (аудит). Создаём любопытство через данные конкурентов.",
  },
  {
    id: "4", title: "«Уже работаем с агентством»", category: "Конкуренты",
    situation: "Клиент уже имеет подрядчика по продвижению",
    clientSays: "Спасибо, но у нас уже есть агентство которое этим занимается.",
    idealResponse: "Отлично, значит вы уже понимаете важность продвижения. А вы довольны результатами? Я спрашиваю потому что 80% клиентов которые к нам приходят — переходят от других агентств. Если интересно, могу бесплатно сделать аудит того что делает ваш текущий подрядчик.",
    whyItWorks: "Не критикуем конкурента. Предлагаем бесплатный аудит — это низкий порог входа.",
  },
  {
    id: "5", title: "Клиент хочет гарантии", category: "Доверие",
    situation: "Клиент заинтересован, но боится рисковать",
    clientSays: "А какие гарантии что будет результат? Прошлый подрядчик обещал и ничего не сделал.",
    idealResponse: "Понимаю ваше беспокойство, негативный опыт — это серьёзно. Мы не даём пустых обещаний. Вместо этого: показываем пошаговый план с измеримыми KPI на каждый месяц. Через месяц вы видите промежуточные результаты и решаете — продолжать или нет. Никаких длинных контрактов.",
    whyItWorks: "Признаём опыт клиента. Снижаем риск через месячную проверку и отсутствие long-term lock-in.",
  },
  {
    id: "6", title: "«Нейропоиск — это что?»", category: "Образование",
    situation: "Продажа оптимизации под нейропоиск",
    clientSays: "Нейропоиск? Первый раз слышу. Зачем это?",
    idealResponse: "Нейропоиск — это когда люди спрашивают у ИИ (ChatGPT, Яндекс Нейро) вместо обычного поиска. Уже 30% пользователей так делают. Если ваш сайт не оптимизирован — ИИ просто не упоминает вас в ответах. Это как не быть в Google 5 лет назад.",
    whyItWorks: "Простое объяснение + аналогия + цифра для создания срочности.",
  },
];

const CATEGORIES = Array.from(new Set(CASES.map(c => c.category)));

export default function CaseLibrary({ className }: { className?: string }) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = selectedCategory ? CASES.filter(c => c.category === selectedCategory) : CASES;

  return (
    <div className={`flex flex-col h-full overflow-y-auto ${className || ""}`}>
      <div className="p-6 border-b border-border/50 shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <BookOpen className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Библиотека кейсов</h2>
        </div>
        <p className="text-xs text-muted-foreground">Эталонные сценарии с разбором</p>
      </div>

      <div className="p-4 border-b border-border/30 shrink-0">
        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => setSelectedCategory(null)}
            className={`text-xs px-2.5 py-1.5 rounded-lg border btn-tactile transition-all ${!selectedCategory ? "chip-active" : "chip-inactive"}`}>
            Все
          </button>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setSelectedCategory(cat)}
              className={`text-xs px-2.5 py-1.5 rounded-lg border btn-tactile transition-all ${selectedCategory === cat ? "chip-active" : "chip-inactive"}`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 p-4 space-y-2">
        {filtered.map(c => (
          <div key={c.id} className="glass-card border border-border/50 rounded-xl overflow-hidden">
            <button onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
              className="w-full p-4 text-left flex items-center gap-3 hover:bg-accent/30 transition-colors">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-medium">{c.category}</span>
                </div>
                <p className="text-sm font-medium text-foreground">{c.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{c.situation}</p>
              </div>
              {expandedId === c.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </button>

            <AnimatePresence>
              {expandedId === c.id && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="px-4 pb-4 space-y-3">
                    <Block label="💬 Клиент говорит" text={c.clientSays} variant="client" />
                    <Block label="✅ Идеальный ответ" text={c.idealResponse} variant="answer" />
                    <Block label="💡 Почему это работает" text={c.whyItWorks} variant="insight" />
                    <button onClick={() => navigator.clipboard.writeText(c.idealResponse)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-border/50 glass-card text-foreground hover:bg-accent/50 btn-tactile flex items-center gap-1.5">
                      <Copy className="w-3 h-3" /> Копировать ответ
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}

function Block({ label, text, variant }: { label: string; text: string; variant: "client" | "answer" | "insight" }) {
  const cls = variant === "client" ? "border-destructive/20 bg-destructive/5" :
    variant === "answer" ? "border-green-500/20 bg-green-500/5" : "border-primary/20 bg-primary/5";
  return (
    <div className={`border rounded-lg p-3 ${cls}`}>
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
      <p className="text-xs text-foreground">{text}</p>
    </div>
  );
}
