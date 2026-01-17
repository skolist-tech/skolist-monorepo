import { useState, useEffect } from "react";
import { type GeneratedQuestionWithConcepts } from "../../context/QuestionsContext";
import { useActivityContext } from "../../context/ActivityContext";
import { getClient } from "../../services/supabase";
import { DifficultyCard } from "./DifficultyCard";
import { SyllabusCard } from "./SyllabusCard";
import { QualityCard } from "./QualityCard";
import { AccuracyCard } from "./AccuracyCard";

interface StatsOverviewProps {
  questions: GeneratedQuestionWithConcepts[];
}

export function StatsOverview({ questions }: StatsOverviewProps) {
  const { currentActivity } = useActivityContext();
  const [totalActivityConcepts, setTotalActivityConcepts] = useState<number>(0);

  // 1. Difficulty Calculation
  // 1. Difficulty Calculation (Marks Weighted from Draft)
  const easyMarks = questions
    .filter((q) => q.is_in_draft && q.hardness_level === "easy")
    .reduce((sum, q) => sum + (q.marks || 0), 0);

  const mediumMarks = questions
    .filter((q) => q.is_in_draft && q.hardness_level === "medium")
    .reduce((sum, q) => sum + (q.marks || 0), 0);

  const hardMarks = questions
    .filter((q) => q.is_in_draft && q.hardness_level === "hard")
    .reduce((sum, q) => sum + (q.marks || 0), 0);

  // 2. Syllabus Coverage Calculation
  useEffect(() => {
    async function fetchTotalConcepts() {
      if (!currentActivity?.id) return;

      const client = getClient();
      const { count, error } = await client
        .from("concepts_activities_maps")
        .select("*", { count: "exact", head: true })
        .eq("activity_id", currentActivity.id);

      if (!error && count !== null) {
        setTotalActivityConcepts(count);
      } else {
        console.error("Failed to fetch activity concepts count:", error);
      }
    }

    fetchTotalConcepts();
  }, [currentActivity?.id]);

  const uniqueDraftConcepts = new Set(
    questions
      .filter((q) => q.is_in_draft)
      .flatMap((q) => q.concepts?.map((c) => c.id) || [])
  );

  // 3. Summary Stats
  const accuracy = 100; // TODO: Replace with actual accuracy calculation

  // TODO: Replace with actual percentile calculation or API call
  const qualityPercentile = 1;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <DifficultyCard
        easyMarks={easyMarks}
        mediumMarks={mediumMarks}
        hardMarks={hardMarks}
      />
      <SyllabusCard
        draftConceptCount={uniqueDraftConcepts.size}
        totalActivityConcepts={totalActivityConcepts}
      />
      <QualityCard percentile={qualityPercentile} />
      <AccuracyCard accuracy={accuracy} />
    </div>
  );
}
