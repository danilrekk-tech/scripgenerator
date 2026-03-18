import { useState, useCallback } from "react";

export interface HistoryItem {
  id: string;
  timestamp: number;
  mode: string;
  service: string;
  label: string;
  content: string;
}

const STORAGE_KEY = "scriptengine-history";
const MAX_ITEMS = 50;

function loadHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function useHistory() {
  const [history, setHistory] = useState<HistoryItem[]>(loadHistory);

  const addToHistory = useCallback((item: Omit<HistoryItem, "id" | "timestamp">) => {
    setHistory((prev) => {
      const next = [
        { ...item, id: Date.now().toString(), timestamp: Date.now() },
        ...prev,
      ].slice(0, MAX_ITEMS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const deleteFromHistory = useCallback((id: string) => {
    setHistory((prev) => {
      const next = prev.filter((h) => h.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { history, addToHistory, deleteFromHistory, clearHistory };
}
