import { useState, useEffect, useCallback } from "react";

export interface ScriptNote {
  id: string;
  paragraphIndex: number;
  text: string;
  createdAt: number;
}

const STORAGE_KEY = "scriptengine-script-notes";

export function useScriptNotes() {
  const [notes, setNotes] = useState<ScriptNote[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  }, [notes]);

  const addNote = useCallback((paragraphIndex: number, text: string) => {
    setNotes((prev) => [
      ...prev,
      { id: Date.now().toString(36), paragraphIndex, text, createdAt: Date.now() },
    ]);
  }, []);

  const removeNote = useCallback((id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearNotes = useCallback(() => setNotes([]), []);

  return { notes, addNote, removeNote, clearNotes };
}
