import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

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

  // Restore from cloud on login
  useEffect(() => {
    if (!userId || restored.current) return;
    restored.current = true;

    (async () => {
      const { data: rows } = await supabase
        .from("user_data" as any)
        .select("data_type, data")
        .eq("user_id", userId);

      if (rows && (rows as any[]).length > 0) {
        (rows as any[]).forEach((row: { data_type: string; data: any }) => {
          const existing = localStorage.getItem(row.data_type);
          // Only restore if local is empty
          if (!existing || existing === "[]" || existing === "{}") {
            localStorage.setItem(row.data_type, JSON.stringify(row.data));
          }
        });
        window.dispatchEvent(new Event("cloud-data-restored"));
      }
    })();
  }, [userId]);

  // Periodic sync to cloud
  useEffect(() => {
    if (!userId) return;

    const syncToCloud = async () => {
      for (const key of SYNC_KEYS) {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        try {
          const data = JSON.parse(raw);
          await (supabase.from("user_data" as any) as any).upsert(
            {
              user_id: userId,
              data_type: key,
              data,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id,data_type" }
          );
        } catch {}
      }
    };

    const timer = setTimeout(syncToCloud, 5000);
    const interval = setInterval(syncToCloud, 60000);

    // Also sync on storage events
    const onStorage = () => syncToCloud();
    window.addEventListener("storage", onStorage);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      window.removeEventListener("storage", onStorage);
    };
  }, [userId]);
}
