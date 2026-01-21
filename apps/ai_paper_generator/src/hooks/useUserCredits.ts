import { useState, useEffect } from "react";
import { getSupabaseClient, getCurrentUserId} from "@skolist/auth";

export function useUserCredits() {
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCredits() {
      try {
        const userId = await getCurrentUserId();
        const client = getSupabaseClient();

        // Initial fetch
        const { data, error } = await client
          .from("users")
          .select("credits")
          .eq("id", userId)
          .single();

        if (error) {
          console.error("Error fetching credits:", error);
        } else {
          setCredits(data?.credits ?? 0);
        }

        // Realtime subscription
        const channel = client
          .channel(`user-credits-${userId}`)
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "users",
              filter: `id=eq.${userId}`,
            },
            (payload) => {
              console.log(
                "[useUserCredits] Realtime payload received:",
                payload
              );
              if (payload.new && typeof payload.new.credits === "number") {
                console.log(
                  "[useUserCredits] Updating credits to:",
                  payload.new.credits
                );
                setCredits(payload.new.credits);
              }
            }
          )
          .subscribe((status) => {
            console.log("[useUserCredits] Subscription status:", status);
          });

        return () => {
          client.removeChannel(channel);
        };
      } catch (err) {
        console.error("Error in fetchCredits:", err);
      } finally {
        setLoading(false);
      }
    }

    const unsubscribePromise = fetchCredits();

    return () => {
      unsubscribePromise.then((unsubscribe) => unsubscribe && unsubscribe());
    };
  }, []);

  return { credits, loading };
}
