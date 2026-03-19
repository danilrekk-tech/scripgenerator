import { useState, useEffect } from "react";
import type { ScriptConfig } from "@/components/ConfigSidebar";

export interface GeneratorPreset {
  id: string;
  name: string;
  config: Partial<ScriptConfig>;
  createdAt: number;
}

const STORAGE_KEY = "scriptengine-presets";

export function useGeneratorPresets() {
  const [presets, setPresets] = useState<GeneratorPreset[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
  }, [presets]);

  const savePreset = (name: string, config: Partial<ScriptConfig>) => {
    const preset: GeneratorPreset = {
      id: Date.now().toString(36),
      name,
      config,
      createdAt: Date.now(),
    };
    setPresets((prev) => [preset, ...prev]);
  };

  const deletePreset = (id: string) => {
    setPresets((prev) => prev.filter((p) => p.id !== id));
  };

  return { presets, savePreset, deletePreset };
}
