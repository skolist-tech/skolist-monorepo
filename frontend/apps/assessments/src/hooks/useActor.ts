import { useEffect, useState } from "react";
import { getMe } from "@/services/tests";
import type { Actor } from "@/types/assessment";

export function useActor() {
  const [actor, setActor] = useState<Actor | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getMe()
      .then((data) => {
        if (!cancelled) setActor(data);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { actor, error, loading };
}
