/**
 * Questions Context
 * Manages generated questions state and real-time validation
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useActivityContext } from "./ActivityContext";

import { type QuestionType } from "@skolist/db";
import {
  fetchQuestions,
  updateQuestion,
  createQuestion,
  deleteQuestion,
  type GeneratedQuestion,
  type GeneratedQuestionWithConcepts,
} from "../services/questionService";
import { getClient } from "../services/supabase";
import {
  fetchOrCreateDraft,
  fetchSections,
  createSection,
} from "../services/draftService";

interface QuestionsContextValue {
  questions: GeneratedQuestionWithConcepts[];
  isLoading: boolean;
  error: string | null;
  moveQuestionToDraft: (id: string) => Promise<void>;
  moveQuestionToGeneration: (id: string) => Promise<void>;
  updateQuestionLocal: (question: GeneratedQuestionWithConcepts) => void;
  saveQuestion: (question: GeneratedQuestionWithConcepts) => Promise<void>;
  deleteQuestion: (id: string) => Promise<void>;
  addCustomQuestion: (sectionId: string, type: QuestionType) => Promise<void>;
}

const QuestionsContext = createContext<QuestionsContextValue | undefined>(
  undefined
);

export function QuestionsProvider({ children }: { children: ReactNode }) {
  const { currentActivity } = useActivityContext();
  const [questions, setQuestions] = useState<GeneratedQuestionWithConcepts[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadQuestions = useCallback(async () => {
    if (!currentActivity?.id) {
      setQuestions([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchQuestions(currentActivity.id);
      setQuestions(data);
    } catch (err) {
      console.error("Failed to load questions:", err);
      setError("Failed to load questions");
    } finally {
      setIsLoading(false);
    }
  }, [currentActivity?.id]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  // Real-time subscription
  useEffect(() => {
    if (!currentActivity?.id) return;

    const client = getClient();
    const channel = client
      .channel(`questions-${currentActivity.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "gen_questions",
          filter: `activity_id=eq.${currentActivity.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setQuestions((prev) => [
              ...prev,
              { ...(payload.new as GeneratedQuestion), concepts: [] },
            ]);
          } else if (payload.eventType === "UPDATE") {
            setQuestions((prev) =>
              prev.map((q) =>
                q.id === payload.new.id
                  ? {
                      ...(payload.new as GeneratedQuestion),
                      concepts: q.concepts,
                    }
                  : q
              )
            );
          } else if (payload.eventType === "DELETE") {
            setQuestions((prev) => prev.filter((q) => q.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [currentActivity?.id]);

  const moveQuestionToDraft = useCallback(
    async (id: string) => {
      if (!currentActivity?.id) return;

      try {
        // 1. Get or Create Draft
        const draft = await fetchOrCreateDraft(currentActivity.id);

        // 2. Get Sections
        const sections = await fetchSections(draft.id);

        let targetSectionId: string;

        // 3. Determine Target Section
        if (sections.length === 0) {
          // Create default section if none exist
          const newSection = await createSection(draft.id, 0, "Section A");
          targetSectionId = newSection.id;
        } else {
          // Add to the last section
          targetSectionId = sections[sections.length - 1]!.id;
        }

        // 4. Update Question
        // calculation position: count questions in that section?
        // For simplicity, we just push it. Position management can be refined later or handled by DB default/trigger if exists,
        // but usually we want to append.
        // Ideally we'd fetch questions in that section to get max position, but for now we'll just assign the section.

        await updateQuestion(id, {
          is_in_draft: true,
          qgen_draft_section_id: targetSectionId,
        });

        // Optimistic update
        setQuestions((prev) =>
          prev.map((q) =>
            q.id === id
              ? {
                  ...q,
                  is_in_draft: true,
                  qgen_draft_section_id: targetSectionId,
                }
              : q
          )
        );
      } catch (err) {
        console.error("Failed to move to draft:", err);
        throw err;
      }
    },
    [currentActivity?.id]
  );

  const moveQuestionToGeneration = useCallback(async (id: string) => {
    try {
      await updateQuestion(id, { is_in_draft: false });
    } catch (err) {
      console.error("Failed to move to generation:", err);
      throw err;
    }
  }, []);

  // Helper to optimistically update or fix local state if needed
  const updateQuestionLocal = useCallback(
    (question: GeneratedQuestionWithConcepts) => {
      setQuestions((prev) =>
        prev.map((q) => (q.id === question.id ? question : q))
      );
    },
    []
  );

  const saveQuestion = useCallback(
    async (question: GeneratedQuestionWithConcepts) => {
      try {
        // Strip out any UI-only fields if they exist, though GeneratedQuestion should be pure DB type.
        // We pass the whole object as updates.
        // Identify changed fields if we wanted to be efficient, but for now sending the whole row (minus non-updatable fields if any issue, but TablesUpdate allows most)
        // Actually TablesUpdate might complain if we pass `id` or `created_at` depending on schema, but usually they are ignored or allowed in Supabase update if matching.
        // Best practice: exclude ID from the update payload itself, but use it for the query.
        const {
          id: _id,
          created_at: _created_at,
          updated_at: _updated_at,
          ...updates
        } = question; // Exclude system fields from update payload if needed, though usually safe.
        // But `updates` in updateQuestion takes TablesUpdate<"gen_questions">.
        await updateQuestion(question.id, updates);

        // Local update will happen via Realtime subscription usually, but we can optimistically update too.
        updateQuestionLocal(question);
      } catch (err) {
        console.error("Failed to save question:", err);
        throw err;
      }
    },
    [updateQuestionLocal]
  );

  const addCustomQuestion = useCallback(
    async (sectionId: string, type: QuestionType) => {
      if (!currentActivity?.id) return;

      try {
        await createQuestion({
          activity_id: currentActivity.id,
          question_text: "New Question",
          question_type: type,
          marks: 1,
          hardness_level: "medium",
          is_in_draft: true,
          qgen_draft_section_id: sectionId,
          // Set defaults for specific types if needed
          option1: ["mcq4", "msq4"].includes(type) ? "" : null,
          option2: ["mcq4", "msq4"].includes(type) ? "" : null,
          option3: ["mcq4", "msq4"].includes(type) ? "" : null,
          option4: ["mcq4", "msq4"].includes(type) ? "" : null,
        });
        // State update will handle by Realtime subscription
      } catch (err) {
        console.error("Failed to add custom question:", err);
        throw err;
      }
    },
    [currentActivity?.id]
  );

  const handleDeleteQuestion = useCallback(async (id: string) => {
    try {
      await deleteQuestion(id);
      // State update will happen via Realtime subscription (DELETE event)
      // But we can also optimistically remove it to be snappy
      setQuestions((prev) => prev.filter((q) => q.id !== id));
    } catch (err) {
      console.error("Failed to delete question:", err);
      throw err;
    }
  }, []);

  const value: QuestionsContextValue = {
    questions,
    isLoading,
    error,
    moveQuestionToDraft,
    moveQuestionToGeneration,
    updateQuestionLocal,
    saveQuestion,
    deleteQuestion: handleDeleteQuestion,
    addCustomQuestion,
  };

  return (
    <QuestionsContext.Provider value={value}>
      {children}
    </QuestionsContext.Provider>
  );
}

export function useQuestionsContext() {
  const context = useContext(QuestionsContext);
  if (context === undefined) {
    throw new Error(
      "useQuestionsContext must be used within a QuestionsProvider"
    );
  }
  return context;
}
