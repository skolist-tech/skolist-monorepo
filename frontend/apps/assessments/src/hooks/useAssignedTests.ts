import { useCallback, useEffect, useState } from "react";
import { listAssignedTests } from "@/services/attempts";
import type { TestSummary } from "@/types/assessment";

export function useAssignedTests() {
  const [tests, setTests] = useState<TestSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listAssignedTests();
      setTests(data.tests);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tests");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { tests, error, loading, reload };
}
