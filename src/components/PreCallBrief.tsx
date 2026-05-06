import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { FileSearch, Loader2, Globe, Building2, Copy, Sparkles } from "lucide-react";
import { streamScript } from "@/lib/streamChat";
import { toast } from "sonner";
import { PRECALL_PRESETS } from "@/lib/toolPresets";
import heroBrief from "@/assets/hero-brief.jpg";

interface Props {
  serviceNames: string[];
  className?: string;
}

export default function PreCallBrief({ serviceNames, className }: Props) {
  const [url, setUrl] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [service, setService] = useState(serviceNames[0] || "SEO-продвижение");
  const [brief, setBrief] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const generateBrief = useCallback(() => {
    if (isGenerating || (!url.trim() && !companyName.trim())) return;
    setIsGenerating(true);
    setBrief("");

    streamScript({
      config: {
        mode: "pre-call-brief",
        service,
        context: `КОМПАНИЯ: ${companyName || "Не указана"}\nСАЙТ: ${url || "Не указан"}\n\nСгенерируй пре-сейл бриф для подготовки к звонку. Включи:\n1. Анализ компании и её ниши\n2. Потенциальные боли и потребности\n3. Ключевые вопросы для звонка\n4. Подходящие аргументы и УТП\n5. Возможные возражения и ответы\n6. Стратегия первого контакта`,
        tone: "Уверенный эксперт",
        situation: "Подготовка к звонку",
      },
      onDelta: (chunk) => setBrief(prev => prev + chunk),
      onDone: () => { setIsGenerating(false); toast.success("Бриф сгенерирован"); },
      onError: (msg) => { setIsGenerating(false); toast.error(msg); },
    });
  }, [url, companyName, service, isGenerating]);

  const copyBrief = () => {
    if (brief) { navigator.clipboard.writeText(brief); toast.success("Скопировано"); }
  };

  return (
    <div className={`flex flex-col h-full ${className || ""}`}>
      <div className="p-6 border-b border-border/50 shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <FileSearch className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Пре-сейл бриф</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-4">Досье на клиента перед звонком</p>

        <div className="space-y-3">
          <div>
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1.5">Название компании</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="ООО «Пример»"
                className="w-full glass-input border border-border/50 rounded-lg pl-8 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1.5">Сайт клиента</label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com"
                className="w-full glass-input border border-border/50 rounded-lg pl-8 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1.5">Услуга</label>
            <div className="flex flex-wrap gap-1.5">
              {serviceNames.map(s => (
                <button key={s} onClick={() => setService(s)} className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all btn-tactile ${service === s ? "chip-active" : "chip-inactive"}`}>{s}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Готовые шаблоны
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PRECALL_PRESETS.map(p => (
                <button key={p.label} onClick={() => { setCompanyName(p.company); setUrl(p.url); setService(p.service); }}
                  className="text-[11px] px-2.5 py-1.5 rounded-lg border border-border/50 glass-card text-muted-foreground hover:text-foreground hover:border-primary/30 btn-tactile">
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <button onClick={generateBrief} disabled={isGenerating || (!url.trim() && !companyName.trim())} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50 btn-tactile">
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSearch className="w-4 h-4" />}
            {isGenerating ? "Генерация брифа..." : "Сгенерировать бриф"}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {brief ? (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Результат</p>
              <button onClick={copyBrief} className="text-[11px] px-2.5 py-1 rounded-lg border border-border/50 glass-card text-foreground hover:bg-accent/50 btn-tactile flex items-center gap-1">
                <Copy className="w-3 h-3" /> Копировать
              </button>
            </div>
            <div className="glass-card border border-border/50 rounded-xl p-5 text-sm text-foreground whitespace-pre-wrap leading-relaxed">
              {brief}
              {isGenerating && <span className="cursor-blink" />}
            </div>
          </motion.div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="relative w-full max-w-[320px] mb-4">
              <img src={heroBrief} alt="" loading="lazy" className="w-full rounded-2xl opacity-90" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent rounded-2xl" />
            </div>
            <p className="text-sm font-medium text-foreground">Введите данные о компании</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">AI подготовит досье с болями, аргументами и стратегией звонка</p>
          </div>
        )}
      </div>
    </div>
  );
}
