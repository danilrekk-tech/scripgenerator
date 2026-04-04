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
];

export function useCloudBackup(userId: string | null) {
  const restored = useRef(false);
  const syncingRef = useRef(false);

  // Restore from cloud on login
  useEffect(() => {
    if (!userId || restored.current) return;
    restored.current = true;

    (async () => {
      try {
        const { data: rows, error } = await supabase
          .from("user_data")
          .select("data_type, data")
          .eq("user_id", userId);

        if (error) {
          console.error("Cloud restore error:", error);
          return;
        }

        if (rows && rows.length > 0) {
          let restoredCount = 0;
          rows.forEach((row) => {
            const existing = localStorage.getItem(row.data_type);
            if (!existing || existing === "[]" || existing === "{}") {
              localStorage.setItem(row.data_type, JSON.stringify(row.data));
              restoredCount++;
            }
          });
          if (restoredCount > 0) {
            window.dispatchEvent(new Event("cloud-data-restored"));
            toast.success("Данные восстановлены из облака");
          }
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
      for (const key of SYNC_KEYS) {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        try {
          const data = JSON.parse(raw);
          const { error } = await supabase
            .from("user_data")
            .upsert(
              {
                user_id: userId,
                data_type: key,
                data,
                updated_at: new Date().toISOString(),
              },
              { onConflict: "user_id,data_type" }
            );
          if (error) console.error(`Sync error for ${key}:`, error);
        } catch {}
      }
    } finally {
      syncingRef.current = false;
    }
  }, [userId]);

  // Periodic sync + sync on storage changes
  useEffect(() => {
    if (!userId) return;

    const timer = setTimeout(syncToCloud, 3000);
    const interval = setInterval(syncToCloud, 30000);

    const onStorage = () => {
      clearTimeout(debounceRef);
      debounceRef = window.setTimeout(syncToCloud, 2000);
    };
    let debounceRef: number;

    window.addEventListener("storage", onStorage);

    // Sync before unload
    const onBeforeUnload = () => syncToCloud();
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
