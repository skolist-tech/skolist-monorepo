import { useEffect, useState } from "react";
import { isAuthSessionError } from "@/services/api";
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
        if (cancelled) return;
        setActor(data);
        setLoading(false);
      })
      .catch((err: Error) => {
        if (cancelled || isAuthSessionError(err)) return;
        setError(err.message);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { actor, error, loading };
}
