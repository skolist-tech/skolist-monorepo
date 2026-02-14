import { type GeneratedQuestionWithConcepts } from "../../context/QuestionsContext";
import { useDetailedMetrics, TABS } from "../../hooks/useDetailedMetrics";
import { MetricsTabs } from "./metrics/MetricsTabs";
import { MetricsTableContent } from "./metrics/MetricsTableContent";

interface DetailedMetricsTableProps {
  questions: GeneratedQuestionWithConcepts[];
}

export function DetailedMetricsTable({ questions }: DetailedMetricsTableProps) {
  const {
    activeTab,
    setActiveTab,
    metrics,
    grandTotal,
    currentTabIndex,
    handlePrevTab,
    handleNextTab,
  } = useDetailedMetrics(questions);

  return (
    <fieldset className="relative rounded-lg border border-gray-200 bg-white shadow-sm">
      <legend className="ml-4 px-2 text-sm font-medium text-muted-foreground">
        Detailed Breakdown
      </legend>

      <div className="px-3 pb-4 pt-2 md:px-6">
        <MetricsTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          tabs={TABS}
          currentTabIndex={currentTabIndex}
          handlePrevTab={handlePrevTab}
          handleNextTab={handleNextTab}
        />

        <MetricsTableContent
          activeTab={activeTab}
          metrics={metrics}
          grandTotal={grandTotal}
        />
      </div>
    </fieldset>
  );
}
