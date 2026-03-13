import { ConceptProvider } from "../context/ConceptContext";
import { TestDashboardRouter } from "../components/test-dashboard/TestDashboardRouter";
import { ErrorBoundary } from "../components/shared/ErrorBoundary";
import { TestDashboardHeader } from "../components/test-dashboard/TestDashboardHeader";

export function TestDashboardPage() {
  return (
    <ErrorBoundary>
      <ConceptProvider>
        <div className="flex h-screen flex-col bg-background">
          <TestDashboardHeader />
          <div className="flex-1 overflow-auto p-6">
            <TestDashboardRouter />
          </div>
        </div>
      </ConceptProvider>
    </ErrorBoundary>
  );
}
