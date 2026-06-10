import { useState, useEffect, useCallback } from "react";

/** Generic localStorage-backed state hook. Synced to cloud via useCloudBackup if key is added there. */
export function useLocalStore<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch { return initial; }
  });

  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }, [key, value]);

  // Listen for cloud-data-restored to reload
  useEffect(() => {
    const handler = () => {
      try {
        const raw = localStorage.getItem(key);
        if (raw) setValue(JSON.parse(raw));
      } catch {}
    };
    window.addEventListener("cloud-data-restored", handler);
    return () => window.removeEventListener("cloud-data-restored", handler);
  }, [key]);

  const reset = useCallback(() => setValue(initial), [initial]);
  return [value, setValue, reset] as const;
}

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
