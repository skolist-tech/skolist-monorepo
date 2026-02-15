import type { GeneratedQuestionWithConcepts } from "../services/questionService";
import type { QgenDraftSection } from "@skolist/db";

export interface QuestionPositionUpdate {
  id: string;
  position_in_draft: number;
  qgen_draft_section_id: string;
}

/**
 * Calculates updates for question positions after a drag operation.
 * Keeps questions in a single global sequence 1..N across all sections.
 */
export const calculateDragUpdates = (
  activeId: string,
  overId: string,
  activeSectionId: string,
  overSectionId: string,
  allQuestions: GeneratedQuestionWithConcepts[],
  sections: QgenDraftSection[]
): QuestionPositionUpdate[] => {
  // Sort sections to establish global order
  const sortedSections = [...sections].sort(
    (a, b) => (a.position_in_draft || 0) - (b.position_in_draft || 0)
  );

  // Group questions by section
  const questionsBySection: Record<string, GeneratedQuestionWithConcepts[]> =
    {};

  // Sort questions globally first to ensure correct initial state
  const sortedQuestions = [...allQuestions].sort(
    (a, b) => (a.position_in_draft || 0) - (b.position_in_draft || 0)
  );

  sortedQuestions.forEach((q) => {
    if (q.is_in_draft && q.qgen_draft_section_id) {
      if (!questionsBySection[q.qgen_draft_section_id]) {
        questionsBySection[q.qgen_draft_section_id] = [];
      }
      questionsBySection[q.qgen_draft_section_id]!.push(q);
    }
  });

  // Perform the move in memory
  // 1. Remove active item
  const activeQuestion = allQuestions.find((q) => q.id === activeId);
  if (!activeQuestion) return [];

  // Remove from source section
  if (questionsBySection[activeSectionId]) {
    questionsBySection[activeSectionId] = questionsBySection[
      activeSectionId
    ]!.filter((q) => q.id !== activeId);
  }

  // 2. Insert into target section
  if (activeSectionId === overSectionId) {
    // Intra-section move
    // We need to find the index of overId in the section
    const sectionQs = questionsBySection[overSectionId] || [];
    const overIndex = sectionQs.findIndex((q) => q.id === overId);

    // If dragged over itself (shouldn't happen here usually), or overId not found
    // If overId is the section itself (empty section drop?), handle that
    // Assumption: overId is a question ID. If it's a section ID, we append to end of that section?
    // dnd-kit strategy: if over is a container, append. if over is item, insert relative.

    // Let's assume passed IDs are always item IDs here for simplicity,
    // but caller might pass section ID if dropped on an empty section.
    const isOverSection = sortedSections.some((s) => s.id === overId);

    if (isOverSection) {
      // Dropped on section header/container -> append to end
      questionsBySection[overId] = questionsBySection[overId] || [];
      questionsBySection[overId]!.push(activeQuestion);
    } else {
      // Dropped on a question
      if (overIndex !== -1) {
        // We need to know direction to decide before/after?
        // Typically dnd-kit sortable "over" implies swapping or inserting at that position.
        // arrayMove logic: remove, then insert at new index.
        // But we already removed. So we just insert at overIndex.
        // However, strictly speaking, we need access to original index to know if we moved up or down relative to target?
        // Actually, if we use Sortable logic, we can just insert at the index of `overId`.
        sectionQs.splice(overIndex, 0, activeQuestion);
      } else {
        // Fallback
        sectionQs.push(activeQuestion);
      }
    }
  } else {
    // Inter-section move
    if (!questionsBySection[overSectionId])
      questionsBySection[overSectionId] = [];
    const targetList = questionsBySection[overSectionId]!;

    const isOverSection = sortedSections.some((s) => s.id === overId);
    if (isOverSection) {
      targetList.push(activeQuestion);
    } else {
      const overIndex = targetList.findIndex((q) => q.id === overId);
      if (overIndex !== -1) {
        targetList.splice(overIndex, 0, activeQuestion);
      } else {
        targetList.push(activeQuestion);
      }
    }
    // Update active question's section ID ref for the next step
    activeQuestion.qgen_draft_section_id = overSectionId;
  }

  // 3. Re-calculate global positions
  const updates: QuestionPositionUpdate[] = [];
  let globalPos = 1;

  sortedSections.forEach((s) => {
    const qs = questionsBySection[s.id] || [];
    qs.forEach((q) => {
      // If position changed OR section changed (for the moved item)
      if (q.position_in_draft !== globalPos || q.id === activeId) {
        updates.push({
          id: q.id,
          position_in_draft: globalPos,
          qgen_draft_section_id: s.id,
        });
      }
      globalPos++;
    });
  });

  return updates;
};
