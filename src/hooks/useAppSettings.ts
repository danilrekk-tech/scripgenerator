import { useState, useEffect } from "react";

interface AppSettings {
  transcriberUrl: string;
}

const DEFAULTS: AppSettings = {
  transcriberUrl: "",
};

const STORAGE_KEY = "scriptengine-app-settings";

export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings>(() => {
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

  const update = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

  return { appSettings: settings, updateAppSetting: update };
}
