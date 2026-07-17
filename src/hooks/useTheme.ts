import { useState, useEffect } from "react";

export type Theme = "light" | "dark" | "ocean" | "forest" | "sunset" | "midnight";

export const THEMES: { value: Theme; label: string; emoji: string; colors: [string, string, string] }[] = [
  { value: "light", label: "Светлая", emoji: "☀️", colors: ["#f0f4ff", "#3b82f6", "#ffffff"] },
  { value: "dark", label: "Тёмная", emoji: "🌙", colors: ["#111827", "#60a5fa", "#1e293b"] },
  { value: "ocean", label: "Океан", emoji: "🌊", colors: ["#0d2137", "#06b6d4", "#164e63"] },
  { value: "forest", label: "Лес", emoji: "🌲", colors: ["#0d2a18", "#22c55e", "#14532d"] },
  { value: "sunset", label: "Закат", emoji: "🌅", colors: ["#2a1808", "#f97316", "#7c2d12"] },
  { value: "midnight", label: "Midnight Indigo", emoji: "🔮", colors: ["#0a0a1a", "#4f46e5", "#1e1e5a"] },
];

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem("script-engine-theme");
    return (stored as Theme) || "ocean";
  });

  useEffect(() => {
    localStorage.setItem("script-engine-theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggle = () => {
    const values = THEMES.map((t) => t.value);
    const idx = values.indexOf(theme);
    setTheme(values[(idx + 1) % values.length]);
  };

  return { theme, setTheme, toggle };
}
