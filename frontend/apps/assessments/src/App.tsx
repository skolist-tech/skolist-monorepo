import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "@skolist/auth";
import { AppLayout } from "./components/layout/AppLayout";
import { RoleRoute } from "./components/layout/RoleRoute";
import { LoginPage } from "./pages/login";
import { HomeRedirect } from "./pages/HomeRedirect";
import { TestListPage } from "./pages/teacher/TestListPage";
import { TestEditorPage } from "./pages/teacher/TestEditorPage";
import { AttemptReviewPage } from "./pages/teacher/AttemptReviewPage";
import { AssignedTestsPage } from "./pages/student/AssignedTestsPage";
import { AttemptPage } from "./pages/student/AttemptPage";
import { ResultPage } from "./pages/student/ResultPage";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<HomeRedirect />} />
        <Route
          path="teacher/tests"
          element={
            <RoleRoute role="teacher">
              <TestListPage />
            </RoleRoute>
          }
        />
        <Route
          path="teacher/tests/:testId"
          element={
            <RoleRoute role="teacher">
              <TestEditorPage />
            </RoleRoute>
          }
        />
        <Route
          path="teacher/tests/:testId/attempts/:attemptId"
          element={
            <RoleRoute role="teacher">
              <AttemptReviewPage />
            </RoleRoute>
          }
        />
        <Route
          path="student/tests"
          element={
            <RoleRoute role="student">
              <AssignedTestsPage />
            </RoleRoute>
          }
        />
        <Route
          path="student/attempts/:attemptId"
          element={
            <RoleRoute role="student">
              <AttemptPage />
            </RoleRoute>
          }
        />
        <Route
          path="student/attempts/:attemptId/result"
          element={
            <RoleRoute role="student">
              <ResultPage />
            </RoleRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
