import { useCallback, useEffect, useState } from "react";
import { getAttemptPaper } from "@/services/attempts";
import type { AttemptPaper } from "@/types/assessment";

export function useAttempt(attemptId: string | undefined) {
  const [paper, setPaper] = useState<AttemptPaper | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!attemptId) return;
    setLoading(true);
    try {
      const data = await getAttemptPaper(attemptId);
      setPaper(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load attempt");
    } finally {
      setLoading(false);
    }
  }, [attemptId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { paper, error, loading, reload, setPaper };
}
