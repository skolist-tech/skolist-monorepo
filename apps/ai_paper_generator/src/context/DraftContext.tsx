/**
 * Draft Context
 * Manages paper structure, sections, and draft settings
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { arrayMove } from "@dnd-kit/sortable";
import { useActivityContext } from "./ActivityContext";
import { useQuestionsContext } from "./QuestionsContext";
import {
  fetchOrCreateDraft,
  fetchSections,
  createSection,
  updateSection,
  deleteSection,
  updateDraft,
  fetchDraftInstructions,
  createDraftInstruction,
  updateDraftInstruction,
  deleteDraftInstruction,
  type QgenInstruction,
} from "../services/draftService";
import {
  updateQuestion,
  // upsertQuestions,
  updateQuestionPosition,
  type GeneratedQuestionWithConcepts,
} from "../services/questionService";
import type {
  QgenDraft,
  UpdateQgenDraft,
  QgenDraftSection,
  UpdateQgenDraftSection,
  // UpdateGeneratedQuestion,
} from "@skolist/db";

interface DraftContextValue {
  draft: QgenDraft | null;
  sections: QgenDraftSection[];
  instructions: QgenInstruction[];
  isLoading: boolean;
  updateDraftSettings: (updates: UpdateQgenDraft) => Promise<void>;
  addSection: (name?: string) => Promise<QgenDraftSection | undefined>;
  editSection: (id: string, updates: UpdateQgenDraftSection) => Promise<void>;
  removeSection: (id: string) => Promise<void>;
  moveSection: (activeId: string, overId: string) => Promise<void>;
  moveQuestionToSection: (
    questionId: string,
    sectionId: string,
    index: number
  ) => Promise<void>;

  // Instructions
  addInstruction: (text: string) => Promise<void>;
  editInstruction: (id: string, text: string) => Promise<void>;
  removeInstruction: (id: string) => Promise<void>;
  logoVersion: number;
  refreshLogo: () => void;
}

const DraftContext = createContext<DraftContextValue | undefined>(undefined);

export function DraftProvider({ children }: { children: ReactNode }) {
  const { currentActivity } = useActivityContext();
  const { questions, updateQuestionLocal } = useQuestionsContext();
  const [draft, setDraft] = useState<QgenDraft | null>(null);
  const [sections, setSections] = useState<QgenDraftSection[]>([]);
  const [instructions, setInstructions] = useState<QgenInstruction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [logoVersion, setLogoVersion] = useState(0);

  // Initialize Draft and Sections
  const initDraft = useCallback(async () => {
    if (!currentActivity?.id) return;

    try {
      setIsLoading(true);
      const draftData = await fetchOrCreateDraft(currentActivity.id);
      setDraft(draftData);

      // Parallel fetch
      const [sectionsData, instructionsData] = await Promise.all([
        fetchSections(draftData.id),
        fetchDraftInstructions(draftData.id),
      ]);

      setInstructions(instructionsData);

      // If no sections exist, create a default one
      if (sectionsData.length === 0) {
        const defaultSection = await createSection(
          draftData.id,
          1,
          "Section A"
        );
        setSections([defaultSection]);
      } else {
        setSections(sectionsData);
      }
    } catch (err) {
      console.error("Failed to init draft:", err);
    } finally {
      setIsLoading(false);
    }
  }, [currentActivity?.id]);

  useEffect(() => {
    initDraft();
  }, [initDraft]);

  const refreshLogo = useCallback(() => {
    setLogoVersion((v) => v + 1);
  }, []);

  const updateDraftSettings = useCallback(
    async (updates: UpdateQgenDraft) => {
      if (!draft) return;
      try {
        const updated = await updateDraft(draft.id, updates);
        setDraft(updated);
      } catch (err) {
        console.error("Failed to update draft settings:", err);
        // Revert optimism if needed
      }
    },
    [draft]
  );

  const addSection = useCallback(
    async (name: string = "New Section") => {
      console.log("Adding section...", { draftId: draft?.id });
      if (!draft) {
        console.warn("Cannot add section: No draft found");
        return;
      }
      try {
        const position = sections.length + 1;
        console.log("Creating section at position:", position);
        const newSection = await createSection(draft.id, position, name);
        console.log("Section created:", newSection);
        setSections((prev) => [...prev, newSection]);
        return newSection;
      } catch (err) {
        console.error("Failed to add section:", err);
        return undefined;
      }
    },
    [draft, sections.length]
  );

  const editSection = useCallback(
    async (id: string, updates: UpdateQgenDraftSection) => {
      try {
        // Optimistic update
        setSections((prev) =>
          prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
        );
        await updateSection(id, updates);
      } catch (err) {
        console.error("Failed to update section:", err);
        // Revert logic would go here
      }
    },
    []
  );

  const removeSection = useCallback(async (id: string) => {
    try {
      // Optimistic update
      setSections((prev) => prev.filter((s) => s.id !== id));
      await deleteSection(id);

      // Also update local questions state to reflect they are unassigned
      // Note: QuestionsContext subscription should handle this, but for immediate UI feel:
      // In deleteSection service we unassigned them.
    } catch (err) {
      console.error("Failed to delete section:", err);
    }
  }, []);

  const moveSection = useCallback(
    async (activeId: string, overId: string) => {
      const oldIndex = sections.findIndex((s) => s.id === activeId);
      const newIndex = sections.findIndex((s) => s.id === overId);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newSections = arrayMove(sections, oldIndex, newIndex);
        // Update positions locally
        const updatedSections = newSections.map((s, index) => ({
          ...s,
          position_in_draft: index + 1,
        }));
        setSections(updatedSections);

        // --- Question Re-indexing Logic ---
        const questionsBySection: Record<
          string,
          GeneratedQuestionWithConcepts[]
        > = {};

        // Group questions by section
        questions.forEach((q) => {
          if (q.is_in_draft && q.qgen_draft_section_id) {
            if (!questionsBySection[q.qgen_draft_section_id]) {
              questionsBySection[q.qgen_draft_section_id] = [];
            }
            questionsBySection[q.qgen_draft_section_id]!.push(q);
          }
        });

        // Loop through the NEW section order
        let globalCounter = 1;
        const questionUpdates: any[] = [];

        updatedSections.forEach((section) => {
          const sectionQuestions = questionsBySection[section.id] || [];
          // Sort by existing position to maintain intra-section order
          sectionQuestions.sort(
            (a, b) => (a.position_in_draft || 0) - (b.position_in_draft || 0)
          );

          sectionQuestions.forEach((q) => {
            if (q.position_in_draft !== globalCounter) {
              // Prepare update payload - exclude joined fields and local UI state
              const updatePayload = {
                id: q.id,
                position_in_draft: globalCounter,
              };

              questionUpdates.push(updatePayload);

              // Optimistic local update
              updateQuestionLocal({ ...q, position_in_draft: globalCounter });
            }
            globalCounter++;
          });
        });

        // Batch update questions if needed
        if (questionUpdates.length > 0) {
          try {
            await Promise.all(
              questionUpdates.map(async (q) => {
                await updateQuestionPosition(q.id, q.position_in_draft);
              })
            );
          } catch (e) {
            console.error("Failed to re-index questions:", e);
          }
        }

        // --- End Question Re-indexing ---

        // Persist changes
        // We use a 2-phase update to avoid "duplicate key" unique constraint violations.
        // Phase 1: Move changed items to a temporary negative position.
        // Phase 2: Move items to their final position.
        const changedItems = updatedSections.filter(
          (s, index) =>
            s.id !== sections[index]?.id || s.position_in_draft !== index + 1
        );

        try {
          // Phase 1: Temporary positions
          await Promise.all(
            changedItems.map((s, idx) =>
              updateSection(s.id, {
                position_in_draft: 10000 + idx,
              })
            )
          );

          // Phase 2: Final positions
          await Promise.all(
            changedItems.map((s) =>
              updateSection(s.id, { position_in_draft: s.position_in_draft })
            )
          );
        } catch (err) {
          console.error("Failed to reorder sections:", err);
          // Revert local state if needed (complex, maybe just reload)
        }
      }
    },
    [sections, questions, updateQuestionLocal]
  );

  const moveQuestionToSection = useCallback(
    async (questionId: string, sectionId: string, index: number) => {
      // Implement logic to update question's section_id and position
      try {
        await updateQuestion(questionId, {
          qgen_draft_section_id: sectionId,
          position_in_draft: index,
        });

        // Optimistic update via QuestionsContext if possible
        const q = questions.find((q) => q.id === questionId);
        if (q) {
          updateQuestionLocal({
            ...q,
            qgen_draft_section_id: sectionId,
            position_in_draft: index,
          });
        }
      } catch (err) {
        console.error("Failed to move question:", err);
      }
    },
    [questions, updateQuestionLocal]
  );

  // --- Instructions Logic ---

  const addInstruction = useCallback(
    async (text: string) => {
      if (!draft) return;
      try {
        const newInst = await createDraftInstruction(draft.id, text);
        setInstructions((prev) => [newInst, ...prev]);
      } catch (err) {
        console.error("Failed to add instruction:", err);
      }
    },
    [draft]
  );

  const editInstruction = useCallback(async (id: string, text: string) => {
    try {
      // Optimistic
      setInstructions((prev) =>
        prev.map((i) => (i.id === id ? { ...i, instruction_text: text } : i))
      );
      await updateDraftInstruction(id, text);
    } catch (err) {
      console.error("Failed to update instruction:", err);
      // revert logic...
    }
  }, []);

  const removeInstruction = useCallback(async (id: string) => {
    try {
      setInstructions((prev) => prev.filter((i) => i.id !== id));
      await deleteDraftInstruction(id);
    } catch (err) {
      console.error("Failed to delete instruction:", err);
    }
  }, []);

  const value: DraftContextValue = useMemo(
    () => ({
      draft,
      sections,
      instructions,
      isLoading,
      logoVersion,
      refreshLogo,
      updateDraftSettings,
      addSection,
      editSection,
      removeSection,
      moveSection,
      moveQuestionToSection,
      addInstruction,
      editInstruction,
      removeInstruction,
    }),
    [
      draft,
      sections,
      instructions,
      isLoading,
      logoVersion,
      refreshLogo,
      updateDraftSettings,
      addSection,
      editSection,
      removeSection,
      moveSection,
      moveQuestionToSection,
      addInstruction,
      editInstruction,
      removeInstruction,
    ]
  );

  return (
    <DraftContext.Provider value={value}>{children}</DraftContext.Provider>
  );
}

export function useDraftContext() {
  const context = useContext(DraftContext);
  if (context === undefined) {
    throw new Error("useDraftContext must be used within a DraftProvider");
  }
  return context;
}
