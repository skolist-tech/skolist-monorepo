import { Route, Routes } from "react-router-dom";
import { StudentAttemptsHome } from "./StudentAttemptsHome";
import { StudentAttemptView } from "./StudentAttemptView";

export function StudentAttemptsRouter() {
  return (
    <Routes>
      <Route path="/" element={<StudentAttemptsHome />} />
      <Route path="/attempt/:attemptId" element={<StudentAttemptView />} />
    </Routes>
  );
}
