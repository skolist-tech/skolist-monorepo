import {
  Card,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@skolist/ui";
import {
  Lightbulb,
  Sparkles,
  RefreshCw,
  Info,
  AlertCircle,
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { useDraftContext } from "../../context/DraftContext";
import { useQuestionsContext } from "../../context/QuestionsContext";
import { fastApiService } from "../../services/fastApiService";

interface FeedbackItem {
  message: string;
  priority: number;
}

// Module-level cache to persist across component unmounts (pane switches)
const feedbackCache = new Map<string, FeedbackItem[]>();
const fetchedDrafts = new Set<string>();

export function FeedbackSection() {
  const { draft } = useDraftContext();
  const { questions } = useQuestionsContext();
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Count draft questions
  const draftQuestionCount = questions.filter((q) => q.is_in_draft).length;

  // Fetch feedback from API
  const fetchFeedback = useCallback(
    async (forceRefresh: boolean = false) => {
      if (!draft?.id) return;

      if (draftQuestionCount < 5) {
        setFeedbacks([]);
        setError(null);
        return;
      }

      // Check cache first (unless force refresh from Update button)
      if (!forceRefresh && feedbackCache.has(draft.id)) {
        const cachedFeedback = feedbackCache.get(draft.id)!;
        setFeedbacks(cachedFeedback);
        setError(null);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const response = await fastApiService.getFeedback(draft.id);
        const newFeedbacks = response.feedbacks || [];

        // Update cache
        feedbackCache.set(draft.id, newFeedbacks);
        fetchedDrafts.add(draft.id);

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
    [draft?.id, draftQuestionCount]
  );

  // Fetch feedback on initial load for new drafts only
  useEffect(() => {
    if (!draft?.id) return;

    // Only load from cache, don't auto-fetch
    if (feedbackCache.has(draft.id)) {
      // Load from cache if available
      const cachedFeedback = feedbackCache.get(draft.id)!;
      setFeedbacks(cachedFeedback);
      setError(null);
    } else {
      // Clear feedback when switching to a draft without cached feedback
      setFeedbacks([]);
      setError(null);
    }
  }, [draft?.id]);

  return (
    <TooltipProvider>
      <Card className="relative flex h-full flex-col overflow-hidden border-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-0 shadow-lg">
        {/* Decorative background elements */}
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-blue-100/50 blur-2xl" />
        <div className="absolute -bottom-4 -left-4 h-24 w-24 rounded-full bg-indigo-100/50 blur-xl" />

        {/* Header */}
        <div className="relative flex items-center gap-3 border-b border-blue-100 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 px-5 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md">
            <Lightbulb className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold">Feedback & Suggestions</h3>
            <p className="text-xs text-gray-500">AI-powered insights</p>
          </div>

          {/* Update Button and Info Icon */}
          <div className="flex items-center gap-2">
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => fetchFeedback(true)}
                  disabled={isLoading || draftQuestionCount < 5}
                  className="flex items-center gap-1.5 rounded-lg bg-white/80 px-3 py-1.5 text-xs font-medium text-blue-600 shadow-sm transition-all hover:bg-white hover:shadow disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`}
                  />
                  <span>Update</span>
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Click to get feedback on latest draft</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <div className="flex h-5 w-5 items-center justify-center">
                  <Info className="h-4 w-4 text-blue-400" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Click to get feedback on latest draft</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <Sparkles className="h-4 w-4 text-blue-400" />
        </div>

        {/* Content */}
        <div className="relative flex-1 overflow-y-auto px-5 py-4">
          {/* Loading State */}
          {isLoading && (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <RefreshCw className="mx-auto h-8 w-8 animate-spin text-blue-500" />
                <p className="mt-2 text-sm text-gray-500">
                  Generating feedback...
                </p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <AlertCircle className="mx-auto h-8 w-8 text-red-500" />
                <p className="mt-2 text-sm text-gray-600">{error}</p>
                <button
                  onClick={() => fetchFeedback(true)}
                  className="mt-3 rounded-lg bg-blue-500 px-4 py-2 text-xs font-medium text-white hover:bg-blue-600"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {!isLoading && !error && draftQuestionCount < 5 && (
  <div className="relative h-full">

    {/* Centered block */}
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="text-center">
        <Lightbulb className="mx-auto h-8 w-8 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          Not enough questions are drafted, please draft more to get feedback
        </p>
      </div>
    </div>

    {/* Count (NOT centered) */}
    <p className="absolute top-[calc(50%+40px)] left-1/2 -translate-x-1/2 text-xs text-gray-500">
  ({draftQuestionCount}/5 questions)
</p>

  </div>
)}


          {/* Feedback List */}
          {!isLoading &&
            !error &&
            draftQuestionCount >= 5 &&
            feedbacks.length > 0 && (
              <ul className="space-y-3">
                {feedbacks
                  .sort((a, b) => b.priority - a.priority)
                  .map((feedback, index) => (
                    <li
                      key={index}
                      className="group flex items-start gap-3 rounded-lg border border-transparent p-2.5 transition-all duration-200 hover:border-blue-100 hover:bg-blue-50/50"
                    >
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 text-[10px] font-bold text-white shadow-sm">
                        {index + 1}
                      </span>
                      <span className="text-sm leading-relaxed">
                        {feedback.message}
                      </span>
                    </li>
                  ))}
              </ul>
            )}

          {/* No Feedback - Show Get Feedback Button */}
          {!isLoading &&
            !error &&
            draftQuestionCount >= 5 &&
            feedbacks.length === 0 && (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <Sparkles className="mx-auto h-12 w-12 text-blue-400" />
                  <p className="mt-3 text-sm font-medium text-gray-700">
                    Ready to analyze your draft
                  </p>
                  <button
                    onClick={() => fetchFeedback(true)}
                    className="mx-auto mt-4 flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-2.5 text-sm font-medium text-white shadow-md transition-all hover:from-blue-600 hover:to-indigo-700 hover:shadow-lg"
                  >
                    <Sparkles className="h-4 w-4" />
                    Get Feedback
                  </button>
                </div>
              </div>
            )}
        </div>
      </Card>
    </TooltipProvider>
  );
}
