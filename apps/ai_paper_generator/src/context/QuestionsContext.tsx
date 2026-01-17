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

import type {
  QuestionType,
  GeneratedImage,
  GeneratedQuestion,
} from "@skolist/db";
import {
  fetchQuestions,
  updateQuestion,
  createQuestion,
  deleteQuestion,
  type GeneratedQuestionWithConcepts,
} from "../services/questionService";
export type { GeneratedQuestionWithConcepts };
import { getClient } from "../services/supabase";

interface QuestionsContextValue {
  questions: GeneratedQuestionWithConcepts[];
  isLoading: boolean;
  error: string | null;
  moveQuestionToDraft: (id: string) => Promise<void>;
  moveQuestionsToDraft: (ids: string[]) => Promise<void>;
  moveQuestionToGeneration: (id: string) => Promise<void>;
  updateQuestionLocal: (question: GeneratedQuestionWithConcepts) => void;
  saveQuestion: (question: GeneratedQuestionWithConcepts) => Promise<void>;
  deleteQuestion: (id: string) => Promise<void>;
  addCustomQuestion: (sectionId: string, type: QuestionType) => Promise<void>;
  refetchQuestions: () => Promise<void>;
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
              {
                ...(payload.new as GeneratedQuestion),
                concepts: [],
                images: [],
              },
            ]);
          } else if (payload.eventType === "UPDATE") {
            setQuestions((prev) =>
              prev.map((q) =>
                q.id === payload.new.id
                  ? {
                      ...(payload.new as GeneratedQuestion),
                      concepts: q.concepts,
                      images: q.images,
                    }
                  : q
              )
            );
          } else if (payload.eventType === "DELETE") {
            setQuestions((prev) => prev.filter((q) => q.id !== payload.old.id));
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "gen_images",
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newImage = payload.new as GeneratedImage;
            if (!newImage.gen_question_id) return;
            // Only add if it has svg_string or img_url
            if (!newImage.svg_string && !newImage.img_url) return;

            setQuestions((prev) =>
              prev.map((q) =>
                q.id === newImage.gen_question_id
                  ? {
                      ...q,
                      images: [...q.images, newImage].sort(
                        (a, b) => (a.position ?? 0) - (b.position ?? 0)
                      ),
                    }
                  : q
              )
            );
          } else if (payload.eventType === "UPDATE") {
            const updatedImage = payload.new as GeneratedImage;
            const oldImage = payload.old as GeneratedImage;

            setQuestions((prev) =>
              prev.map((q) => {
                // If this question had the old image, remove it
                if (
                  oldImage.gen_question_id &&
                  q.id === oldImage.gen_question_id
                ) {
                  const filteredImages = q.images.filter(
                    (img) => img.id !== updatedImage.id
                  );
                  // If the image moved to a different question, just remove it
                  if (
                    updatedImage.gen_question_id !== oldImage.gen_question_id
                  ) {
                    return { ...q, images: filteredImages };
                  }
                }

                // If this question should have the updated image
                if (
                  updatedImage.gen_question_id &&
                  q.id === updatedImage.gen_question_id
                ) {
                  // Check if image already exists in this question
                  const existingIndex = q.images.findIndex(
                    (img) => img.id === updatedImage.id
                  );

                  // Only include if it has svg_string or img_url
                  if (!updatedImage.svg_string && !updatedImage.img_url) {
                    // Remove if it no longer has valid content
                    return {
                      ...q,
                      images: q.images.filter(
                        (img) => img.id !== updatedImage.id
                      ),
                    };
                  }

                  let newImages: GeneratedImage[];
                  if (existingIndex >= 0) {
                    // Update existing image
                    newImages = q.images.map((img) =>
                      img.id === updatedImage.id ? updatedImage : img
                    );
                  } else {
                    // Add new image (moved from another question)
                    newImages = [...q.images, updatedImage];
                  }

                  return {
                    ...q,
                    images: newImages.sort(
                      (a, b) => (a.position ?? 0) - (b.position ?? 0)
                    ),
                  };
                }

                return q;
              })
            );
          } else if (payload.eventType === "DELETE") {
            const deletedImage = payload.old as GeneratedImage;
            if (!deletedImage.gen_question_id) return;

            setQuestions((prev) =>
              prev.map((q) =>
                q.id === deletedImage.gen_question_id
                  ? {
                      ...q,
                      images: q.images.filter(
                        (img) => img.id !== deletedImage.id
                      ),
                    }
                  : q
              )
            );
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
        // Only set is_in_draft = true
        await updateQuestion(id, {
          is_in_draft: true,
        });

        // Optimistic update
        setQuestions((prev) =>
          prev.map((q) =>
            q.id === id
              ? {
                  ...q,
                  is_in_draft: true,
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

  const moveQuestionsToDraft = useCallback(
    async (ids: string[]) => {
      if (!currentActivity?.id || ids.length === 0) return;

      try {
        // Update All Questions
        const updates = ids.map((id) => {
          return {
            id,
            is_in_draft: true,
          };
        });

        // Parallel update requests
        await Promise.all(
          updates.map((update) => updateQuestion(update.id, update))
        );

        // Optimistic update
        setQuestions((prev) =>
          prev.map((q) => {
            const update = updates.find((u) => u.id === q.id);
            if (update) {
              return {
                ...q,
                is_in_draft: true,
              };
            }
            return q;
          })
        );
      } catch (err) {
        console.error("Failed to bulk move to draft:", err);
        throw err;
      }
    },
    [currentActivity?.id]
  );

  const moveQuestionToGeneration = useCallback(async (id: string) => {
    try {
      // Optimistic Update
      setQuestions((prev) =>
        prev.map((q) => {
          if (q.id === id) {
            return {
              ...q,
              is_in_draft: false,
              position_in_draft: null,
              qgen_draft_section_id: null,
            } as unknown as GeneratedQuestionWithConcepts;
          }
          return q;
        })
      );

      // Only update is_in_draft = false
      await updateQuestion(id, {
        is_in_draft: false,
      });
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
          concepts: _concepts,
          images: _images,
          ...updates
        } = question; // Exclude system fields and join fields from update payload.
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
          answer_text: "New Answer",
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
    moveQuestionsToDraft,
    moveQuestionToGeneration,
    updateQuestionLocal,
    saveQuestion,
    deleteQuestion: handleDeleteQuestion,
    addCustomQuestion,
    refetchQuestions: loadQuestions,
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
