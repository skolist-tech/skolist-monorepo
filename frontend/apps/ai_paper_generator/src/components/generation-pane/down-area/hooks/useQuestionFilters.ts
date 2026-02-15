import { useState, useMemo } from "react";
import type { GeneratedQuestionWithConcepts } from "../../../../services/questionService";

interface UseQuestionFiltersProps {
  questions: GeneratedQuestionWithConcepts[];
}

export function useQuestionFilters({ questions }: UseQuestionFiltersProps) {
  const [filterTypes, setFilterTypes] = useState<Set<string>>(new Set());
  const [filterDifficulties, setFilterDifficulties] = useState<Set<string>>(
    new Set()
  );

  // Get unique question types from ALL questions (not just visible ones potentially)
  const uniqueTypes = useMemo(
    () => Array.from(new Set(questions.map((q) => q.question_type))),
    [questions]
  );

  const visibleQuestions = useMemo(() => {
    return questions.filter((q) => {
      if (q.is_in_draft) return false;

      // WITHIN filter type -> OR operations
      const typeMatch =
        filterTypes.size === 0 || filterTypes.has(q.question_type);

      // WITHIN filter type -> OR operations
      const diffMatch =
        filterDifficulties.size === 0 ||
        filterDifficulties.has(q.hardness_level);

      // ACROSS filter type -> AND operations
      return typeMatch && diffMatch;
    });
  }, [questions, filterTypes, filterDifficulties]);

  const toggleFilterType = (type: string) => {
    setFilterTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  const toggleFilterDifficulty = (diff: string) => {
    setFilterDifficulties((prev) => {
      const next = new Set(prev);
      if (next.has(diff)) {
        next.delete(diff);
      } else {
        next.add(diff);
      }
      return next;
    });
  };

  const clearFilters = () => {
    setFilterTypes(new Set());
    setFilterDifficulties(new Set());
  };

  return {
    filterTypes,
    filterDifficulties,
    visibleQuestions,
    uniqueTypes,
    toggleFilterType,
    toggleFilterDifficulty,
    clearFilters,
    setFilterTypes, // Exposed in case needed for direct manipulation, though clearFilters covers most
    setFilterDifficulties,
  };
}
