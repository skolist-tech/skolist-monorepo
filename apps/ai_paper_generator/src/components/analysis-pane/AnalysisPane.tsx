import { useQuestionsContext } from "../../context/QuestionsContext";
import { StatsOverview } from "./StatsOverview";
import { DetailedMetricsTable } from "./DetailedMetricsTable";
import { FeedbackSection } from "./FeedbackSection";
import { MissingTopicsSection } from "./MissingTopicsSection";

export function AnalysisPane() {
  const { questions } = useQuestionsContext();

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-slate-50 p-4 md:p-6">
      <div className="mx-auto w-full max-w-6xl space-y-4 md:space-y-6">
        {/* Top Section - Stats Cards */}
        <section>
          <StatsOverview questions={questions} />
        </section>

        {/* Middle Section - Detailed Metrics */}
        <section>
          <DetailedMetricsTable questions={questions} />
        </section>

        {/* Bottom Section - Feedback & Missing */}
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
          <div className="min-h-[200px] md:h-[250px]">
            <FeedbackSection />
          </div>
          <div className="min-h-[200px] md:h-[250px]">
            <MissingTopicsSection />
          </div>
        </section>
      </div>
    </div>
  );
}
