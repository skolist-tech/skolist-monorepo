import { Lightbulb } from "lucide-react";

interface FeedbackNotEnoughQuestionsProps {
  count: number;
  required: number;
}

export function FeedbackNotEnoughQuestions({
  count,
  required,
}: FeedbackNotEnoughQuestionsProps) {
  return (
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
      <p className="absolute left-1/2 top-[calc(50%+40px)] -translate-x-1/2 text-xs text-gray-500">
        ({count}/{required} questions)
      </p>
    </div>
  );
}
