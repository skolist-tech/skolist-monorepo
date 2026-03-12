/**
 * TestInterface
 * Main test taking interface with question display and controls
 */

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Clock, Flag, CheckCircle, AlertTriangle } from "lucide-react";
import { useTestContext } from "../../../context/TestContext";
import {
  useTestTimer,
  useAutoSave,
  useQuestionNavigation,
} from "../../../hooks/test-platform";
import { testAttemptService } from "../../../services/testAttemptService";
import { QuestionPalette } from "../question-palette";

export function TestInterface() {
  const { shareCode } = useParams<{ shareCode: string }>();
  const navigate = useNavigate();
  const { state, dispatch } = useTestContext();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  // Custom hooks
  const { formattedTime, timerColor, isInWarning, startTimer } = useTestTimer({
    onTimeUp: handleTimeUp,
    onWarning: (timeRemaining) => {
      // Show warning toast/modal
      if (timeRemaining === 300) {
        alert("5 minutes remaining!");
      } else if (timeRemaining === 60) {
        alert("1 minute remaining!");
      }
    },
  });

  const { hasUnsavedChanges, isSaving } = useAutoSave({
    onSaveError: (error) => {
      console.error("Auto-save failed:", error);
      // Show user-friendly error
    },
  });

  const {
    goToNext,
    goToPrevious,
    isFirstQuestion,
    isLastQuestion,
    getCurrentQuestionIndex,
    getQuestionsByStatus,
  } = useQuestionNavigation();

  // Load test questions on mount
  useEffect(() => {
    async function loadQuestions() {
      if (!state.currentAttempt?.id) {
        setError("No active test attempt found");
        setLoading(false);
        return;
      }

      try {
        const questions = await testAttemptService.getTestQuestions(
          state.currentAttempt.id
        );

        dispatch({ type: "LOAD_QUESTIONS", payload: questions });

        if (questions.length > 0) {
          dispatch({ type: "SET_CURRENT_QUESTION", payload: 0 });
        }

        // Start timer
        startTimer();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load questions"
        );
      } finally {
        setLoading(false);
      }
    }

    loadQuestions();
  }, [state.currentAttempt?.id, dispatch, startTimer]);

  async function handleTimeUp() {
    await handleSubmitTest(true); // Auto-submit when time is up
  }

  async function handleSubmitTest(isAutoSubmit = false) {
    if (!state.currentAttempt?.id) return;

    setIsSubmitting(true);
    try {
      await testAttemptService.submitTestAttempt(state.currentAttempt.id);

      dispatch({ type: "COMPLETE_TEST" });

      // Navigate to results or thank you page
      navigate(`/test/${shareCode}/completed`, {
        state: { isAutoSubmit },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit test");
    } finally {
      setIsSubmitting(false);
      setShowSubmitConfirm(false);
    }
  }

  const handleAnswerChange = (
    questionId: string,
    answer: string | string[]
  ) => {
    dispatch({
      type: "SET_ANSWER",
      payload: { questionId, answer },
    });
  };

  const handleMarkForReview = (questionId: string) => {
    dispatch({
      type: "TOGGLE_MARK_FOR_REVIEW",
      payload: questionId,
    });
  };

  const getCurrentQuestion = () => {
    return state.questions.find((q) => q.id === state.currentQuestionId);
  };

  const renderQuestion = () => {
    const question = getCurrentQuestion();
    if (!question) return null;

    const currentAnswer =
      state.answers[question.id] ||
      (question.type === "multiple_choice_multiple" ? [] : "");
    const isMarked = state.markedForReview[question.id];

    return (
      <div className="rounded-lg bg-white p-6 shadow-md">
        {/* Question Header */}
        <div className="mb-4 flex items-start justify-between">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded bg-blue-100 px-2 py-1 text-sm font-medium text-blue-800">
                Question {getCurrentQuestionIndex() + 1} of{" "}
                {state.questions.length}
              </span>
              {question.section && (
                <span className="rounded bg-gray-100 px-2 py-1 text-sm text-gray-700">
                  {question.section}
                </span>
              )}
              <span className="rounded bg-green-100 px-2 py-1 text-sm text-green-800">
                {question.marks} Mark{question.marks !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          <button
            onClick={() => handleMarkForReview(question.id)}
            className={`flex items-center gap-1 rounded px-3 py-1.5 transition-colors ${
              isMarked
                ? "bg-orange-100 text-orange-800 hover:bg-orange-200"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <Flag className="h-4 w-4" />
            {isMarked ? "Unmark" : "Mark for Review"}
          </button>
        </div>

        {/* Question Content */}
        <div className="mb-6">
          <div
            className="prose max-w-none text-gray-900"
            dangerouslySetInnerHTML={{ __html: question.question_text }}
          />
        </div>

        {/* Answer Options */}
        <div className="space-y-3">
          {question.type === "multiple_choice_single" && (
            <div className="space-y-2">
              {question.options?.map((option, index) => (
                <label
                  key={index}
                  className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 hover:bg-gray-50"
                >
                  <input
                    type="radio"
                    name={question.id}
                    value={option}
                    checked={currentAnswer === option}
                    onChange={(e) =>
                      handleAnswerChange(question.id, e.target.value)
                    }
                    className="mt-1 text-blue-600"
                  />
                  <span className="flex-1">{option}</span>
                </label>
              ))}
            </div>
          )}

          {question.type === "multiple_choice_multiple" && (
            <div className="space-y-2">
              {question.options?.map((option, index) => (
                <label
                  key={index}
                  className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    value={option}
                    checked={(currentAnswer as string[]).includes(option)}
                    onChange={(e) => {
                      const currentAnswers = currentAnswer as string[];
                      const newAnswers = e.target.checked
                        ? [...currentAnswers, option]
                        : currentAnswers.filter((a) => a !== option);
                      handleAnswerChange(question.id, newAnswers);
                    }}
                    className="mt-1 text-blue-600"
                  />
                  <span className="flex-1">{option}</span>
                </label>
              ))}
            </div>
          )}

          {question.type === "text_input" && (
            <textarea
              value={currentAnswer as string}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              placeholder="Enter your answer..."
              className="w-full rounded-lg border p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              rows={4}
            />
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading test...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-full max-w-md rounded-lg bg-white p-6 text-center shadow-md">
          <AlertTriangle className="mx-auto mb-4 h-16 w-16 text-red-500" />
          <h2 className="mb-2 text-xl font-semibold text-gray-900">
            Error Loading Test
          </h2>
          <p className="mb-4 text-gray-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const questionStats = getQuestionsByStatus();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                {state.test?.title}
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>
                  Question {getCurrentQuestionIndex() + 1} of{" "}
                  {state.questions.length}
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  {questionStats.answered.length} Answered
                </span>
                {hasUnsavedChanges && (
                  <span className="flex items-center gap-1 text-orange-600">
                    {isSaving ? "Saving..." : "Unsaved changes"}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Timer */}
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

              {/* Submit Test Button */}
              <button
                onClick={() => setShowSubmitConfirm(true)}
                disabled={isSubmitting}
                className="rounded-md bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700 disabled:opacity-50"
              >
                {isSubmitting ? "Submitting..." : "Submit Test"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-4">
          {/* Question Content */}
          <div className="lg:col-span-3">
            {renderQuestion()}

            {/* Navigation */}
            <div className="mt-6 flex justify-between">
              <button
                onClick={goToPrevious}
                disabled={isFirstQuestion()}
                className="rounded-md border border-gray-300 px-6 py-2 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>

              <button
                onClick={goToNext}
                disabled={isLastQuestion()}
                className="rounded-md bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>

          {/* Question Palette */}
          <div className="lg:col-span-1">
            <QuestionPalette />
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold">Submit Test</h3>
            <p className="mb-6 text-gray-600">
              Are you sure you want to submit the test? This action cannot be
              undone. You have answered {questionStats.answered.length} out of{" "}
              {state.questions.length} questions.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSubmitConfirm(false)}
                className="flex-1 rounded-md border border-gray-300 px-4 py-2 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSubmitTest(false)}
                disabled={isSubmitting}
                className="flex-1 rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
              >
                {isSubmitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
