import { useState, useEffect } from "react";
import type { QuestionType } from "@skolist/db";
import {
  SUBJECT_QUESTION_CONFIG,
  DEFAULT_QUESTION_COUNTS,
} from "../config/question_types_config";
import type { ExtendedQuestionType } from "../config/question_types_config";

export function useQuestionCounts(
  subjectName: string,
  restoredCounts: Partial<Record<ExtendedQuestionType, number>> | null
) {
  const ZERO_COUNTS: Record<ExtendedQuestionType, number> = {
    mcq4: 0,
    msq4: 0,
    short_answer: 0,
    long_answer: 0,
    true_or_false: 0,
    fill_in_the_blanks: 0,
    match_the_following: 0,
    numerical_answer: 0,
    integer_answer: 0,
    solved_examples: 0,
    exercise_questions: 0,
  };

  const [questionCounts, setQuestionCounts] = useState<
    Record<ExtendedQuestionType, number>
  >({ ...ZERO_COUNTS, ...DEFAULT_QUESTION_COUNTS });

  const [totalQuestions, setTotalQuestions] = useState(0);

  useEffect(() => {
    // 1. Resolve Base Config
    // Algorithm:
    // - Check Subject Config. If exists, USE IT (and only it).
    // - Else, use Default Config.
    // - Base is ZERO_COUNTS + Chosen Config.

    const subjectConfig = SUBJECT_QUESTION_CONFIG[subjectName];

    // If subject config exists, we start with zeros and apply ONLY subject config.
    // Otherwise, we start with zeros and apply defaults.
    // This ensures defaults don't bleed into subject specific configs if not intended.
    let baseCounts = { ...ZERO_COUNTS };

    if (subjectConfig) {
      baseCounts = { ...baseCounts, ...subjectConfig };
    } else {
      baseCounts = { ...baseCounts, ...DEFAULT_QUESTION_COUNTS };
    }

    // 2. Apply Restoration / Database Overrides
    // If we have restored counts (from DB), they override EVERYTHING for non-null keys.
    if (restoredCounts) {
      (Object.keys(restoredCounts) as ExtendedQuestionType[]).forEach((key) => {
        const val = restoredCounts[key];
        if (val !== undefined && val !== null) {
          baseCounts[key] = val;
        }
      });
    }

    setQuestionCounts(baseCounts);

    // 3. Sync Total
    const newTotal = Object.values(baseCounts).reduce(
      (sum, val) => sum + val,
      0
    );
    setTotalQuestions(newTotal);
  }, [subjectName, restoredCounts]);

  const handleCountChange = (
    type: ExtendedQuestionType | QuestionType,
    count: number
  ) => {
    setQuestionCounts((prev) => {
      const newCounts = { ...prev, [type as ExtendedQuestionType]: count };
      const newTotal = Object.values(newCounts).reduce(
        (sum, val) => sum + val,
        0
      );
      setTotalQuestions(newTotal);
      return newCounts;
    });
  };

  return {
    questionCounts,
    setQuestionCounts, // Exposed if manual hard-set is needed (rare)
    handleCountChange,
    totalQuestions,
    setTotalQuestions, // Exposed if parent needs to override total directly (e.g. restoration of total field, though derived is better)
  };
}
