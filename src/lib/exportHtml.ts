import type { DisplaySettings } from "@/hooks/useDisplaySettings";
import { FONT_FAMILIES } from "@/hooks/useDisplaySettings";

interface Stage {
  title: string;
  content: string;
}

export function parseStages(script: string): Stage[] {
  // Match patterns like "## Этап 1:", "**Этап 1:**", "Этап 1.", "1. Этап", "### Title", etc.
  const stageRegex = /^(?:#{1,3}\s+|(?:\*{2}))?((?:Этап|Шаг|Блок|Фаза|Стадия)\s*\d+[.:]\s*.*?|(?:\d+\.)\s+.+?)(?:\*{2})?$/gm;
  
  const stages: Stage[] = [];
  let lastIdx = 0;
  let lastTitle = "Введение";
  let match: RegExpExecArray | null;

  const matches: { title: string; index: number }[] = [];
  
  while ((match = stageRegex.exec(script)) !== null) {
    matches.push({ title: match[1].trim().replace(/[*#]/g, "").trim(), index: match.index });
  }

  // Also try markdown headers
  const headerRegex = /^#{1,3}\s+(.+)$/gm;
  while ((match = headerRegex.exec(script)) !== null) {
    const title = match[1].trim().replace(/[*#]/g, "").trim();
    if (!matches.some(m => m.index === match!.index)) {
      matches.push({ title, index: match.index });
    }
  }

  matches.sort((a, b) => a.index - b.index);

  if (matches.length === 0) {
    return [{ title: "Скрипт", content: script }];
  }

  for (let i = 0; i < matches.length; i++) {
    const contentBefore = script.slice(lastIdx, matches[i].index).trim();
    if (contentBefore && i === 0) {
      stages.push({ title: lastTitle, content: contentBefore });
    }
    
    const endIdx = i + 1 < matches.length ? matches[i + 1].index : script.length;
    // Content starts after the header line
    const headerEnd = script.indexOf("\n", matches[i].index);
    const content = script.slice(headerEnd >= 0 ? headerEnd + 1 : matches[i].index, endIdx).trim();
    
    stages.push({ title: matches[i].title, content });
    lastIdx = endIdx;
  }

  return stages.length > 0 ? stages : [{ title: "Скрипт", content: script }];
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderContent(text: string, highlightVars: boolean): string {
  let html = escapeHtml(text);
  if (highlightVars) {
    html = html.replace(
      /\[([^\]]+)\]/g,
      '<span class="var-tag">[$1]</span>'
    );
  }
  // Bold **text**
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  // Italic *text*
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  return html;
}

export function exportToHtml(script: string, settings: DisplaySettings): void {
  const stages = parseStages(script);
  const fontFamily = FONT_FAMILIES[settings.fontFamily];

  const nav = stages
    .map((s, i) => `<a href="#stage-${i}" class="nav-link">${escapeHtml(s.title)}</a>`)
    .join("\n");

  const content = stages
    .map(
      (s, i) => `
      <section id="stage-${i}" class="stage">
        <h2 class="stage-title">${escapeHtml(s.title)}</h2>
        <div class="stage-content">${renderContent(s.content, settings.highlightVariables)}</div>
      </section>`
    )
    .join("\n");

  const html = `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ScriptEngine — Экспорт скрипта</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: ${fontFamily};
    font-size: ${settings.fontSize}px;
    line-height: ${settings.lineHeight};
    letter-spacing: ${settings.letterSpacing}em;
    color: #1a1a2e;
    background: #fafafa;
    display: flex;
    min-height: 100vh;
  }
  nav {
    position: fixed;
    top: 0;
    left: 0;
    width: 240px;
    height: 100vh;
    overflow-y: auto;
    background: #fff;
    border-right: 1px solid #e2e8f0;
    padding: 24px 16px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  nav h3 {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #94a3b8;
    margin-bottom: 12px;
  }
  .nav-link {
    display: block;
    padding: 8px 12px;
    font-size: 13px;
    color: #475569;
    text-decoration: none;
    border-radius: 6px;
    transition: all 0.15s;
    border-left: 2px solid transparent;
  }
  .nav-link:hover {
    background: #f1f5f9;
    color: #0066ff;
    border-left-color: #0066ff;
  }
  main {
    margin-left: 240px;
    flex: 1;
    max-width: ${settings.maxWidth}ch;
    padding: 48px 40px;
  }
  .stage {
    margin-bottom: ${settings.paragraphSpacing * 2}px;
    padding-bottom: ${settings.paragraphSpacing}px;
    border-bottom: 1px solid #e2e8f0;
  }
  .stage:last-child { border-bottom: none; }
  .stage-title {
    font-size: ${settings.stageHeaderSize}px;
    font-weight: 600;
    color: #0066ff;
    margin-bottom: 16px;
    padding-bottom: 8px;
    border-bottom: 2px solid #0066ff20;
  }
  .stage-content {
    white-space: pre-wrap;
    color: #334155;
  }
  .var-tag {
    background: #0066ff10;
    color: #0066ff;
    border: 1px solid #0066ff30;
    border-radius: 3px;
    padding: 1px 4px;
    font-weight: 500;
  }
  strong { color: #1a1a2e; }
  @media (max-width: 768px) {
    nav { display: none; }
    main { margin-left: 0; padding: 24px 16px; }
  }
  @media print {
    nav { display: none; }
    main { margin-left: 0; }
    .stage { page-break-inside: avoid; }
  }
</style>
</head>
<body>
<nav>
  <h3>📋 Навигация</h3>
  ${nav}
</nav>
<main>
  <h1 style="font-size:24px;margin-bottom:32px;color:#0f172a;">ScriptEngine</h1>
  ${content}
</main>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `script-${Date.now()}.html`;
  a.click();
  URL.revokeObjectURL(url);
}
