import { ErrorBoundary } from "../components/shared/ErrorBoundary";
import { StudentAttemptsHeader } from "../components/student-attempts/StudentAttemptsHeader";
import { StudentAttemptsRouter } from "../components/student-attempts/StudentAttemptsRouter";

export function StudentAttemptsPage() {
  return (
    <ErrorBoundary>
      <div className="flex h-screen flex-col bg-background">
        <StudentAttemptsHeader />
        <div className="flex-1 overflow-auto p-6">
          <StudentAttemptsRouter />
        </div>
      </div>
    </ErrorBoundary>
  );
}
