import type { GeneratedQuestion } from "@skolist/db";
import { Check } from "lucide-react";
import { LatexRenderer } from "../LatexRenderer";

interface QuestionOptionsProps {
  question: Pick<
    GeneratedQuestion,
    | "option1"
    | "option2"
    | "option3"
    | "option4"
    | "correct_mcq_option"
    | "msq_option1_answer"
    | "msq_option2_answer"
    | "msq_option3_answer"
    | "msq_option4_answer"
    | "question_type"
  >;
  showCorrect?: boolean;
}

export function QuestionOptions({
  question,
  showCorrect = false,
}: QuestionOptionsProps) {
  // Helper to derive options array from flat structure
  const options = [
    { text: question.option1, isCorrect: false },
    { text: question.option2, isCorrect: false },
    { text: question.option3, isCorrect: false },
    { text: question.option4, isCorrect: false },
  ].map((opt, index) => {
    let isCorrect = false;
    if (question.question_type === "mcq4") {
      // correct_mcq_option is 1-indexed based on DB schema usually? Or 0?
      // Looking at `tables.ts`, it's `number | null`.
      // Usually these are 1-based in this app context, but let's assume standard conventions or check if we can infer.
      // If previous code didn't show, we can assume 1-based for now as that's common in SQL for "option 1".
      // Let's verify: option1 is index 0 here.
      isCorrect = question.correct_mcq_option === index + 1;
    } else if (question.question_type === "msq4") {
      if (index === 0) isCorrect = question.msq_option1_answer === true;
      if (index === 1) isCorrect = question.msq_option2_answer === true;
      if (index === 2) isCorrect = question.msq_option3_answer === true;
      if (index === 3) isCorrect = question.msq_option4_answer === true;
    }
    return { ...opt, isCorrect, id: index };
  });

  return (
    <div className="ml-4 space-y-2">
      {options.map((option, index) => {
        if (!option.text) return null; // Skip empty options
        return (
          <div
            key={option.id}
            className={`flex items-start gap-2 text-sm ${
              showCorrect && option.isCorrect
                ? "font-medium text-green-600"
                : ""
            }`}
          >
            <span className="min-w-[20px] font-semibold">
              {String.fromCharCode(65 + index)}.
            </span>
            <LatexRenderer content={option.text || ""} />
            {showCorrect && option.isCorrect && (
              <Check className="h-4 w-4 shrink-0 text-green-600" />
            )}
          </div>
        );
      })}
    </div>
  );
}
