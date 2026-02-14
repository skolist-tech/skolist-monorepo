import { useState, useCallback, useEffect } from "react";
import { fastApiService } from "../services/fastApiService";

export interface FeedbackItem {
  message: string;
  priority: number;
}

// Module-level cache to persist across component unmounts (pane switches)
const feedbackCache = new Map<string, FeedbackItem[]>();
const fetchedDrafts = new Set<string>();

export function useFeedback(
  draftId: string | undefined,
  draftQuestionCount: number
) {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch feedback from API
  const fetchFeedback = useCallback(
    async (forceRefresh: boolean = false) => {
      if (!draftId) return;

      if (draftQuestionCount < 5) {
        setFeedbacks([]);
        setError(null);
        return;
      }

      // Check cache first (unless force refresh from Update button)
      if (!forceRefresh && feedbackCache.has(draftId)) {
        const cachedFeedback = feedbackCache.get(draftId)!;
        setFeedbacks(cachedFeedback);
        setError(null);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const response = await fastApiService.getFeedback(draftId);
        const newFeedbacks = response.feedbacks || [];

        // Update cache
        feedbackCache.set(draftId, newFeedbacks);
        fetchedDrafts.add(draftId);

        setFeedbacks(newFeedbacks);
      } catch (err) {
        console.error("Failed to fetch feedback:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load feedback"
        );
        setFeedbacks([]);
      } finally {
        setIsLoading(false);
      }
    },
    [draftId, draftQuestionCount]
  );

  // Fetch feedback on initial load for new drafts only
  useEffect(() => {
    if (!draftId) return;

    // Only load from cache, don't auto-fetch
    if (feedbackCache.has(draftId)) {
      // Load from cache if available
      const cachedFeedback = feedbackCache.get(draftId)!;
      setFeedbacks(cachedFeedback);
      setError(null);
    } else {
      // Clear feedback when switching to a draft without cached feedback
      setFeedbacks([]);
      setError(null);
    }
  }, [draftId]);

  return {
    feedbacks,
    isLoading,
    error,
    fetchFeedback,
  };
}
