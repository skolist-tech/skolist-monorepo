import type { QuestionType } from "@skolist/db";

// Extended question type including frontend-only types
export type ExtendedQuestionType =
  | QuestionType
  | "solved_examples"
  | "exercise_questions";

// Default fallback list of question types
export const DEFAULT_QUESTION_TYPES: ExtendedQuestionType[] = [
  "mcq4",
  "msq4",
  "short_answer",
  "long_answer",
  "true_or_false",
  "fill_in_the_blanks",
  "match_the_following",
  "solved_examples",
  "exercise_questions",
];

// Configuration mapping normalized subject names to allowed question types
// Keys should be lowercase and trimmed
export const SUBJECT_QUESTION_CONFIG: Record<string, ExtendedQuestionType[]> = {
  // Example configuration
  "maths - corodova": [
    "mcq4",
    "match_the_following",
    "short_answer",
    "long_answer",
    "solved_examples",
    "exercise_questions",
  ],
};
