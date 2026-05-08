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
  {
    id: "7", title: "«Пришлите КП на почту»", category: "Уход",
    situation: "Клиент пытается избежать диалога",
    clientSays: "Знаете, давайте вы пришлёте всё на почту, я посмотрю и сам перезвоню.",
    idealResponse: "Конечно пришлю. Но чтобы КП было максимально полезным — позвольте 2 вопроса. Какие именно задачи вы хотите решить и какой результат был бы идеальным через 6 месяцев? Тогда КП будет точно про вас, а не шаблонное.",
    whyItWorks: "Соглашаемся, но превращаем «отписку» в quick-discovery. Шаблонное КП клиент не откроет.",
  },
  {
    id: "8", title: "«Денег сейчас нет»", category: "Бюджет",
    situation: "Клиент признаёт проблему, но ссылается на бюджет",
    clientSays: "Я понимаю что нужно, но денег прямо сейчас нет.",
    idealResponse: "Понял. А когда планируете распределение бюджета на маркетинг? Давайте сейчас зафиксируем приоритет и подготовим стартовый план — чтобы как только бюджет появился, вы не теряли месяц на разгон. Подготовку сделаем бесплатно.",
    whyItWorks: "Не давим. Превращаем «нет денег» в pipeline-договорённость и закрепляемся в голове клиента.",
  },
  {
    id: "9", title: "«У нас сезон, не до этого»", category: "Откладывание",
    situation: "Высокий сезон — клиент в делах",
    clientSays: "У нас сейчас сезон, мне не до маркетинга. Давайте после.",
    idealResponse: "Понимаю, в сезон каждая минута на счету. Именно поэтому SEO начинают именно сейчас — пока конкуренты загружены, к следующему сезону вы будете в ТОПе. Я возьму всю работу на себя, от вас 30 минут на старте и всё.",
    whyItWorks: "Используем «сезон» как аргумент в свою пользу. Снимаем нагрузку с клиента.",
  },
  {
    id: "10", title: "«Мы это сами умеем»", category: "Сами",
    situation: "Клиент хочет делать всё своими силами",
    clientSays: "У нас есть свой маркетолог, мы сами справляемся.",
    idealResponse: "Отлично что есть человек в команде. А он специализируется именно на SEO под нейропоиск и техническом аудите? Часто хороший маркетолог тратит 80% времени на текучку и не успевает в глубокую SEO-аналитику. Мы можем усилить его команду в нужных моментах.",
    whyItWorks: "Не обесцениваем. Предлагаем дополнение, а не замену.",
  },
  {
    id: "11", title: "«Назовите минимальную цену»", category: "Цена",
    situation: "Клиент сразу спрашивает прайс",
    clientSays: "Сколько стоит минимум?",
    idealResponse: "У нас от 60 тысяч в месяц. Но честно скажу — назвать точно без 5 минут вопросов не получится, потому что разница между «отметиться» и «реальный результат» — это разница в 2-3 раза. Можно я задам 3 коротких вопроса и дам конкретную цифру?",
    whyItWorks: "Называем минимум честно (не уходим), но задаём правильный фрейм для разговора.",
  },
  {
    id: "12", title: "«Уже работали с SEO — не пошло»", category: "Негативный опыт",
    situation: "Клиент обжёгся в прошлом",
    clientSays: "Мы пробовали SEO 2 года назад. Деньги слили, результата ноль.",
    idealResponse: "Это, к сожалению, типично — 70% подрядчиков работают по шаблону без адаптации. Можно один вопрос: вам показывали отчёты с конкретными позициями и динамикой трафика, или это были «общие слова»? Часто проблема именно в этом — нечего было контролировать.",
    whyItWorks: "Признаём боль, разделяем её, выясняем суть проблемы. Готовим почву для нашего отличия.",
  },
  {
    id: "13", title: "«Перезвоните после Нового года»", category: "Откладывание",
    situation: "Клиент откладывает на полгода",
    clientSays: "Сейчас не до этого. Перезвоните в январе.",
    idealResponse: "Хорошо, обязательно. А давайте сделаем по-другому: я сейчас бесплатно подготовлю мини-аудит вашего сайта. К январю он у вас уже будет на руках, и вы сразу примете решение — без лишних созвонов. Согласны?",
    whyItWorks: "Не отступаем — даём ценность сейчас и фиксируемся в памяти к декабрю-январю.",
  },
  {
    id: "14", title: "Манипуляция «слишком много обещаете»", category: "Скептик",
    situation: "Клиент пытается вывести на эмоции",
    clientSays: "Все вы так говорите. А по факту никто ничего не делает.",
    idealResponse: "Согласен, рынок перегрет обещаниями. Поэтому я не буду обещать — давайте я покажу 3 кейса в вашей нише с цифрами трафика и заявок до/после. Если после этого захотите — продолжим.",
    whyItWorks: "Не оправдываемся. Соглашаемся и сразу переводим в зону фактов.",
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
