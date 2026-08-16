import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ElevenLabsQuota {
  used: number;
  limit: number;
  remaining: number;
  resetsAt?: number | null;
  tier?: string | null;
}

/** Квота символов ElevenLabs (STT) для индикатора «оставшихся токенов». */
export function useElevenLabsQuota() {
  const [quota, setQuota] = useState<ElevenLabsQuota | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke("elevenlabs-usage");
      if (error) throw error;
      if (data?.error) throw new Error(String(data.error));
      const limit = Number(data?.limit) || 0;
      const used = Number(data?.used) || 0;
      setQuota({
        used,
        limit,
        remaining: Number(data?.remaining ?? Math.max(0, limit - used)),
        resetsAt: data?.resetsAt ?? null,
        tier: data?.tier ?? null,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "quota_error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  return { quota, loading, error, refresh };
}
