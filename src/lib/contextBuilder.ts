import type { ArmoryItem } from "@/hooks/useArmoryItems";
import { fillService, PHRASE_TEMPLATES, scenarioGuidance, scenarioLabel } from "./scenarioTemplates";

export interface ContextSection {
  key: string;
  title: string;
  body: string;
  /** источник данных для подсветки в предпросмотре */
  source: "service" | "scenario" | "templates" | "backstory" | "site" | "armory" | "style" | "persona" | "user";
}

export interface BuildArgs {
  service: string;
  serviceContext: string;
  scenarioType?: string;
  templateIds?: string;
  backstory?: string;
  clientSiteUrl?: string;
  siteSummary?: string;
  userContext?: string;
  personaSummary?: string;
  salesStyle?: string;
  armory?: ArmoryItem[];
}

/** Подбирает элементы Арсенала, релевантные тексту контекста/предыстории. */
export function matchArmory(armory: ArmoryItem[], haystack: string): ArmoryItem[] {
  const text = haystack.toLowerCase();
  if (!text.trim()) return [];
  return armory.filter((a) => {
    const words = [a.label, a.category || ""].join(" ").toLowerCase().split(/[\s/,]+/).filter((w) => w.length > 3);
    return words.some((w) => text.includes(w));
  });
}

export function buildContextSections(args: BuildArgs): ContextSection[] {
  const sections: ContextSection[] = [];

  if (args.salesStyle?.trim()) {
    sections.push({ key: "style", source: "style", title: "Стиль менеджера", body: args.salesStyle.trim() });
  }

  const scenario = scenarioGuidance(args.scenarioType);
  if (scenario) {
    sections.push({
      key: "scenario",
      source: "scenario",
      title: `Тип сценария: ${scenarioLabel(args.scenarioType)}`,
      body: scenario,
    });
  }

  const ids = (args.templateIds || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (ids.length) {
    const body = PHRASE_TEMPLATES.filter((t) => ids.includes(t.id))
      .map((t) => `• [${t.label}] ${fillService(t.text, args.service)}`)
      .join("\n");
    if (body) sections.push({ key: "templates", source: "templates", title: "Шаблоны формулировок (используй как опору)", body });
  }

  if (args.personaSummary?.trim()) {
    sections.push({ key: "persona", source: "persona", title: "Персона клиента", body: args.personaSummary.trim() });
  }

  if (args.backstory?.trim()) {
    sections.push({ key: "backstory", source: "backstory", title: "Предыстория взаимодействия", body: args.backstory.trim() });
  }

  if (args.siteSummary?.trim()) {
    sections.push({ key: "site", source: "site", title: "Анализ сайта клиента", body: args.siteSummary.trim() });
  } else if (args.clientSiteUrl?.trim()) {
    sections.push({
      key: "site",
      source: "site",
      title: "Анализ сайта клиента",
      body: `Перед генерацией будет выполнен разбор ${args.clientSiteUrl.trim()} (title, H1, description, тематика).`,
    });
  }

  const armoryMatches = matchArmory(args.armory || [], `${args.userContext || ""} ${args.backstory || ""}`);
  if (armoryMatches.length) {
    sections.push({
      key: "armory",
      source: "armory",
      title: "Арсенал — принципы отработки",
      body: armoryMatches.map((a) => `• ${a.label}${a.category ? ` (${a.category})` : ""}: ${a.principles || a.prompt}`).join("\n"),
    });
  }

  if (args.serviceContext?.trim()) {
    sections.push({ key: "service", source: "service", title: "Данные об услуге", body: args.serviceContext.trim() });
  }

  if (args.userContext?.trim()) {
    sections.push({ key: "user", source: "user", title: "Контекст пользователя", body: args.userContext.trim() });
  }

  return sections;
}

export function sectionsToPrompt(sections: ContextSection[]): string {
  return sections.map((s) => `${s.title.toUpperCase()}:\n${s.body}`).join("\n\n---\n\n");
}
