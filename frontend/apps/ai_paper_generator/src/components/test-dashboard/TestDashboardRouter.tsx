import { Routes, Route } from "react-router-dom";
import { TestDashboardHome } from "./TestDashboardHome";
import { TestDashboardDetails } from "./TestDashboardDetails";
import { TestAttemptView } from "./TestAttemptView";

export function TestDashboardRouter() {
  return (
    <Routes>
      <Route path="/" element={<TestDashboardHome />} />
      <Route path="/details/:testId" element={<TestDashboardDetails />} />
      <Route
        path="/details/:testId/attempt/:attemptId"
        element={<TestAttemptView />}
      />
    </Routes>
  );
}
