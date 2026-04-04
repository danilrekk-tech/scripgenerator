import { useState, useEffect, useCallback } from "react";

export interface PhraseItem {
  id: string;
  text: string;
  tags: string[];
  createdAt: number;
}

const STORAGE_KEY = "scriptengine-phrase-bank";

export function usePhraseBank() {
  const [phrases, setPhrases] = useState<PhraseItem[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(phrases));
  }, [phrases]);

  const addPhrase = useCallback((text: string, tags: string[] = []) => {
    setPhrases((prev) => [
      { id: Date.now().toString(36), text, tags, createdAt: Date.now() },
      ...prev,
    ]);
  }, []);

  const removePhrase = useCallback((id: string) => {
    setPhrases((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const updatePhrase = useCallback((id: string, text: string, tags: string[]) => {
    setPhrases((prev) =>
      prev.map((p) => (p.id === id ? { ...p, text, tags } : p))
    );
  }, []);

  return { phrases, addPhrase, removePhrase, updatePhrase };
}
