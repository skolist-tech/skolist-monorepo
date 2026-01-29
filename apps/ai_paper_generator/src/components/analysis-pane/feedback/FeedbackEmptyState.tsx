import { Sparkles } from "lucide-react";

interface FeedbackEmptyStateProps {
  onGetFeedback: () => void;
}

export function FeedbackEmptyState({ onGetFeedback }: FeedbackEmptyStateProps) {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <Sparkles className="mx-auto h-12 w-12 text-blue-400" />
        <p className="mt-3 text-sm font-medium text-gray-700">
          Ready to analyze your draft
        </p>
        <button
          onClick={onGetFeedback}
          className="mx-auto mt-4 flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-2.5 text-sm font-medium text-white shadow-md transition-all hover:from-blue-600 hover:to-indigo-700 hover:shadow-lg"
        >
          <Sparkles className="h-4 w-4" />
          Get Feedback
        </button>
      </div>
    </div>
  );
}
