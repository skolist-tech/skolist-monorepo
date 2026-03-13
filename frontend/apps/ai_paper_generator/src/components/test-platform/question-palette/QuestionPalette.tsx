/**
 * QuestionPalette
 * Navigation panel showing all questions with their status
 * Similar to NTA Abhyas style interface
 */

import { useTestContext } from "../../../context/TestContext";
import { useQuestionNavigation } from "../../../hooks/test-platform";

export function QuestionPalette() {
  const { state } = useTestContext();
  const { goToQuestion, getQuestionStatus, getQuestionsByStatus, getSections } =
    useQuestionNavigation();

  const questionStats = getQuestionsByStatus();
  const sections = getSections();

  const getStatusColor = (status: string, isCurrent: boolean) => {
    if (isCurrent) {
      return "bg-blue-600 text-white border-blue-600";
    }

    switch (status) {
      case "answered":
        return "bg-green-500 text-white border-green-500";
      case "answered-marked":
        return "bg-purple-500 text-white border-purple-500";
      case "marked":
        return "bg-orange-500 text-white border-orange-500";
      case "visited":
        return "bg-red-300 text-white border-red-300";
      case "not-visited":
        return "bg-white text-gray-700 border-gray-300 hover:bg-gray-50";
      default:
        return "bg-white text-gray-700 border-gray-300 hover:bg-gray-50";
    }
  };

  const legendItems = [
    {
      status: "answered",
      color: "bg-green-500",
      label: "Answered",
    },
    {
      status: "answered-marked",
      color: "bg-purple-500",
      label: "Answered & Marked",
    },
    {
      status: "marked",
      color: "bg-orange-500",
      label: "Marked for Review",
    },
    {
      status: "visited",
      color: "bg-red-300",
      label: "Not Answered",
    },
    {
      status: "not-visited",
      color: "bg-gray-300",
      label: "Not Visited",
    },
  ];

  return (
    <div className="rounded-lg bg-white p-4 shadow-md">
      {/* Header */}
      <div className="mb-4">
        <h3 className="mb-2 font-semibold text-gray-900">Question Palette</h3>

        {/* Statistics */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded bg-green-50 p-2 text-center">
            <div className="text-lg font-bold text-green-600">
              {questionStats.answered.length}
            </div>
            <div className="text-green-700">Answered</div>
          </div>
          <div className="rounded bg-gray-50 p-2 text-center">
            <div className="text-lg font-bold text-gray-600">
              {questionStats.notAnswered.length}
            </div>
            <div className="text-gray-700">Unanswered</div>
          </div>
        </div>

        {questionStats.markedForReview.length > 0 && (
          <div className="mt-2 rounded bg-orange-50 p-2 text-center text-sm">
            <div className="text-lg font-bold text-orange-600">
              {questionStats.markedForReview.length}
            </div>
            <div className="text-orange-700">Marked for Review</div>
          </div>
        )}
      </div>

      {/* Section-wise Questions */}
      {sections.length > 1 ? (
        <div className="space-y-4">
          {sections.map((section) => (
            <div key={section.name} className="border-b pb-4 last:border-b-0">
              <h4 className="mb-2 text-sm font-medium text-gray-800">
                {section.name} ({section.answered}/{section.total})
              </h4>
              <div className="grid grid-cols-5 gap-1">
                {section.questions.map((questionId) => {
                  const question = state.questions.find(
                    (q) => q.id === questionId
                  );
                  if (!question) return null;

                  const questionNumber =
                    state.questions.findIndex((q) => q.id === questionId) + 1;
                  const status = getQuestionStatus(questionId);
                  const isCurrent = state.currentQuestionId === questionId;

                  return (
                    <button
                      key={questionId}
                      onClick={() => goToQuestion(questionId)}
                      className={`flex h-8 w-8 items-center justify-center rounded border text-xs font-medium transition-colors duration-150 ${getStatusColor(status, isCurrent)} `}
                      title={`Question ${questionNumber} - ${status.replace("-", " ")}`}
                    >
                      {questionNumber}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Single section view
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-800">
            All Questions ({questionStats.answered.length}/{questionStats.total}
            )
          </h4>
          <div className="grid grid-cols-5 gap-1">
            {state.questions.map((question) => {
              const questionNumber =
                state.questions.findIndex((q) => q.id === question.id) + 1;
              const status = getQuestionStatus(question.id);
              const isCurrent = state.currentQuestionId === question.id;

              return (
                <button
                  key={question.id}
                  onClick={() => goToQuestion(question.id)}
                  className={`flex h-8 w-8 items-center justify-center rounded border text-xs font-medium transition-colors duration-150 ${getStatusColor(status, isCurrent)} `}
                  title={`Question ${questionNumber} - ${status.replace("-", " ")}`}
                >
                  {questionNumber}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 border-t pt-4">
        <h4 className="mb-3 text-sm font-medium text-gray-800">Legend</h4>
        <div className="space-y-2">
          {legendItems.map((item) => {
            return (
              <div
                key={item.status}
                className="flex items-center gap-2 text-xs"
              >
                <div className={`h-4 w-4 ${item.color} rounded`} />
                <span className="text-gray-700">{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
