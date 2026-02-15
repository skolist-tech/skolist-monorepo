import { useState, useMemo } from "react";
import { type GeneratedQuestionWithConcepts } from "../context/QuestionsContext";
import { useConceptContext } from "../context/ConceptContext";

export interface MetricRow {
  name: string;
  easy: number;
  medium: number;
  hard: number;
  total: number;
}

export type TabType = "chapter" | "topic" | "concepts";

export const TAB_LABELS: Record<TabType, string> = {
  chapter: "Chapter",
  topic: "Topic",
  concepts: "Concepts",
};

export const TABS: TabType[] = ["chapter", "topic", "concepts"];

export interface UseDetailedMetricsResult {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  metrics: MetricRow[];
  grandTotal: {
    easy: number;
    medium: number;
    hard: number;
    total: number;
  };
  currentTabIndex: number;
  handlePrevTab: () => void;
  handleNextTab: () => void;
}

export function useDetailedMetrics(
  questions: GeneratedQuestionWithConcepts[]
): UseDetailedMetricsResult {
  const [activeTab, setActiveTab] = useState<TabType>("chapter");
  const { treeNodes } = useConceptContext();

  // Build lookup maps from treeNodes
  // treeNodes is array of chapters -> topics -> concepts
  const { conceptToTopicMap, conceptToChapterMap, topicNames, chapterNames } =
    useMemo(() => {
      const conceptToTopic = new Map<string, string>();
      const conceptToChapter = new Map<string, string>();
      const topicToChapter = new Map<string, string>(); // Kept internal if needed later or just to match orig logic structure
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
      if (!q.is_in_draft) return;

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
  const currentTabIndex = TABS.indexOf(activeTab);

  const handlePrevTab = () => {
    const prevTab = TABS[currentTabIndex - 1];
    if (currentTabIndex > 0 && prevTab) {
      setActiveTab(prevTab);
    }
  };

  const handleNextTab = () => {
    const nextTab = TABS[currentTabIndex + 1];
    if (currentTabIndex < TABS.length - 1 && nextTab) {
      setActiveTab(nextTab);
    }
  };

  return {
    activeTab,
    setActiveTab,
    metrics,
    grandTotal,
    currentTabIndex,
    handlePrevTab,
    handleNextTab,
  };
}
