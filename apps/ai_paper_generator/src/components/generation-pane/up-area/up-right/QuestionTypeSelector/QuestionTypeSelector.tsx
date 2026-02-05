import { QUESTION_TYPE } from "@skolist/db";
import type { QuestionType } from "@skolist/db";
import { QuestionTypeCard } from "./QuestionTypeCard";
import {
  CheckSquare,
  FileText,
  BookOpen,
  Circle,
  Underline,
  ListChecks,
  Columns,
  Lightbulb,
  Dumbbell,
} from "lucide-react";

// Custom extended type
type ExtendedQuestionType =
  | QuestionType
  | "solved_examples"
  | "exercise_questions";

import {
  SUBJECT_QUESTION_CONFIG,
  DEFAULT_QUESTION_TYPES,
} from "../../../../../config/question_types_config";

interface QuestionTypeSelectorProps {
  questionCounts: Record<ExtendedQuestionType, number>;
  onCountChange: (
    type: ExtendedQuestionType | QuestionType,
    count: number
  ) => void;
  subjectName: string;
}

const QUESTION_TYPES: Array<{
  type: ExtendedQuestionType;
  label: string;
  icon: React.ReactNode;
}> = [
  {
    type: QUESTION_TYPE.MCQ4,
    label: "MCQ",
    icon: <CheckSquare className="h-4 w-4 text-primary" />,
  },
  {
    type: QUESTION_TYPE.MSQ4,
    label: "MSQ",
    icon: <ListChecks className="h-4 w-4 text-primary" />,
  },
  {
    type: QUESTION_TYPE.SHORT_ANSWER,
    label: "Short Answer",
    icon: <FileText className="h-4 w-4 text-primary" />,
  },
  {
    type: QUESTION_TYPE.LONG_ANSWER,
    label: "Long Answer",
    icon: <BookOpen className="h-4 w-4 text-primary" />,
  },
  {
    type: QUESTION_TYPE.TRUE_OR_FALSE,
    label: "True/False",
    icon: <Circle className="h-4 w-4 text-primary" />,
  },
  {
    type: QUESTION_TYPE.FILL_IN_THE_BLANKS,
    label: "Fill in the Blanks",
    icon: <Underline className="h-4 w-4 text-primary" />,
  },
  {
    type: QUESTION_TYPE.MATCH_THE_FOLLOWING,
    label: "Match the Following",
    icon: <Columns className="h-4 w-4 text-primary" />,
  },
  {
    type: "solved_examples",
    label: "Solved Examples",
    icon: <Lightbulb className="h-4 w-4 text-primary" />,
  },
  {
    type: "exercise_questions",
    label: "Exercise Questions",
    icon: <Dumbbell className="h-4 w-4 text-primary" />,
  },
];

export function QuestionTypeSelector({
  questionCounts,
  onCountChange,
  subjectName,
}: QuestionTypeSelectorProps) {
  // Determine allowed types for current subject
  const allowedTypes =
    SUBJECT_QUESTION_CONFIG[subjectName] || DEFAULT_QUESTION_TYPES;

  // Filter types to display and respect config order
  const filteredQuestionTypes = allowedTypes
    .map((type) => QUESTION_TYPES.find((qt) => qt.type === type))
    .filter((qt): qt is (typeof QUESTION_TYPES)[number] => !!qt);

  // Calculate total ONLY for visible types
  const visibleTotalQuestions = filteredQuestionTypes.reduce(
    (sum, qt) => sum + (questionCounts[qt.type] || 0),
    0
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Question Types</h3>
        {visibleTotalQuestions > 0 && (
          <span className="text-xs text-muted-foreground">
            Total: {visibleTotalQuestions} questions
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2">
        {filteredQuestionTypes.map(({ type, label, icon }) => (
          <QuestionTypeCard
            key={type}
            type={type}
            label={label}
            count={questionCounts[type] || 0}
            onCountChange={(count) => onCountChange(type, count)}
            icon={icon}
          />
        ))}
      </div>
    </div>
  );
}
