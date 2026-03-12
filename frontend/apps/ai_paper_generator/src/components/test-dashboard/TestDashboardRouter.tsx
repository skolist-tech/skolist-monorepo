import { Routes, Route } from "react-router-dom";
import { TestDashboardHome } from "./TestDashboardHome";
import { TestDashboardDetails } from "./TestDashboardDetails";

export function TestDashboardRouter() {
  return (
    <Routes>
      <Route path="/" element={<TestDashboardHome />} />
      <Route path="/details/:testId" element={<TestDashboardDetails />} />
    </Routes>
  );
}
