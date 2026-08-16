import { fmtTime, type CallRecord } from "@/lib/callIntelligence";

const esc = (s: string) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const QUALITY_RU: Record<string, string> = { good: "Отработано", medium: "Средне", failed: "Провалено" };
const MOMENT_RU: Record<string, string> = { signal: "Сигнал", risk: "Риск", win: "Удача", miss: "Упущение" };

/** Собирает печатный HTML-отчёт по разбору звонка (A4, кириллица, ч/б-friendly). */
export function buildCallReportHtml(call: CallRecord): string {
  const a = call.analysis;
  if (!a) return "";
  const date = new Date(call.createdAt).toLocaleString("ru-RU");
  const closed = a.discovery.filter((d) => d.closed).length;

  const discoveryRows = a.discovery
    .map(
      (d) => `<tr>
        <td class="c">${d.closed ? "✔" : "✘"}</td>
        <td>${esc(d.label)}${d.note ? `<div class="muted">${esc(d.note)}</div>` : ""}</td>
        <td class="c">${esc(d.method)}</td>
        <td class="c mono">${typeof d.t === "number" ? fmtTime(d.t) : "—"}</td>
      </tr>`,
    )
    .join("");

  const objectionRows = a.objections
    .map(
      (o) => `<tr>
        <td class="mono c">${fmtTime(o.t)}</td>
        <td>«${esc(o.objection)}»<div class="muted">${esc(o.category)}</div></td>
        <td class="c">${QUALITY_RU[o.quality] || o.quality}</td>
        <td>${esc(o.recommendation)}</td>
      </tr>`,
    )
    .join("");

  const moments = a.moments
    .map(
      (m) => `<div class="moment">
        <div class="mhead"><b>${MOMENT_RU[m.type] || m.type}</b> <span class="mono">${fmtTime(m.t)}</span></div>
        <div class="quote">«${esc(m.quote)}»</div>
        <div class="muted">${esc(m.insight)}</div>
      </div>`,
    )
    .join("");

  const transcript = a.transcript
    .map(
      (l) => `<div class="line"><span class="mono tc">${fmtTime(l.t)}</span><span class="sp ${l.speaker}">${
        l.speaker === "manager" ? "Менеджер" : "Клиент"
      }</span><span>${esc(l.text)}</span></div>`,
    )
    .join("");

  return `<!doctype html><html lang="ru"><head><meta charset="utf-8" />
<title>Разбор звонка — ${esc(call.fileName)}</title>
<style>
  @page { size: A4; margin: 16mm 14mm; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, "Segoe UI", Roboto, Arial, sans-serif; color:#111; font-size:11pt; line-height:1.45; }
  h1 { font-size:18pt; margin:0 0 4px; }
  h2 { font-size:12.5pt; margin:20px 0 8px; padding-bottom:4px; border-bottom:1px solid #ddd; }
  .muted { color:#666; font-size:9.5pt; }
  .mono { font-variant-numeric: tabular-nums; font-family: "SFMono-Regular", Consolas, monospace; }
  .head { display:flex; justify-content:space-between; align-items:flex-start; gap:16px; border-bottom:2px solid #111; padding-bottom:10px; }
  .score { text-align:center; border:2px solid #111; border-radius:10px; padding:8px 14px; }
  .score b { font-size:22pt; display:block; line-height:1; }
  table { width:100%; border-collapse:collapse; margin-top:6px; }
  th, td { border:1px solid #ddd; padding:5px 7px; text-align:left; vertical-align:top; font-size:10pt; }
  th { background:#f3f4f6; font-size:9pt; text-transform:uppercase; letter-spacing:.04em; }
  td.c, th.c { text-align:center; }
  .summary { background:#f7f8fa; border-left:3px solid #111; padding:10px 12px; margin-top:12px; }
  .chips span { display:inline-block; border:1px solid #bbb; border-radius:999px; padding:2px 9px; margin:3px 4px 0 0; font-size:9.5pt; }
  .moment { border:1px solid #ddd; border-radius:8px; padding:8px 10px; margin-top:6px; page-break-inside:avoid; }
  .mhead { display:flex; justify-content:space-between; font-size:9.5pt; }
  .quote { font-style:italic; margin:3px 0; }
  .line { display:flex; gap:8px; padding:3px 0; border-bottom:1px dotted #e6e6e6; font-size:10pt; page-break-inside:avoid; }
  .tc { color:#666; min-width:42px; }
  .sp { min-width:70px; font-weight:600; }
  .sp.client { color:#555; font-weight:500; }
  footer { margin-top:18px; border-top:1px solid #ddd; padding-top:6px; }
</style></head><body>
  <div class="head">
    <div>
      <h1>Разбор звонка</h1>
      <div class="muted">${esc(call.fileName)}</div>
      <div class="muted">${esc(call.manager)} · ${esc(call.service || "—")} · длительность ${fmtTime(call.duration)} · ${esc(date)}</div>
    </div>
    <div class="score"><b>${a.score}</b><span class="muted">оценка ${a.grade}</span></div>
  </div>

  <div class="summary"><b>Резюме.</b> ${esc(a.summary)}</div>
  ${a.pipelineStageSuggestion ? `<p class="muted">Рекомендуемая стадия воронки: <b>${esc(a.pipelineStageSuggestion)}</b></p>` : ""}
  ${a.nextSteps.length ? `<div class="chips"><b style="font-size:10pt">Следующие шаги:</b><br/>${a.nextSteps.map((s) => `<span>${esc(s)}</span>`).join("")}</div>` : ""}

  <h2>Discovery (SPIN / BANT) — закрыто ${closed} из ${a.discovery.length}</h2>
  <table><thead><tr><th class="c">✓</th><th>Пункт</th><th class="c">Метод</th><th class="c">Тайм-код</th></tr></thead>
  <tbody>${discoveryRows || `<tr><td colspan="4" class="muted">Нет данных</td></tr>`}</tbody></table>

  <h2>Возражения и рекомендации — ${a.objections.length}</h2>
  <table><thead><tr><th class="c">Время</th><th>Возражение</th><th class="c">Отработка</th><th>Рекомендация</th></tr></thead>
  <tbody>${objectionRows || `<tr><td colspan="4" class="muted">Возражений не зафиксировано</td></tr>`}</tbody></table>

  <h2>Ключевые моменты</h2>
  ${moments || `<p class="muted">Нет данных</p>`}

  <h2>Расшифровка</h2>
  ${transcript || `<p class="muted">Расшифровка недоступна</p>`}

  <footer class="muted">Сформировано автоматически · AI Call Intelligence</footer>
</body></html>`;
}

/** Открывает системный диалог печати/сохранения в PDF для карточки разбора. */
export function exportCallReportPdf(call: CallRecord): boolean {
  const html = buildCallReportHtml(call);
  if (!html) return false;
  const w = window.open("", "_blank", "width=900,height=1000");
  if (!w) return false;
  w.document.open();
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => { try { w.print(); } catch { /* пользователь распечатает вручную */ } }, 400);
  return true;
}
