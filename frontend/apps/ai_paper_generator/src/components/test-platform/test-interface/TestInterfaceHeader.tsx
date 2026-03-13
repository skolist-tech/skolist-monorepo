import { useState } from "react";
import { CheckCircle, Clock, Loader2 } from "lucide-react";

type TestInterfaceHeaderProps = {
  fullTestTitle: string;
  currentQuestionIndex: number;
  totalQuestions: number;
  answeredCount: number;
  formattedTime: string;
  timerColor: string;
  isInWarning: boolean;
  isSavingAnswer: boolean;
  isSubmitting: boolean;
  onSubmitClick: () => void;
};

export function TestInterfaceHeader({
  fullTestTitle,
  currentQuestionIndex,
  totalQuestions,
  answeredCount,
  formattedTime,
  timerColor,
  isInWarning,
  isSavingAnswer,
  isSubmitting,
  onSubmitClick,
}: TestInterfaceHeaderProps) {
  const [showMobileTitleTooltip, setShowMobileTitleTooltip] = useState(false);

  const isMobileTitleTruncated = fullTestTitle.length > 15;
  const mobileTestTitle = isMobileTitleTruncated
    ? `${fullTestTitle.slice(0, 15)}...`
    : fullTestTitle;

  return (
    <div className="border-b bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 py-3">
        {/* Mobile Header: exactly two rows */}
        <div className="space-y-2 sm:hidden">
          <div className="flex items-center justify-between gap-3">
            <div className="relative min-w-0">
              <button
                type="button"
                onClick={() => {
                  if (isMobileTitleTruncated) {
                    setShowMobileTitleTooltip((prev) => !prev);
                  }
                }}
                title={fullTestTitle}
                className="text-left text-base font-semibold text-gray-900"
              >
                {mobileTestTitle}
              </button>
              {showMobileTitleTooltip && isMobileTitleTruncated && (
                <div className="absolute left-0 top-full z-20 mt-1 max-w-[80vw] rounded-md bg-gray-900 px-3 py-2 text-xs text-white shadow-lg">
                  {fullTestTitle}
                </div>
              )}
            </div>

            <div
              className={`flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 ${
                isInWarning
                  ? "border-red-200 bg-red-50"
                  : "border-gray-200 bg-gray-50"
              }`}
            >
              <Clock className={`h-5 w-5 ${timerColor}`} />
              <span className={`font-mono font-semibold ${timerColor}`}>
                {formattedTime}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 text-sm text-gray-600">
            <span>
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-green-500" />
              {answeredCount} Answered
            </span>
            <button
              onClick={onSubmitClick}
              disabled={isSubmitting}
              className="rounded-md bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700 disabled:opacity-50"
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden items-center justify-between sm:flex">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              {fullTestTitle}
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>
                Question {currentQuestionIndex + 1} of {totalQuestions}
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                {answeredCount} Answered
              </span>
              {isSavingAnswer && (
                <span className="flex items-center gap-1 text-sm text-blue-600">
                  <Loader2 className="h-3 w-3 animate-spin" /> Saving...
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${
                isInWarning
                  ? "border-red-200 bg-red-50"
                  : "border-gray-200 bg-gray-50"
              }`}
            >
              <Clock className={`h-5 w-5 ${timerColor}`} />
              <span className={`font-mono font-semibold ${timerColor}`}>
                {formattedTime}
              </span>
            </div>

            <button
              onClick={onSubmitClick}
              disabled={isSubmitting}
              className="rounded-md bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700 disabled:opacity-50"
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
