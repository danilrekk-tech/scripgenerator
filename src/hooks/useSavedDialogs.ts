import { useState, useCallback } from "react";

export interface SavedDialog {
  id: string;
  timestamp: number;
  service: string;
  clientType: string;
  mood: string;
  messages: { role: "user" | "client"; content: string }[];
}

const STORAGE_KEY = "scriptengine-saved-dialogs";

function load(): SavedDialog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function useSavedDialogs() {
  const [dialogs, setDialogs] = useState<SavedDialog[]>(load);

  const saveDialog = useCallback((dialog: Omit<SavedDialog, "id" | "timestamp">) => {
    setDialogs((prev) => {
      const next = [{ ...dialog, id: Date.now().toString(), timestamp: Date.now() }, ...prev].slice(0, 30);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const deleteDialog = useCallback((id: string) => {
    setDialogs((prev) => {
      const next = prev.filter((d) => d.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { dialogs, saveDialog, deleteDialog };
}
