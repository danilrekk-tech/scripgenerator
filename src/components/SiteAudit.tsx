import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Search, Loader2, AlertTriangle, CheckCircle, XCircle, ExternalLink } from "lucide-react";

interface AuditResult {
  url: string;
  score: number;
  checks: AuditCheck[];
  summary: string;
  recommendations: string[];
}

interface AuditCheck {
  name: string;
  status: "pass" | "warn" | "fail";
  detail: string;
}

interface Props {
  onGenerateScript: (auditContext: string) => void;
  isGenerating: boolean;
  className?: string;
}

export default function SiteAudit({ onGenerateScript, isGenerating, className }: Props) {
  const [url, setUrl] = useState("");
  const [isAuditing, setIsAuditing] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState("");
  const [tone, setTone] = useState("Уверенный эксперт");
  const [clientType, setClientType] = useState("Малый бизнес");
  const [service, setService] = useState("SEO-продвижение");

  const TONES = ["Уверенный эксперт", "Мягкий консультант", "Не продающий", "Дружеский партнёр"];
  const CLIENT_TYPES = ["Малый бизнес", "Средний бизнес", "Крупный бизнес", "Стартап", "E-commerce", "Услуги/Сервисы"];
  const SERVICES = [
    "SEO-продвижение",
    "AI-оптимизация (LLM/Answer Engines)",
    "Оптимизация под Нейропоиск",
    "Наполнение контентом",
    "Техническая оптимизация",
    "Комплексное продвижение",
    "Юридические правки (ФЗ-152/ФЗ-168)",
  ];

  const runAudit = async () => {
    if (!url.trim()) return;
    setIsAuditing(true);
    setError("");
    setResult(null);

    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/site-audit`;
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ url: url.trim() }),
      });

      if (!resp.ok) {
        throw new Error("Ошибка аудита. Попробуйте ещё раз.");
      }

      const data = await resp.json();
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Неизвестная ошибка");
    } finally {
      setIsAuditing(false);
    }
  };

  const handleGenerateScript = () => {
    if (!result) return;
    const context = `ДАННЫЕ АУДИТА САЙТА КЛИЕНТА (${result.url}):
SEO-оценка: ${result.score}/100
Тип клиента: ${clientType}

РЕЗУЛЬТАТЫ ПРОВЕРОК:
${result.checks.map((c) => `- ${c.name}: ${c.status === "pass" ? "✅ OK" : c.status === "warn" ? "⚠️ Внимание" : "❌ Проблема"} — ${c.detail}`).join("\n")}

РЕКОМЕНДАЦИИ:
${result.recommendations.map((r, i) => `${i + 1}. ${r}`).join("\n")}

РЕЗЮМЕ: ${result.summary}

ИНСТРУКЦИЯ: Используй эти данные для создания персонализированного скрипта продажи услуги "${service}" этому клиенту. Тон: ${tone}. Тип клиента: ${clientType}. Обращайся к конкретным проблемам найденным на сайте клиента.`;

    onGenerateScript(context);
  };

  const scoreColor = result.score >= 70 ? "text-green-600 dark:text-green-400" : result.score >= 40 ? "text-yellow-600 dark:text-yellow-400" : "text-red-600 dark:text-red-400";

  const statusIcon = (status: string) => {
    if (status === "pass") return <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />;
    if (status === "warn") return <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />;
    return <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />;
  };

  return (
    <div className={`flex flex-col h-full overflow-y-auto ${className || ""}`}>
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-2 mb-1">
          <Globe className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Аудит сайта</h2>
          <span className="text-[10px] uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">BETA</span>
        </div>
        <p className="text-xs text-muted-foreground">Введите URL сайта клиента для SEO-анализа и генерации персонализированного скрипта</p>
      </div>

      <div className="p-6 space-y-5 flex-1">
        {/* URL Input */}
        <div className="flex gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="flex-1 bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all duration-200"
            onKeyDown={(e) => e.key === "Enter" && runAudit()}
          />
          <button
            onClick={runAudit}
            disabled={isAuditing || !url.trim()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-all btn-tactile flex items-center gap-2"
          >
            {isAuditing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {isAuditing ? "Анализ..." : "Анализировать"}
          </button>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-5"
            >
              {/* Score */}
              <div className="flex items-center gap-4 p-4 bg-secondary/50 rounded-lg border border-border">
                <div className={`text-3xl font-bold ${result.score >= 70 ? "text-green-500" : result.score >= 40 ? "text-yellow-500" : "text-red-500"}`}>
                  {result.score}
                </div>
                <div>
                  <p className="text-sm font-medium">SEO-оценка сайта</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" />
                    {result.url}
                  </p>
                </div>
              </div>

              {/* Checks */}
              <div className="space-y-2">
                <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Результаты проверки</h3>
                {result.checks.map((check, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-secondary/30 rounded-md border border-border">
                    {statusIcon(check.status)}
                    <div>
                      <p className="text-sm font-medium">{check.name}</p>
                      <p className="text-xs text-muted-foreground">{check.detail}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="p-4 bg-secondary/30 rounded-md border border-border">
                <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Резюме</h3>
                <p className="text-sm text-foreground">{result.summary}</p>
              </div>

              {/* Script generation settings */}
              <div className="space-y-3 pt-4 border-t border-border">
                <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Генерация персонализированного скрипта</h3>

                <Field label="Услуга для продажи">
                  <div className="flex flex-wrap gap-1.5">
                    {SERVICES.map((s) => (
                      <button
                        key={s}
                        onClick={() => setService(s)}
                        className={`text-xs px-2.5 py-1.5 rounded-sm border transition-all duration-200 btn-tactile ${
                          service === s
                            ? "bg-primary/15 text-primary border-primary/30"
                            : "bg-secondary border-border text-secondary-foreground hover:border-primary/20"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </Field>

                <Field label="Тон продажи">
                  <div className="flex flex-wrap gap-1.5">
                    {TONES.map((t) => (
                      <button
                        key={t}
                        onClick={() => setTone(t)}
                        className={`text-xs px-2.5 py-1.5 rounded-sm border transition-all duration-200 btn-tactile ${
                          tone === t
                            ? "bg-primary/15 text-primary border-primary/30"
                            : "bg-secondary border-border text-secondary-foreground hover:border-primary/20"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </Field>

                <Field label="Тип клиента">
                  <div className="flex flex-wrap gap-1.5">
                    {CLIENT_TYPES.map((ct) => (
                      <button
                        key={ct}
                        onClick={() => setClientType(ct)}
                        className={`text-xs px-2.5 py-1.5 rounded-sm border transition-all duration-200 btn-tactile ${
                          clientType === ct
                            ? "bg-primary/15 text-primary border-primary/30"
                            : "bg-secondary border-border text-secondary-foreground hover:border-primary/20"
                        }`}
                      >
                        {ct}
                      </button>
                    ))}
                  </div>
                </Field>

                <button
                  onClick={handleGenerateScript}
                  disabled={isGenerating}
                  className="w-full bg-primary text-primary-foreground font-medium py-3 rounded-md transition-all duration-200 btn-tactile shadow-glow hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-sm tracking-wide"
                >
                  {isGenerating ? "Генерация..." : "🎯 Сгенерировать персонализированный скрипт"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!result && !isAuditing && !error && (
          <div className="flex-1 flex items-center justify-center py-16">
            <div className="text-center max-w-sm">
              <Globe className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">
                Введите адрес сайта клиента для анализа SEO-оптимизации, структуры и других показателей.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}
