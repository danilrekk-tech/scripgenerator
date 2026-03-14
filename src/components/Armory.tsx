import { motion } from "framer-motion";

const OBJECTIONS = [
  {
    label: "Дорого",
    prompt: "Клиент говорит что услуга слишком дорогая. Отработай возражение о цене, покажи ROI и выгоду.",
  },
  {
    label: "Делаем сами",
    prompt: "Клиент говорит что они делают продвижение своими силами. Покажи почему профессиональный подход эффективнее.",
  },
  {
    label: "Нет времени",
    prompt: "Клиент говорит что сейчас не до этого, нет времени. Покажи упущенную выгоду и создай срочность.",
  },
  {
    label: "Уже есть подрядчик",
    prompt: "Клиент говорит что у них уже есть подрядчик. Предложи аудит или покажи что можно лучше.",
  },
  {
    label: "Не верю в SEO",
    prompt: "Клиент скептически настроен к SEO/продвижению. Приведи факты, кейсы и конкретные результаты.",
  },
  {
    label: "Нет бюджета",
    prompt: "Клиент говорит что нет бюджета. Покажи как инвестиция окупается и предложи гибкие условия.",
  },
  {
    label: "Подумаю",
    prompt: "Клиент говорит 'я подумаю'. Закрой это возражение, уточни что именно смущает и подведи к решению.",
  },
  {
    label: "Нет результатов",
    prompt: "Клиент был у другого подрядчика и не получил результатов. Покажи чем ваш подход отличается.",
  },
];

interface Props {
  onSelect: (prompt: string) => void;
  isGenerating: boolean;
  className?: string;
}

export default function Armory({ onSelect, isGenerating, className }: Props) {
  return (
    <aside className={`w-72 shrink-0 border-l border-border bg-card p-5 flex flex-col gap-4 overflow-y-auto ${className || ""}`}>
      <div>
        <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1">
          Арсенал
        </h2>
        <p className="text-[10px] text-muted-foreground">Быстрая отработка возражений</p>
      </div>

      <div className="flex flex-col gap-2">
        {OBJECTIONS.map((obj, i) => (
          <motion.button
            key={obj.label}
            initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{
              duration: 0.3,
              delay: i * 0.05,
              ease: [0.2, 0.8, 0.2, 1],
            }}
            onClick={() => onSelect(obj.prompt)}
            disabled={isGenerating}
            className="text-left px-3 py-2.5 rounded-md border border-border bg-secondary text-sm text-secondary-foreground hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 btn-tactile disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="font-medium text-foreground text-xs">{obj.label}</span>
          </motion.button>
        ))}
      </div>
    </aside>
  );
}
