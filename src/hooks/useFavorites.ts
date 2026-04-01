import { useState, useCallback } from "react";

export interface FavoriteItem {
  id: string;
  timestamp: number;
  label: string;
  content: string;
  mode: string;
  service: string;
}

const STORAGE_KEY = "scriptengine-favorites";

function load(): FavoriteItem[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>(load);

  const addFavorite = useCallback((item: Omit<FavoriteItem, "id" | "timestamp">) => {
    setFavorites((prev) => {
      const next = [{ ...item, id: Date.now().toString(), timestamp: Date.now() }, ...prev];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const removeFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = prev.filter((f) => f.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const isFavorite = useCallback(
    (content: string) => favorites.some((f) => f.content === content),
    [favorites]
  );

  return { favorites, addFavorite, removeFavorite, isFavorite };
}
