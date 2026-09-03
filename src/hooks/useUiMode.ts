import { useCallback, useEffect, useState } from "react";

export type UiMode = "advanced" | "lite";

const KEY = "scriptengine-ui-mode";
const EVENT = "ui-mode-changed";

function read(): UiMode {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return "advanced";
    const parsed = JSON.parse(raw);
    const mode = typeof parsed === "string" ? parsed : parsed?.mode;
    return mode === "lite" ? "lite" : "advanced";
  } catch {
    return "advanced";
  }
}

/** Interface mode: existing advanced UI vs. new lightweight UI. Persisted between sessions. */
export function useUiMode() {
  const [mode, setModeState] = useState<UiMode>(read);

  useEffect(() => {
    const sync = () => setModeState(read());
    window.addEventListener(EVENT, sync);
    window.addEventListener("cloud-data-restored", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("cloud-data-restored", sync);
    };
  }, []);

  const setMode = useCallback((next: UiMode) => {
    try { localStorage.setItem(KEY, JSON.stringify({ mode: next })); } catch { /* ignore */ }
    setModeState(next);
    window.dispatchEvent(new CustomEvent(EVENT));
  }, []);

  return { mode, setMode, isLite: mode === "lite" };
}
