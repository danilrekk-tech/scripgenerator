import { motion } from "framer-motion";
import { Zap } from "lucide-react";

const OBJECTIONS = [
  { label: "Дорого", prompt: "Клиент говорит что услуга слишком дорогая. Отработай возражение о цене, покажи ROI и выгоду." },
  { label: "Делаем сами", prompt: "Клиент говорит что они делают продвижение своими силами. Покажи почему профессиональный подход эффективнее." },
  { label: "Нет времени", prompt: "Клиент говорит что сейчас не до этого. Покажи упущенную выгоду и создай срочность." },
  { label: "Уже есть подрядчик", prompt: "Клиент говорит что у них уже есть подрядчик. Предложи аудит или покажи что можно лучше." },
  { label: "Не верю в SEO", prompt: "Клиент скептически настроен к SEO. Приведи факты, кейсы и конкретные результаты." },
  { label: "Нет бюджета", prompt: "Клиент говорит что нет бюджета. Покажи как инвестиция окупается." },
  { label: "Подумаю", prompt: "Клиент говорит 'я подумаю'. Уточни что смущает и подведи к решению." },
  { label: "Нет результатов", prompt: "Клиент был у другого подрядчика без результатов. Покажи чем ваш подход отличается." },
];

interface Props {
  onSelect: (prompt: string) => void;
  isGenerating: boolean;
  className?: string;
}

export default function Armory({ onSelect, isGenerating, className }: Props) {
  return (
    <aside className={`w-72 shrink-0 border-l border-border/50 glass-panel p-5 flex flex-col gap-4 overflow-y-auto ${className || ""}`}>
      <div className="flex items-center gap-2 mb-1">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <Zap className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h2 className="text-xs font-medium uppercase tracking-widest text-foreground">Арсенал</h2>
          <p className="text-[10px] text-muted-foreground">Быстрая отработка возражений</p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {OBJECTIONS.map((obj, i) => (
          <motion.button
            key={obj.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.04 }}
            onClick={() => onSelect(obj.prompt)}
            disabled={isGenerating}
            className="text-left px-3 py-2.5 rounded-xl border border-border/50 glass-card text-sm hover:bg-accent/50 hover:border-primary/20 transition-all btn-tactile disabled:opacity-50"
          >
            <span className="font-medium text-foreground text-xs">{obj.label}</span>
          </motion.button>
        ))}
      </div>
    </aside>
  );
}
