/**
 * TestInterface
 * Main test taking interface with question display and controls
 */

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Flag,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Save,
  X,
  Edit2,
} from "lucide-react";
import { useTestContext } from "../../../context/TestContext";
import {
  useTestTimer,
  useQuestionNavigation,
} from "../../../hooks/test-platform";
import { testAttemptService } from "../../../services/testAttemptService";
import { QuestionPalette } from "../question-palette";
import { TestInterfaceHeader } from "./TestInterfaceHeader";

export function TestInterface() {
  const { shareCode } = useParams<{ shareCode: string }>();
  const navigate = useNavigate();
  const { state, dispatch } = useTestContext();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editTextValue, setEditTextValue] = useState<string>("");
  const [isSavingAnswer, setIsSavingAnswer] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">(
    "idle"
  );

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

  // Removed useAutoSave - handling saves explicitly per question type

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

  useEffect(() => {
    setIsEditing(false);
    setEditTextValue("");
    setSaveStatus("idle");
  }, [state.currentQuestionId]);

  async function handleTimeUp() {
    await handleSubmitTest(true); // Auto-submit when time is up
  }

  async function handleSubmitTest(isAutoSubmit = false) {
    if (!state.currentAttempt?.id) return;

    // Check if currently editing a text answer
    if (isEditing && editTextValue.trim() !== "") {
      const confirmSubmit = window.confirm(
        "You have an unsaved answer in the editor. Do you want to submit anyway? Any unsaved changes will be lost."
      );
      if (!confirmSubmit) return;
    }

    setIsSubmitting(true);
    try {
      await testAttemptService.submitTestAttempt(state.currentAttempt.id);

      dispatch({ type: "COMPLETE_TEST" });

      // Navigate to results or thank you page
      navigate(`/test/${shareCode}/completed`, {
        state: { isAutoSubmit },
      });
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to submit test");
    } finally {
      setIsSubmitting(false);
      setShowSubmitConfirm(false);
    }
  }

  // Handle immediate save for MCQ/MSQ
  const handleOptionChange = async (
    questionId: string,
    answer: string | string[]
  ) => {
    // Optimistic update
    dispatch({
      type: "SET_ANSWER",
      payload: { questionId, answer },
    });

    if (!state.currentAttempt?.id) return;

    const question = state.questions.find((q) => q.id === questionId);
    if (!question) return;

    setIsSavingAnswer(true);
    setSaveStatus("idle");

    try {
      await testAttemptService.saveSingleStudentAnswer(
        state.currentAttempt.id,
        question,
        answer
      );
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (err) {
      console.error("Failed to save answer:", err);
      setSaveStatus("error");
      // Could revert state here if strict, but maybe better to show error UI
    } finally {
      setIsSavingAnswer(false);
    }
  };

  // Handle explicit save for Text answers
  const handleTextSave = async (questionId: string) => {
    if (!state.currentAttempt?.id) return;

    const answer = editTextValue;
    const question = state.questions.find((q) => q.id === questionId);
    if (!question) return;

    setIsSavingAnswer(true);
    setSaveStatus("idle");

    try {
      // Save to DB first
      await testAttemptService.saveSingleStudentAnswer(
        state.currentAttempt.id,
        question,
        answer
      );

      // Then update context and exit edit mode
      dispatch({
        type: "SET_ANSWER",
        payload: { questionId, answer },
      });

      setIsEditing(false);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (err) {
      console.error("Failed to save answer:", err);
      setSaveStatus("error");
      alert("Failed to save answer. Please try again.");
    } finally {
      setIsSavingAnswer(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditTextValue("");
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
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="inline-flex h-8 items-center rounded bg-blue-100 px-2 text-sm font-medium leading-none text-blue-800">
            Q{getCurrentQuestionIndex() + 1}
          </span>
          <span className="inline-flex h-8 items-center rounded bg-green-100 px-2 text-sm leading-none text-green-800">
            {question.marks} Mark{question.marks !== 1 ? "s" : ""}
          </span>

          <button
            onClick={() => handleMarkForReview(question.id)}
            className={`inline-flex h-8 items-center gap-1 rounded px-2 text-sm leading-none transition-colors ${
              isMarked
                ? "bg-orange-100 text-orange-800 hover:bg-orange-200"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <Flag className="h-3.5 w-3.5" />
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
                      handleOptionChange(question.id, e.target.value)
                    }
                    className="mt-1 text-blue-600"
                  />
                  <span className="flex-1">{option}</span>
                </label>
              ))}
              {/* Saving Indicator for MCQ */}
              {isSavingAnswer && (
                <div className="mt-2 flex justify-end text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" /> Saving...
                  </span>
                </div>
              )}
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
                      handleOptionChange(question.id, newAnswers);
                    }}
                    className="mt-1 text-blue-600"
                  />
                  <span className="flex-1">{option}</span>
                </label>
              ))}
              {isSavingAnswer && (
                <div className="mt-2 flex justify-end text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" /> Saving...
                  </span>
                </div>
              )}
            </div>
          )}

          {question.type === "text_input" && (
            <div className="space-y-4">
              {!isEditing && currentAnswer ? (
                <div className="rounded-lg border bg-gray-50 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">
                      Saved Answer
                    </span>
                    <button
                      onClick={() => {
                        setEditTextValue(currentAnswer as string);
                        setIsEditing(true);
                      }}
                      className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                    >
                      <Edit2 className="h-4 w-4" />
                      Edit
                    </button>
                  </div>
                  <p className="whitespace-pre-wrap text-gray-900">
                    {currentAnswer as string}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <textarea
                    value={editTextValue}
                    onChange={(e) => setEditTextValue(e.target.value)}
                    placeholder="Type your answer here..."
                    className="min-h-[150px] w-full rounded-lg border p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="mt-2 flex items-center justify-end gap-2">
                    {currentAnswer && (
                      <button
                        onClick={handleCancelEdit}
                        className="flex items-center gap-1 rounded bg-gray-100 px-3 py-2 text-gray-700 hover:bg-gray-200"
                      >
                        <X className="h-4 w-4" />
                        Cancel
                      </button>
                    )}

                    <button
                      onClick={() => handleTextSave(question.id)}
                      disabled={
                        isSavingAnswer ||
                        (editTextValue.trim() === "" && !!currentAnswer)
                      } // Prevent saving empty over existing?, actually allow saving empty to clear? No, typically not desired.
                      className="flex items-center gap-1 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isSavingAnswer ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : saveStatus === "saved" ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      {isSavingAnswer
                        ? "Saving..."
                        : saveStatus === "saved"
                          ? "Saved"
                          : "Save Answer"}
                    </button>
                  </div>
                </div>
              )}
            </div>
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
      <TestInterfaceHeader
        fullTestTitle={state.test?.title ?? "Untitled Test"}
        currentQuestionIndex={getCurrentQuestionIndex()}
        totalQuestions={state.questions.length}
        answeredCount={questionStats.answered.length}
        formattedTime={formattedTime}
        timerColor={timerColor}
        isInWarning={isInWarning}
        isSavingAnswer={isSavingAnswer}
        isSubmitting={isSubmitting}
        onSubmitClick={() => setShowSubmitConfirm(true)}
      />

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
