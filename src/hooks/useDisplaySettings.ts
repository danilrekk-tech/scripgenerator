import { useState, useEffect } from "react";

export interface DisplaySettings {
  fontSize: number;        // px
  lineHeight: number;      // multiplier
  fontFamily: "mono" | "sans" | "serif";
  showStageHeaders: boolean;
  stageHeaderSize: number; // px
  scriptBgEnabled: boolean;
  letterSpacing: number;   // em
  paragraphSpacing: number; // px
  maxWidth: number;        // ch
  highlightVariables: boolean;
  // New flexible options
  density: "compact" | "comfortable" | "spacious";
  cornerRadius: number;       // px (4..24)
  textAlign: "left" | "justify";
  boldHeaders: boolean;
  showMinimap: boolean;
  showTableOfContents: boolean;
  showWordCount: boolean;
  numberedAccent: boolean;
  cardShadow: "none" | "soft" | "elevated";
  textColor: "default" | "muted" | "high-contrast";
}

const DEFAULTS: DisplaySettings = {
  fontSize: 14,
  lineHeight: 1.8,
  fontFamily: "mono",
  showStageHeaders: true,
  stageHeaderSize: 16,
  scriptBgEnabled: true,
  letterSpacing: 0,
  paragraphSpacing: 16,
  maxWidth: 65,
  highlightVariables: true,
  density: "comfortable",
  cornerRadius: 12,
  textAlign: "left",
  boldHeaders: true,
  showMinimap: true,
  showTableOfContents: true,
  showWordCount: true,
  numberedAccent: true,
  cardShadow: "soft",
  textColor: "default",
};

const STORAGE_KEY = "scriptengine-display-settings";

export function useDisplaySettings() {
  const [settings, setSettings] = useState<DisplaySettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? { ...DEFAULTS, ...JSON.parse(stored) } : DEFAULTS;
    } catch {
      return DEFAULTS;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const update = <K extends keyof DisplaySettings>(key: K, value: DisplaySettings[K]) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

  const reset = () => setSettings(DEFAULTS);

  return { settings, update, reset };
}

export const FONT_FAMILIES: Record<DisplaySettings["fontFamily"], string> = {
  mono: "'IBM Plex Mono', monospace",
  sans: "'Geist', system-ui, -apple-system, sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
};
