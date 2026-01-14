import { ActivityProvider } from "../context/ActivityContext";
import { PaneProvider } from "../context/PaneContext";
import { ConceptProvider } from "../context/ConceptContext";
import { QuestionsProvider } from "../context/QuestionsContext";
import { Layout } from "../components/layout/Layout";
import { ErrorBoundary } from "../components/shared/ErrorBoundary";

export function DashboardPage() {
  return (
    <ErrorBoundary>
      <ActivityProvider>
        <PaneProvider>
          <ConceptProvider>
            <QuestionsProvider>
              <Layout />
            </QuestionsProvider>
          </ConceptProvider>
        </PaneProvider>
      </ActivityProvider>
    </ErrorBoundary>
  );
}
