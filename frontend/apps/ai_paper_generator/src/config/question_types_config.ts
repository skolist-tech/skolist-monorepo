import type { QuestionType, HardnessLevel } from "@skolist/db";

// Extended question type including frontend-only types
export type ExtendedQuestionType =
  | QuestionType
  | "solved_examples"
  | "exercise_questions";

// Difficulty level distribution (percentages should add up to 100)
export type DifficultyDistribution = Record<HardnessLevel, number>;

// Default difficulty level distribution (in percentages)
export const DEFAULT_DIFFICULTY_LEVELS: DifficultyDistribution = {
  easy: 50,
  medium: 30,
  hard: 20,
};

// Default counts for all question types
export const DEFAULT_QUESTION_COUNTS: Partial<
  Record<ExtendedQuestionType, number>
> = {
  mcq4: 2,
  match_the_following: 2,
  // msq4: 0,
  short_answer: 2,
  long_answer: 2,
  true_or_false: 2,
  fill_in_the_blanks: 2,
  // numerical_answer: 2,
  // integer_answer: 2,
  // solved_examples: 2,
  // exercise_questions: 2,
};

// Configuration mapping normalized subject names to specific question counts
// Keys in the inner object determine both the ALLOWED types and their DEFAULT counts
export const SUBJECT_QUESTION_CONFIG: Record<
  string,
  Partial<Record<ExtendedQuestionType, number>>
> = {
  // Example configuration
  "maths - corodova": {
    mcq4: 4,
    match_the_following: 2,
    true_or_false: 2,
    fill_in_the_blanks: 2,
    short_answer: 2,
    long_answer: 2,
    solved_examples: 2,
    exercise_questions: 2,
  },

  "maths - rbse": {
    mcq4: 4,
    match_the_following: 2,
    true_or_false: 2,
    fill_in_the_blanks: 2,
    short_answer: 2,
    long_answer: 2,
    solved_examples: 2,
    exercise_questions: 2,
  },

  "physics - jee": {
    mcq4: 2,
    msq4: 2,
    match_the_following: 2,
    long_answer: 2,
    numerical_answer: 2,
    integer_answer: 2,
  },
};

// Configuration mapping normalized subject names to difficulty level distributions
// If a subject is not listed here, DEFAULT_DIFFICULTY_LEVELS will be used
export const SUBJECT_DIFFICULTY_CONFIG: Record<string, DifficultyDistribution> =
  {
    // Example: More emphasis on hard questions for JEE preparation
    "physics - jee": {
      easy: 20,
      medium: 30,
      hard: 50,
    },
  };
