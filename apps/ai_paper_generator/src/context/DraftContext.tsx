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
  type QgenDraft,
  type QgenDraftSection,
} from "../services/draftService";
import { updateQuestion } from "../services/questionService";
import type { TablesUpdate } from "@skolist/db";

interface DraftContextValue {
  draft: QgenDraft | null;
  sections: QgenDraftSection[];
  isLoading: boolean;
  updateDraftSettings: (updates: TablesUpdate<"qgen_drafts">) => Promise<void>;
  addSection: (name?: string) => Promise<void>;
  editSection: (
    id: string,
    updates: TablesUpdate<"qgen_draft_sections">
  ) => Promise<void>;
  removeSection: (id: string) => Promise<void>;
  moveSection: (activeId: string, overId: string) => Promise<void>;
  moveQuestionToSection: (
    questionId: string,
    sectionId: string,
    index: number
  ) => Promise<void>;
}

const DraftContext = createContext<DraftContextValue | undefined>(undefined);

export function DraftProvider({ children }: { children: ReactNode }) {
  const { currentActivity } = useActivityContext();
  const { questions, updateQuestionLocal } = useQuestionsContext();
  const [draft, setDraft] = useState<QgenDraft | null>(null);
  const [sections, setSections] = useState<QgenDraftSection[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize Draft and Sections
  const initDraft = useCallback(async () => {
    if (!currentActivity?.id) return;

    try {
      setIsLoading(true);
      const draftData = await fetchOrCreateDraft(currentActivity.id);
      setDraft(draftData);

      const sectionsData = await fetchSections(draftData.id);

      // If no sections exist, create a default one
      if (sectionsData.length === 0) {
        const defaultSection = await createSection(
          draftData.id,
          0,
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

  const updateDraftSettings = useCallback(
    async (updates: TablesUpdate<"qgen_drafts">) => {
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
        const position = sections.length;
        console.log("Creating section at position:", position);
        const newSection = await createSection(draft.id, position, name);
        console.log("Section created:", newSection);
        setSections((prev) => [...prev, newSection]);
      } catch (err) {
        console.error("Failed to add section:", err);
      }
    },
    [draft, sections.length]
  );

  const editSection = useCallback(
    async (id: string, updates: TablesUpdate<"qgen_draft_sections">) => {
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
          position_in_draft: index,
        }));
        setSections(updatedSections);

        // Persist changes
        // We use a 2-phase update to avoid "duplicate key" unique constraint violations.
        // Phase 1: Move changed items to a temporary negative position.
        // Phase 2: Move items to their final position.
        const changedItems = updatedSections.filter(
          (s, index) =>
            s.id !== sections[index]?.id || s.position_in_draft !== index
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
    [sections]
  );

  const moveQuestionToSection = useCallback(
    async (questionId: string, sectionId: string, index: number) => {
      // Implement logic to update question's section_id and position
      try {
        await updateQuestion(questionId, {
          qgen_draft_section_id: sectionId,
          position_in_section: index,
        });

        // Optimistic update via QuestionsContext if possible
        const q = questions.find((q) => q.id === questionId);
        if (q) {
          updateQuestionLocal({
            ...q,
            qgen_draft_section_id: sectionId,
            position_in_section: index,
          });
        }
      } catch (err) {
        console.error("Failed to move question:", err);
      }
    },
    [questions, updateQuestionLocal]
  );

  const value: DraftContextValue = useMemo(
    () => ({
      draft,
      sections,
      isLoading,
      updateDraftSettings,
      addSection,
      editSection,
      removeSection,
      moveSection,
      moveQuestionToSection,
    }),
    [
      draft,
      sections,
      isLoading,
      updateDraftSettings,
      addSection,
      editSection,
      removeSection,
      moveSection,
      moveQuestionToSection,
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
