import { useState, useMemo } from "react";
import { Calculator, TrendingUp } from "lucide-react";

export default function ValueCalculator({ className = "" }: { className?: string }) {
  const [traffic, setTraffic] = useState(1000);
  const [conversion, setConversion] = useState(2);     // %
  const [avgCheck, setAvgCheck] = useState(15000);     // ₽
  const [marginPct, setMarginPct] = useState(30);      // %
  const [growthPct, setGrowthPct] = useState(50);      // %
  const [serviceCost, setServiceCost] = useState(60000);// ₽/мес

  const calc = useMemo(() => {
    const leads = (traffic * conversion) / 100;
    const revenue = leads * avgCheck;
    const profit = (revenue * marginPct) / 100;
    const newTraffic = traffic * (1 + growthPct / 100);
    const newLeads = (newTraffic * conversion) / 100;
    const newRevenue = newLeads * avgCheck;
    const newProfit = (newRevenue * marginPct) / 100;
    const delta = newProfit - profit;
    const roi = serviceCost > 0 ? ((delta - serviceCost) / serviceCost) * 100 : 0;
    const payback = delta > 0 ? serviceCost / delta : Infinity;
    return { leads, revenue, profit, newLeads, newRevenue, newProfit, delta, roi, payback };
  }, [traffic, conversion, avgCheck, marginPct, growthPct, serviceCost]);

  const fmt = (n: number) => n.toLocaleString("ru-RU", { maximumFractionDigits: 0 });

  return (
    <div className={`flex flex-col h-full overflow-hidden ${className}`}>
      <header className="px-5 py-4 border-b border-border/50 shrink-0">
        <div className="flex items-center gap-2 mb-1"><Calculator className="w-4 h-4 text-primary" /><h2 className="text-base font-semibold text-foreground">Калькулятор ценности услуги</h2></div>
        <p className="text-xs text-muted-foreground">Покажите клиенту экономику в цифрах прямо в разговоре</p>
      </header>

      <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="glass-card border border-border/50 rounded-xl p-5 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Сейчас у клиента</p>
          <Field label="Трафик в месяц" value={traffic} onChange={setTraffic} suffix="чел." />
          <Field label="Конверсия в лид" value={conversion} onChange={setConversion} suffix="%" step={0.1} />
          <Field label="Средний чек" value={avgCheck} onChange={setAvgCheck} suffix="₽" />
          <Field label="Маржа" value={marginPct} onChange={setMarginPct} suffix="%" />

          <div className="border-t border-border/40 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-3">Наше предложение</p>
            <Field label="Рост трафика после работ" value={growthPct} onChange={setGrowthPct} suffix="%" />
            <Field label="Стоимость услуги в мес." value={serviceCost} onChange={setServiceCost} suffix="₽" />
          </div>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Metric label="Лидов сейчас" value={`${fmt(calc.leads)}`} />
            <Metric label="Лидов станет" value={`${fmt(calc.newLeads)}`} accent />
            <Metric label="Выручка сейчас" value={`${fmt(calc.revenue)} ₽`} />
            <Metric label="Выручка станет" value={`${fmt(calc.newRevenue)} ₽`} accent />
          </div>

          <div className="glass-card border-2 border-primary/40 rounded-xl p-5 bg-gradient-to-br from-primary/10 to-transparent">
            <div className="flex items-center gap-2 text-primary mb-2"><TrendingUp className="w-4 h-4" /><p className="text-xs font-semibold uppercase tracking-wider">Прирост прибыли в месяц</p></div>
            <p className="text-3xl font-bold text-foreground">+{fmt(calc.delta)} ₽</p>
            <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-primary/20">
              <div><p className="text-[10px] uppercase tracking-wider text-muted-foreground">ROI</p><p className="text-lg font-bold text-foreground">{fmt(calc.roi)}%</p></div>
              <div><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Окупаемость</p><p className="text-lg font-bold text-foreground">{isFinite(calc.payback) ? `${calc.payback.toFixed(1)} мес` : "—"}</p></div>
            </div>
          </div>

          <div className="text-[10px] text-muted-foreground px-2">* Калькулятор демонстрационный — используйте для иллюстрации разговора с клиентом.</div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, suffix, step = 1 }: { label: string; value: number; onChange: (v: number) => void; suffix?: string; step?: number }) {
  return (
    <div>
      <label className="text-[11px] text-muted-foreground block mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <input type="number" step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value) || 0)} className="flex-1 glass-input border border-border/50 rounded-lg px-3 py-2 text-sm" />
        {suffix && <span className="text-xs text-muted-foreground w-10">{suffix}</span>}
      </div>
    </div>
  );
}
function Metric({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`glass-card border rounded-xl p-3 ${accent ? "border-primary/40" : "border-border/50"}`}>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`text-lg font-bold mt-1 ${accent ? "text-primary" : "text-foreground"}`}>{value}</p>
    </div>
  );
}
