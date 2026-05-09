import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Loader2, Copy, RotateCcw, Sparkles } from "lucide-react";
import { streamScript } from "@/lib/streamChat";
import heroImg from "@/assets/hero-kp.jpg";

interface Props {
  serviceNames: string[];
  className?: string;
}

const PRESETS = [
  { label: "SaaS-аналитика", brief: "Стартап в сфере логистики, команда 30 человек, ищут систему сквозной аналитики. Бюджет до 200к руб/мес." },
  { label: "Корп. SEO", brief: "Производитель промышленного оборудования, B2B, нужна полная SEO-стратегия + контент. Конкуренты на ТОП-3." },
  { label: "Внедрение CRM", brief: "Сеть стоматологий из 8 филиалов, текущая запись через Excel. Нужна CRM с напоминаниями пациентам и аналитикой." },
];

export default function KPConstructor({ serviceNames, className }: Props) {
  const [brief, setBrief] = useState("");
  const [service, setService] = useState(serviceNames[0] || "SEO-продвижение");
  const [withPrice, setWithPrice] = useState(true);
  const [price, setPrice] = useState("150000");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!brief.trim() || loading) return;
    setLoading(true);
    setOutput("");
    await streamScript({
      config: {
        mode: "default",
        service,
        situation: withPrice ? "kp-with-price" : "kp-no-price",
        tone: "expert",
        context: brief,
        transcript: "",
        priceRub: withPrice ? price : "",
        currency: "RUB",
        emailSubtype: "", emailObjection: "", managerName: "", clientName: "",
      },
      onDelta: (t) => setOutput((p) => p + t),
      onDone: () => setLoading(false),
      onError: (m) => { setOutput(m); setLoading(false); },
    });
  };

  return (
    <div className={`flex flex-col h-full min-h-0 overflow-hidden ${className || ""}`}>
      <div className="p-4 border-b border-border/50 shrink-0 flex items-center gap-2">
        <FileText className="w-5 h-5 text-primary" />
        <h2 className="text-sm font-semibold flex-1">Конструктор КП</h2>
        {output && (
          <>
            <button onClick={() => navigator.clipboard.writeText(output)} className="p-2 rounded-lg hover:bg-accent/50 text-muted-foreground hover:text-foreground" title="Копировать"><Copy className="w-4 h-4" /></button>
            <button onClick={() => { setOutput(""); setBrief(""); }} className="p-2 rounded-lg hover:bg-accent/50 text-muted-foreground hover:text-foreground" title="Сбросить"><RotateCcw className="w-4 h-4" /></button>
          </>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 space-y-4 pb-[max(2rem,env(safe-area-inset-bottom))]" style={{ WebkitOverflowScrolling: "touch" }}>
        <div className="relative rounded-2xl overflow-hidden border border-primary/20">
          <img src={heroImg} alt="" loading="lazy" className="w-full h-32 object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          <div className="absolute bottom-2 left-3 right-3">
            <p className="text-xs font-medium text-foreground">Опишите бриф — получите готовое КП</p>
            <p className="text-[10px] text-muted-foreground">Структура, ценность, цена, призыв к действию</p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1"><Sparkles className="w-3 h-3 text-primary" /> Готовые брифы</p>
          <div className="grid grid-cols-1 gap-1.5">
            {PRESETS.map((p) => (
              <button key={p.label} onClick={() => setBrief(p.brief)} className="text-left px-3 py-2 rounded-xl border border-border/50 glass-card hover:border-primary/30 btn-tactile">
                <p className="text-xs font-medium text-foreground">{p.label}</p>
                <p className="text-[10px] text-muted-foreground line-clamp-2">{p.brief}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {serviceNames.map((s) => (
            <button key={s} onClick={() => setService(s)} className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all btn-tactile ${service === s ? "chip-active" : "chip-inactive"}`}>{s}</button>
          ))}
        </div>

        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Бриф клиента / контекст</label>
          <textarea value={brief} onChange={(e) => setBrief(e.target.value)} placeholder="Кто клиент, что нужно, какие задачи, бюджет, сроки..." rows={6}
            className="w-full glass-input border border-border/50 rounded-xl px-3 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30" />
        </div>

        <div className="flex items-center gap-3 p-3 rounded-xl border border-border/50 glass-card">
          <button onClick={() => setWithPrice(!withPrice)} className={`relative w-11 h-6 rounded-full transition-all ${withPrice ? "bg-primary" : "bg-muted"}`}>
            <span className={`absolute top-0.5 w-5 h-5 bg-background rounded-full shadow transition-transform ${withPrice ? "translate-x-5" : "translate-x-0.5"}`} />
          </button>
          <div className="flex-1">
            <p className="text-xs font-medium">КП с ценой</p>
            <p className="text-[10px] text-muted-foreground">{withPrice ? "Включаем стоимость в документ" : "Цена обсуждается на встрече"}</p>
          </div>
          {withPrice && (
            <input value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))} placeholder="150000"
              className="w-24 glass-input border border-border/50 rounded-lg px-2 py-1.5 text-xs text-right font-mono" />
          )}
        </div>

        <button onClick={run} disabled={loading || !brief.trim()} className="w-full bg-primary text-primary-foreground font-medium py-3 rounded-xl btn-tactile shadow-glow hover:opacity-90 disabled:opacity-50 text-sm flex items-center justify-center gap-2">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Собираем КП...</> : <>📄 Сгенерировать КП</>}
        </button>

        {output && (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="glass-card border border-border/50 rounded-xl p-4">
            <div className="text-xs whitespace-pre-wrap text-foreground script-content">{output}</div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
