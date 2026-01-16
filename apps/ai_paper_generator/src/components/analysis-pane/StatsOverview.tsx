import { type GeneratedQuestionWithConcepts } from "../../context/QuestionsContext";
import { DifficultyCard } from "./DifficultyCard";
import { SyllabusCard } from "./SyllabusCard";
import { GratificationCard } from "./GratificationCard";
import { SummaryCard } from "./SummaryCard";

interface StatsOverviewProps {
  questions: GeneratedQuestionWithConcepts[];
}

export function StatsOverview({ questions }: StatsOverviewProps) {
  // 1. Difficulty Calculation
  const easyCount = questions.filter((q) => q.hardness_level === "easy").length;
  const mediumCount = questions.filter(
    (q) => q.hardness_level === "medium"
  ).length;
  const hardCount = questions.filter((q) => q.hardness_level === "hard").length;

  // 2. Syllabus Coverage Calculation (Mock logic for now as we need total concepts from syllabus)
  // Assuming a fixed total for demo or deriving from unique concepts found vs expected
  // For now, let's map unique concepts found
  const uniqueConcepts = new Set(
    questions.flatMap((q) => q.concepts?.map((c) => c.name) || [])
  );
  // Mock total concepts for percentage - in real app should come from syllabus context
  const mockTotalConcepts = Math.max(uniqueConcepts.size + 5, 20);
  const coveragePercent = (uniqueConcepts.size / mockTotalConcepts) * 100;

  // 3. Gratification (Draft Completion)
  // Assuming a target of 20 questions for a standard paper
  const targetQuestions = 20;
  const currentQuestions = questions.length;

  // 4. Summary Stats
  const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 0), 0);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <DifficultyCard
        easyCount={easyCount}
        mediumCount={mediumCount}
        hardCount={hardCount}
      />
      <SyllabusCard coveragePercent={coveragePercent} />
      <GratificationCard
        currentQuestions={currentQuestions}
        targetQuestions={targetQuestions}
      />
      <SummaryCard totalMarks={totalMarks} questionCount={currentQuestions} />
    </div>
  );
}
