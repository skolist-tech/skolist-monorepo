/**
 * TestPlatformRouter
 * Router component for test platform routes
 * Handles /test/:shareCode/* routes outside main app
 */

import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@skolist/auth";
import { TestContextProvider } from "../../context/TestContext";
import { TestStartPage } from "./test-start/TestStartPage";
import { TestInterface } from "./test-interface/TestInterface";
import { TestCompletedPage } from "./shared/TestCompletedPage";

// Simple auth check for test platform
const useTestAuth = () => {
  const { user } = useAuth();
  return !!user;
};

// Protected route wrapper for test platform
function ProtectedTestRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useTestAuth();

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-full max-w-md rounded-lg bg-white p-6 text-center shadow-md">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            Authentication Required
          </h2>
          <p className="mb-6 text-gray-600">
            You must be logged in to access this test.
          </p>
          <button
            onClick={() => {
              // Redirect to login with return URL
              window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
            }}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
          >
            Login to Continue
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export function TestPlatformRouter() {
  return (
    <TestContextProvider>
      <Routes>
        {/* Test start page - shows test details and instructions */}
        <Route
          path="/:shareCode"
          element={
            <ProtectedTestRoute>
              <TestStartPage />
            </ProtectedTestRoute>
          }
        />

        {/* Test interface - main test taking interface */}
        <Route
          path="/:shareCode/attempt"
          element={
            <ProtectedTestRoute>
              <TestInterface />
            </ProtectedTestRoute>
          }
        />

        {/* Test completed page */}
        <Route
          path="/:shareCode/completed"
          element={
            <ProtectedTestRoute>
              <TestCompletedPage />
            </ProtectedTestRoute>
          }
        />

        {/* Redirect any other test routes to start page */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </TestContextProvider>
  );
}
