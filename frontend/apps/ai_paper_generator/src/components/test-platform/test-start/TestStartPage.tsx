/**
 * TestStartPage
 * Initial page shown before starting the test
 * Shows test details and instructions
 */

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Clock, Award, AlertCircle, FileText, CheckCircle } from "lucide-react";
import { useTestContext } from "../../../context/TestContext";
import { testAttemptService } from "../../../services/testAttemptService";
import type { OnlineTest } from "../../../services/testAttemptService";

export function TestStartPage() {
  const { shareCode } = useParams<{ shareCode: string }>();
  const navigate = useNavigate();
  const { dispatch } = useTestContext();

  const [test, setTest] = useState<OnlineTest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    async function loadTest() {
      if (!shareCode) {
        setError("Invalid test link");
        setLoading(false);
        return;
      }

      try {
        const testData = await testAttemptService.getTestByShareCode(shareCode);
        setTest(testData);

        // Load test into context
        dispatch({ type: "LOAD_TEST_DATA", payload: testData });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load test");
      } finally {
        setLoading(false);
      }
    }

    loadTest();
  }, [shareCode, dispatch]);

  const handleStartTest = async () => {
    if (!test) return;

    setIsStarting(true);
    try {
      const attempt = await testAttemptService.startTestAttempt(test.id);

      // Update context with attempt data
      dispatch({ type: "START_TEST_ATTEMPT", payload: attempt });

      // Navigate to test interface
      navigate(`/test/${shareCode}/attempt`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start test");
    } finally {
      setIsStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading test details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-full max-w-md rounded-lg bg-white p-6 text-center shadow-md">
          <AlertCircle className="mx-auto mb-4 h-16 w-16 text-red-500" />
          <h2 className="mb-2 text-xl font-semibold text-gray-900">
            Test Not Available
          </h2>
          <p className="mb-4 text-gray-600">{error}</p>
          <button
            onClick={() => window.history.back()}
            className="w-full rounded-md bg-gray-600 px-4 py-2 text-white transition-colors hover:bg-gray-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!test) return null;

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="mb-6 rounded-lg bg-white p-6 shadow-md">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="mb-2 text-2xl font-bold text-gray-900">
                {test.title}
              </h1>
              {test.description && (
                <p className="mb-4 text-gray-700">{test.description}</p>
              )}

              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  <span>{test.total_questions} Questions</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{formatDuration(test.duration_minutes)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Award className="h-4 w-4" />
                  <span>{test.total_marks} Marks</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mb-6 rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            Important Instructions
          </h2>

          <div className="space-y-3 text-gray-700">
            <div className="flex items-start gap-3">
              <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
              <p>Read each question carefully before answering.</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
              <p>
                You can navigate between questions using the question palette.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
              <p>
                Use "Mark for Review" to flag questions you want to revisit.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
              <p>Your answers are saved automatically every 30 seconds.</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
              <p>The test will auto-submit when time expires.</p>
            </div>
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-orange-500" />
              <p className="font-medium">
                Do not refresh the page or close the browser during the test.
              </p>
            </div>
          </div>
        </div>

        {/* Test Summary */}
        <div className="mb-6 grid gap-6 md:grid-cols-2">
          <div className="rounded-lg bg-white p-6 shadow-md">
            <h3 className="mb-4 text-lg font-semibold">Test Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Questions:</span>
                <span className="font-medium">{test.total_questions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Marks:</span>
                <span className="font-medium">{test.total_marks}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Duration:</span>
                <span className="font-medium">
                  {formatDuration(test.duration_minutes)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Negative Marking:</span>
                <span className="font-medium">
                  {test.negative_marking
                    ? `Yes (-${test.negative_marks_per_question})`
                    : "No"}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-md">
            <h3 className="mb-4 text-lg font-semibold">
              Question Distribution
            </h3>
            {test.sections && test.sections.length > 0 ? (
              <div className="space-y-2">
                {test.sections.map((section, index) => (
                  <div key={index} className="flex justify-between">
                    <span className="text-gray-600">{section.name}:</span>
                    <span className="font-medium">
                      {section.question_count} questions
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">All questions in single section</p>
            )}
          </div>
        </div>

        {/* Start Test Button */}
        <div className="rounded-lg bg-white p-6 text-center shadow-md">
          <h3 className="mb-4 text-lg font-semibold">Ready to begin?</h3>
          <p className="mb-6 text-gray-600">
            Make sure you have a stable internet connection and won't be
            interrupted.
          </p>

          <button
            onClick={handleStartTest}
            disabled={isStarting}
            className="rounded-md bg-blue-600 px-8 py-3 text-lg font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isStarting ? (
              <div className="flex items-center justify-center gap-2">
                <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-white"></div>
                Starting Test...
              </div>
            ) : (
              "Start Test"
            )}
          </button>

          <p className="mt-4 text-sm text-gray-500">
            Timer will start as soon as you click "Start Test"
          </p>
        </div>
      </div>
    </div>
  );
}
