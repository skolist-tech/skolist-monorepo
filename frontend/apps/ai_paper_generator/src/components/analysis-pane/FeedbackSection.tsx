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
import { useDraftContext } from "../../context/DraftContext";
import { useQuestionsContext } from "../../context/QuestionsContext";
import { useFeedback } from "../../hooks/useFeedback";
import { FeedbackList } from "./feedback/FeedbackList";
import { FeedbackEmptyState } from "./feedback/FeedbackEmptyState";
import { FeedbackNotEnoughQuestions } from "./feedback/FeedbackNotEnoughQuestions";

export function FeedbackSection() {
  const { draft } = useDraftContext();
  const { questions } = useQuestionsContext();

  // Count draft questions
  const draftQuestionCount = questions.filter((q) => q.is_in_draft).length;

  const { feedbacks, isLoading, error, fetchFeedback } = useFeedback(
    draft?.id,
    draftQuestionCount
  );

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
            <FeedbackNotEnoughQuestions
              count={draftQuestionCount}
              required={5}
            />
          )}

          {/* Feedback List */}
          {!isLoading &&
            !error &&
            draftQuestionCount >= 5 &&
            feedbacks.length > 0 && <FeedbackList feedbacks={feedbacks} />}

          {/* No Feedback - Show Get Feedback Button */}
          {!isLoading &&
            !error &&
            draftQuestionCount >= 5 &&
            feedbacks.length === 0 && (
              <FeedbackEmptyState onGetFeedback={() => fetchFeedback(true)} />
            )}
        </div>
      </Card>
    </TooltipProvider>
  );
}
