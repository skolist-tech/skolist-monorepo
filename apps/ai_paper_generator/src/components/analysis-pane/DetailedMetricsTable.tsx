import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { type GeneratedQuestionWithConcepts } from "../../context/QuestionsContext";
import { useConceptContext } from "../../context/ConceptContext";

interface DetailedMetricsTableProps {
  questions: GeneratedQuestionWithConcepts[];
}

interface MetricRow {
  name: string;
  easy: number;
  medium: number;
  hard: number;
  total: number;
}

type TabType = "chapter" | "topic" | "concepts";

const TAB_LABELS: Record<TabType, string> = {
  chapter: "Chapter",
  topic: "Topic",
  concepts: "Concepts",
};

export function DetailedMetricsTable({ questions }: DetailedMetricsTableProps) {
  const [activeTab, setActiveTab] = useState<TabType>("chapter");
  const { treeNodes } = useConceptContext();

  // Build lookup maps from treeNodes
  // treeNodes is array of chapters -> topics -> concepts
  const {
    conceptToTopicMap,
    conceptToChapterMap,
    // topicToChapterMap,
    topicNames,
    chapterNames,
  } = useMemo(() => {
    const conceptToTopic = new Map<string, string>();
    const conceptToChapter = new Map<string, string>();
    const topicToChapter = new Map<string, string>();
    const topicNamesMap = new Map<string, string>();
    const chapterNamesMap = new Map<string, string>();

    treeNodes.forEach((chapterNode) => {
      const chapterId = chapterNode.value.replace("chapter:", "");
      const chapterLabel =
        typeof chapterNode.label === "string" ? chapterNode.label : chapterId;
      chapterNamesMap.set(chapterId, chapterLabel);

      (chapterNode.children || []).forEach((topicNode) => {
        const topicId = topicNode.value.replace("topic:", "");
        const topicLabel =
          typeof topicNode.label === "string" ? topicNode.label : topicId;
        topicNamesMap.set(topicId, topicLabel);
        topicToChapter.set(topicId, chapterId);

        (topicNode.children || []).forEach((conceptNode) => {
          const conceptId = conceptNode.value.replace("concept:", "");
          conceptToTopic.set(conceptId, topicId);
          conceptToChapter.set(conceptId, chapterId);
        });
      });
    });

    return {
      conceptToTopicMap: conceptToTopic,
      conceptToChapterMap: conceptToChapter,
      _topicToChapterMap: topicToChapter,
      topicNames: topicNamesMap,
      chapterNames: chapterNamesMap,
    };
  }, [treeNodes]);

  // Aggregate data based on active tab
  const metrics = useMemo(() => {
    const metricsMap = new Map<string, MetricRow>();

    questions.forEach((q) => {
      const concepts =
        q.concepts && q.concepts.length > 0
          ? q.concepts
          : [{ id: "uncategorized", name: "Uncategorized" }];

      concepts.forEach((concept) => {
        let groupKey: string;
        let groupName: string;

        if (activeTab === "chapter") {
          const chapterId =
            conceptToChapterMap.get(concept.id) || "uncategorized";
          groupKey = chapterId;
          groupName = chapterNames.get(chapterId) || "Uncategorized";
        } else if (activeTab === "topic") {
          const topicId = conceptToTopicMap.get(concept.id) || "uncategorized";
          groupKey = topicId;
          groupName = topicNames.get(topicId) || "Uncategorized";
        } else {
          groupKey = concept.id;
          groupName = concept.name;
        }

        if (!metricsMap.has(groupKey)) {
          metricsMap.set(groupKey, {
            name: groupName,
            easy: 0,
            medium: 0,
            hard: 0,
            total: 0,
          });
        }

        const metric = metricsMap.get(groupKey)!;
        metric.total += 1;
        if (q.hardness_level === "easy") metric.easy += 1;
        else if (q.hardness_level === "medium") metric.medium += 1;
        else if (q.hardness_level === "hard") metric.hard += 1;
      });
    });

    return Array.from(metricsMap.values());
  }, [
    questions,
    activeTab,
    conceptToChapterMap,
    conceptToTopicMap,
    chapterNames,
    topicNames,
  ]);

  // Calculate grand totals
  const grandTotal = useMemo(() => {
    return metrics.reduce(
      (acc, m) => ({
        easy: acc.easy + m.easy,
        medium: acc.medium + m.medium,
        hard: acc.hard + m.hard,
        total: acc.total + m.total,
      }),
      { easy: 0, medium: 0, hard: 0, total: 0 }
    );
  }, [metrics]);

  // Tab navigation
  const tabs: TabType[] = ["chapter", "topic", "concepts"];
  const currentTabIndex = tabs.indexOf(activeTab);

  const handlePrevTab = () => {
    const prevTab = tabs[currentTabIndex - 1];
    if (currentTabIndex > 0 && prevTab) {
      setActiveTab(prevTab);
    }
  };

  const handleNextTab = () => {
    const nextTab = tabs[currentTabIndex + 1];
    if (currentTabIndex < tabs.length - 1 && nextTab) {
      setActiveTab(nextTab);
    }
  };

  return (
    <fieldset className="relative rounded-lg border border-gray-200 bg-white shadow-sm">
      <legend className="ml-4 px-2 text-sm font-medium text-muted-foreground">
        Detailed Breakdown
      </legend>

      {/* Navigation Arrows */}
      <button
        onClick={handlePrevTab}
        disabled={currentTabIndex === 0}
        className="absolute left-0 top-1/2 z-10 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-gray-600 text-white shadow-lg transition-all hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Previous tab"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={handleNextTab}
        disabled={currentTabIndex === tabs.length - 1}
        className="absolute right-0 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full bg-gray-600 text-white shadow-lg transition-all hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Next tab"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      <div className="px-6 pb-4 pt-2">
        {/* Chrome-like Tabs */}
        <div className="flex items-end gap-0 border-b border-gray-400">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative px-6 py-2.5 text-sm font-medium transition-all ${
                activeTab === tab
                  ? "z-10 -mb-px rounded-t-lg border border-gray-400 border-b-white bg-white text-gray-900"
                  : "rounded-t-lg text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              } `}
            >
              {TAB_LABELS[tab]}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="mt-0 w-full overflow-hidden rounded-b-lg border border-t-0 border-gray-400">
          <div className="h-[280px] overflow-auto">
            <table className="w-full table-fixed text-left text-sm">
              <thead className="sticky top-0 bg-gray-50 text-muted-foreground">
                <tr className="border-b border-gray-400">
                  <th className="h-10 w-[40%] px-4 font-medium">
                    {TAB_LABELS[activeTab]}
                  </th>
                  <th className="h-10 w-[15%] px-4 text-center font-medium">
                    Easy
                  </th>
                  <th className="h-10 w-[15%] px-4 text-center font-medium">
                    Medium
                  </th>
                  <th className="h-10 w-[15%] px-4 text-center font-medium">
                    Hard
                  </th>
                  <th className="h-10 w-[15%] px-4 text-center font-medium">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {metrics.length === 0 ? (
                  <tr className="border-b">
                    <td
                      colSpan={5}
                      className="h-24 p-4 text-center text-muted-foreground"
                    >
                      No data available. Generate questions to see metrics.
                    </td>
                  </tr>
                ) : (
                  metrics.map((metric, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-gray-100 transition-colors hover:bg-gray-50"
                    >
                      <td className="w-[40%] p-4 font-medium text-gray-800">
                        {metric.name}
                      </td>
                      <td className="w-[15%] p-4 text-center text-gray-600">
                        {metric.easy > 0 ? metric.easy : "-"}
                      </td>
                      <td className="w-[15%] p-4 text-center text-gray-600">
                        {metric.medium > 0 ? metric.medium : "-"}
                      </td>
                      <td className="w-[15%] p-4 text-center text-gray-600">
                        {metric.hard > 0 ? metric.hard : "-"}
                      </td>
                      <td className="w-[15%] p-4 text-center font-medium text-gray-800">
                        {metric.total}
                        <span className="pl-2 text-xs text-gray-500">
                          (
                          {grandTotal.total > 0
                            ? Math.round(
                                (metric.total / grandTotal.total) * 100
                              )
                            : 0}
                          %)
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* Grand Total Row */}
          <table className="w-full table-fixed border-t border-gray-200 bg-green-50 text-left text-sm">
            <tbody>
              <tr>
                <td className="w-[40%] p-4 font-medium text-green-700">
                  Grand Total
                </td>
                <td className="w-[15%] p-4 text-center font-medium text-green-600">
                  {grandTotal.easy}
                </td>
                <td className="w-[15%] p-4 text-center font-medium text-green-600">
                  {grandTotal.medium}
                </td>
                <td className="w-[15%] p-4 text-center font-medium text-green-600">
                  {grandTotal.hard}
                </td>
                <td className="w-[15%] p-4 text-center font-medium text-green-700">
                  {grandTotal.total}
                  <span className="pl-2 text-xs text-green-600">(100%)</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </fieldset>
  );
}
