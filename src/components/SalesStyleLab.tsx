import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Palette, Loader2, Copy, Save, RotateCcw, CheckCircle, Sparkles } from "lucide-react";
import { streamScript } from "@/lib/streamChat";
import { toast } from "sonner";
import { STYLE_SAMPLE_DIALOGS } from "@/lib/toolPresets";
import heroStyle from "@/assets/hero-style.jpg";

const STORAGE_KEY = "scriptengine-sales-style";

interface SalesProfile {
  summary: string;
  traits: string[];
  recommendations: string;
  savedAt: number;
}

function loadProfile(): SalesProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

interface Props {
  className?: string;
}

export default function SalesStyleLab({ className }: Props) {
  const [dialogSamples, setDialogSamples] = useState("");
  const [profile, setProfile] = useState<SalesProfile | null>(loadProfile);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState("");

  const analyzeStyle = useCallback(() => {
    if (isGenerating || !dialogSamples.trim()) return;
    setIsGenerating(true);
    setResult("");

    streamScript({
      config: {
        mode: "sales-style",
        service: "Анализ стиля",
        context: `Проанализируй стиль продаж менеджера на основе примеров диалогов. Определи:\n\n1. ПРОФИЛЬ ПРОДАВЦА — тип, архетип, характер общения\n2. СИЛЬНЫЕ СТОРОНЫ — что делает хорошо\n3. СЛАБЫЕ СТОРОНЫ — над чем работать\n4. РЕЧЕВЫЕ ПАТТЕРНЫ — характерные фразы, обороты\n5. РЕКОМЕНДАЦИИ — как усилить эффективность\n\nПРИМЕРЫ ДИАЛОГОВ:\n${dialogSamples}`,
        tone: "Уверенный эксперт",
        situation: "Анализ стиля",
      },
      onDelta: (chunk) => setResult(prev => prev + chunk),
      onDone: () => {
        setIsGenerating(false);
        toast.success("Анализ завершён");
      },
      onError: (msg) => { setIsGenerating(false); toast.error(msg); },
    });
  }, [dialogSamples, isGenerating]);

  const saveProfile = () => {
    const newProfile: SalesProfile = {
      summary: result.slice(0, 500),
      traits: [],
      recommendations: result,
      savedAt: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newProfile));
    setProfile(newProfile);
    toast.success("Профиль сохранён");
  };

  const resetProfile = () => {
    localStorage.removeItem(STORAGE_KEY);
    setProfile(null);
    setResult("");
    toast.success("Профиль сброшен");
  };

  return (
    <div className={`flex flex-col h-full ${className || ""}`}>
      <div className="p-6 border-b border-border/50 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-primary" />
            <div>
              <h2 className="text-lg font-semibold text-foreground">Лаборатория стиля</h2>
              <p className="text-xs text-muted-foreground">Персональный профиль продаж</p>
            </div>
          </div>
          {profile && (
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-primary" />
              <span className="text-[10px] text-primary font-medium">Профиль сохранён</span>
            </div>
          )}
        </div>

        {profile && !result && (
          <div className="glass-card border border-primary/20 rounded-xl p-4 mb-3">
            <p className="text-[10px] uppercase tracking-widest text-primary mb-2">Текущий профиль</p>
            <p className="text-xs text-foreground line-clamp-3">{profile.summary}</p>
            <p className="text-[10px] text-muted-foreground mt-2">Сохранён: {new Date(profile.savedAt).toLocaleDateString("ru-RU")}</p>
            <button onClick={resetProfile} className="mt-2 text-[11px] text-destructive hover:text-destructive/80 flex items-center gap-1 btn-tactile">
              <RotateCcw className="w-3 h-3" /> Сбросить
            </button>
          </div>
        )}

        <div>
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1.5">Примеры ваших диалогов</label>
          <textarea
            value={dialogSamples}
            onChange={e => setDialogSamples(e.target.value)}
            placeholder={"Вставьте 2-3 примера ваших реальных диалогов с клиентами...\n\nМенеджер: Добрый день! Меня зовут...\nКлиент: Здравствуйте, а чем вы..."}
            className="w-full glass-input border border-border/50 rounded-xl px-3 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none h-32 font-mono"
          />
          <p className="text-[10px] text-muted-foreground mt-1">Чем больше примеров — тем точнее профиль</p>
        </div>

        <button onClick={analyzeStyle} disabled={isGenerating || !dialogSamples.trim()} className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50 btn-tactile">
          {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Palette className="w-4 h-4" />}
          {isGenerating ? "Анализ стиля..." : "Проанализировать стиль"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {result ? (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Результат анализа</p>
              <div className="flex gap-1.5">
                <button onClick={() => { navigator.clipboard.writeText(result); toast.success("Скопировано"); }} className="text-[11px] px-2.5 py-1 rounded-lg border border-border/50 glass-card text-foreground hover:bg-accent/50 btn-tactile flex items-center gap-1">
                  <Copy className="w-3 h-3" /> Копировать
                </button>
                <button onClick={saveProfile} className="text-[11px] px-2.5 py-1 rounded-lg bg-primary text-primary-foreground hover:opacity-90 btn-tactile flex items-center gap-1">
                  <Save className="w-3 h-3" /> Сохранить
                </button>
              </div>
            </div>
            <div className="glass-card border border-border/50 rounded-xl p-5 text-sm text-foreground whitespace-pre-wrap leading-relaxed">
              {result}
              {isGenerating && <span className="cursor-blink" />}
            </div>
          </motion.div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Palette className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Вставьте примеры диалогов</p>
              <p className="text-xs text-muted-foreground mt-1">AI создаст ваш персональный профиль продавца</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
