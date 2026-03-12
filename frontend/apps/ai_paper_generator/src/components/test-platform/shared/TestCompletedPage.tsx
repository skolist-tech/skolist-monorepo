/**
 * TestCompletedPage
 * Page shown after test submission
 */

import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle, Clock, FileText } from "lucide-react";

export function TestCompletedPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const isAutoSubmit = location.state?.isAutoSubmit || false;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-md">
        {/* Success Icon */}
        <div className="mb-6">
          <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
        </div>

        {/* Title */}
        <h1 className="mb-4 text-2xl font-bold text-gray-900">
          Test Submitted Successfully!
        </h1>

        {/* Message */}
        <div className="mb-6">
          {isAutoSubmit ? (
            <div className="mb-4 rounded-lg border border-orange-200 bg-orange-50 p-4">
              <div className="mb-2 flex items-center gap-2 text-orange-800">
                <Clock className="h-5 w-5" />
                <span className="font-medium">Time Up!</span>
              </div>
              <p className="text-sm text-orange-700">
                Your test was automatically submitted when the timer reached
                zero.
              </p>
            </div>
          ) : (
            <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4">
              <div className="mb-2 flex items-center gap-2 text-green-800">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Submitted Successfully</span>
              </div>
              <p className="text-sm text-green-700">
                You have successfully submitted your test.
              </p>
            </div>
          )}

          <p className="text-gray-600">
            Thank you for taking the test. Your responses have been recorded and
            will be evaluated by your instructor.
          </p>
        </div>

        {/* Next Steps */}
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="mb-2 flex items-center gap-2 text-blue-800">
            <FileText className="h-5 w-5" />
            <span className="font-medium">What happens next?</span>
          </div>
          <ul className="space-y-1 text-left text-sm text-blue-700">
            <li>• Your instructor will review your responses</li>
            <li>• Results will be available within 2-3 days</li>
            <li>• You'll receive detailed feedback on your performance</li>
            <li>• Check your dashboard for updates</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => navigate("/dashboard")}
            className="w-full rounded-md bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700"
          >
            Go to Dashboard
          </button>

          <button
            onClick={() => window.close()}
            className="w-full rounded-md bg-gray-100 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-200"
          >
            Close Window
          </button>
        </div>

        {/* Footer Note */}
        <div className="mt-6 border-t border-gray-200 pt-4">
          <p className="text-xs text-gray-500">
            Test ID: {new Date().getTime().toString(36).toUpperCase()}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Submitted at: {new Date().toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
