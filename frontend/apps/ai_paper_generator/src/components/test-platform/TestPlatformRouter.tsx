/**
 * TestPlatformRouter
 * Router component for test platform routes
 * Handles /test/:shareCode/* routes outside main app
 */

import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
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
  const location = useLocation();

  if (!isAuthenticated) {
    return (
      <Navigate to="/login?mode=test" state={{ from: location }} replace />
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
