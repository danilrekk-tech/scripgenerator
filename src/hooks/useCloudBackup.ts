import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SYNC_KEYS = [
  "scriptengine-services",
  "scriptengine-history",
  "scriptengine-presets",
  "scriptengine-display-settings",
  "scriptengine-app-settings",
  "scriptengine-saved-dialogs",
  "scriptengine-favorites",
  "scriptengine-modules",
  "scriptengine-layout",
  "scriptengine-pipeline",
  "scriptengine-contacts",
  "scriptengine-discovery-checked",
  "scriptengine-discovery-notes",
  "scriptengine-competitor-matrix",
  "scriptengine-wiki",
];

const META_KEY = "scriptengine-sync-meta";

type SyncMeta = Record<string, { updatedAt: string; hash: string }>;

const readMeta = (): SyncMeta => {
  try { return JSON.parse(localStorage.getItem(META_KEY) || "{}"); } catch { return {}; }
};
const writeMeta = (m: SyncMeta) => {
  try { localStorage.setItem(META_KEY, JSON.stringify(m)); } catch {}
};

// Cheap deterministic hash for change detection
const hash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return String(h);
};

// Merge strategy for conflict: prefer object with more keys / array with more items,
// but if both share `id` fields dedupe by id (arrays of objects); fallback last-write-wins.
const mergeData = (local: unknown, remote: unknown): unknown => {
  if (Array.isArray(local) && Array.isArray(remote)) {
    const map = new Map<string, unknown>();
    [...remote, ...local].forEach((item) => {
      if (item && typeof item === "object" && "id" in (item as object)) {
        map.set(String((item as { id: unknown }).id), item);
      } else {
        map.set(JSON.stringify(item), item);
      }
    });
    return Array.from(map.values());
  }
  if (local && remote && typeof local === "object" && typeof remote === "object") {
    return { ...(remote as object), ...(local as object) };
  }
  return local ?? remote;
};

export function useCloudBackup(userId: string | null) {
  const restored = useRef(false);
  const syncingRef = useRef(false);

  useEffect(() => {
    if (!userId || restored.current) return;
    restored.current = true;

    (async () => {
      try {
        const { data: rows, error } = await supabase
          .from("user_data")
          .select("data_type, data, updated_at")
          .eq("user_id", userId);
        if (error) { console.error("Cloud restore error:", error); return; }
        if (!rows || rows.length === 0) return;

        const meta = readMeta();
        let restoredCount = 0;
        rows.forEach((row) => {
          const localRaw = localStorage.getItem(row.data_type);
          const remoteStr = JSON.stringify(row.data);
          const remoteUpdated = row.updated_at || new Date(0).toISOString();

          if (!localRaw || localRaw === "[]" || localRaw === "{}") {
            localStorage.setItem(row.data_type, remoteStr);
            meta[row.data_type] = { updatedAt: remoteUpdated, hash: hash(remoteStr) };
            restoredCount++;
            return;
          }

          const localMeta = meta[row.data_type];
          const localHash = hash(localRaw);
          const localChanged = !localMeta || localMeta.hash !== localHash;
          const remoteNewer = !localMeta || new Date(remoteUpdated) > new Date(localMeta.updatedAt);

          if (localChanged && remoteNewer) {
            // Conflict — merge
            try {
              const merged = mergeData(JSON.parse(localRaw), row.data);
              const mergedStr = JSON.stringify(merged);
              localStorage.setItem(row.data_type, mergedStr);
              meta[row.data_type] = { updatedAt: new Date().toISOString(), hash: hash(mergedStr) };
              toast.info(`Слияние правок: ${row.data_type.replace("scriptengine-", "")}`);
            } catch {
              // Keep local, back up remote
              localStorage.setItem(`${row.data_type}__remote-backup`, remoteStr);
            }
          } else if (remoteNewer && !localChanged) {
            localStorage.setItem(row.data_type, remoteStr);
            meta[row.data_type] = { updatedAt: remoteUpdated, hash: hash(remoteStr) };
            restoredCount++;
          }
        });
        writeMeta(meta);
        if (restoredCount > 0) {
          window.dispatchEvent(new Event("cloud-data-restored"));
          toast.success("Данные восстановлены из облака");
        }
      } catch (e) {
        console.error("Cloud restore failed:", e);
      }
    })();
  }, [userId]);

  const syncToCloud = useCallback(async () => {
    if (!userId || syncingRef.current) return;
    syncingRef.current = true;

    try {
      const meta = readMeta();
      for (const key of SYNC_KEYS) {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const localHash = hash(raw);
        const prev = meta[key];
        if (prev && prev.hash === localHash) continue; // no local change

        try {
          const data = JSON.parse(raw);

          // Optimistic concurrency: check remote updated_at
          const { data: remote } = await supabase
            .from("user_data")
            .select("data, updated_at")
            .eq("user_id", userId)
            .eq("data_type", key)
            .maybeSingle();

          let payload = data;
          if (remote && prev && new Date(remote.updated_at ?? 0) > new Date(prev.updatedAt)) {
            // Remote changed since our last sync — merge before writing
            try {
              payload = mergeData(data, remote.data);
              localStorage.setItem(key, JSON.stringify(payload));
              toast.info(`Слияние облачных правок: ${key.replace("scriptengine-", "")}`);
            } catch {
              // fall through to overwrite
            }
          }

          const nowIso = new Date().toISOString();
          const { error } = await supabase
            .from("user_data")
            .upsert(
              { user_id: userId, data_type: key, data: payload, updated_at: nowIso },
              { onConflict: "user_id,data_type" }
            );
          if (error) { console.error(`Sync error for ${key}:`, error); continue; }
          meta[key] = { updatedAt: nowIso, hash: hash(JSON.stringify(payload)) };
        } catch (e) {
          console.error(`Sync JSON error for ${key}:`, e);
        }
      }
      writeMeta(meta);
    } finally {
      syncingRef.current = false;
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    const timer = setTimeout(syncToCloud, 3000);
    const interval = setInterval(syncToCloud, 30000);
    let debounceRef: number;
    const onStorage = () => {
      clearTimeout(debounceRef);
      debounceRef = window.setTimeout(syncToCloud, 2000);
    };
    window.addEventListener("storage", onStorage);
    const onBeforeUnload = () => { syncToCloud(); };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [userId, syncToCloud]);

  return { syncNow: syncToCloud };
}
