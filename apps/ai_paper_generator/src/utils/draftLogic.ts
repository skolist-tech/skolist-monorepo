import { formatQuestionType } from "./formatters";
import type { GeneratedQuestionWithConcepts } from "../services/questionService";
import type { QgenDraftSection } from "@skolist/db";

// Helper to get section name
export const getSectionNameForType = (type: string) =>
  `Section - ${formatQuestionType(type)}`;

export interface QuestionDraftUpdate {
  id: string;
  position_in_draft: number;
  qgen_draft_section_id: string;
  is_in_draft: boolean;
  sections_created?: string[];
}

/**
 * Step 1: Resolve Sections
 * Returns a map of Type -> Section ID (existing)
 * And a list of names that need to be created.
 */
export const resolveSectionPlan = (
  questionsToMove: GeneratedQuestionWithConcepts[],
  existingSections: QgenDraftSection[]
) => {
  const typeToSectionId = new Map<string, string>();
  const missingSectionNames = new Set<string>();

  const uniqueTypes = Array.from(
    new Set(questionsToMove.map((q) => q.question_type))
  );

  uniqueTypes.forEach((type) => {
    const targetName = getSectionNameForType(type);
    const existing = existingSections.find(
      (s) => s.section_name === targetName
    );
    if (existing) {
      typeToSectionId.set(type, existing.id);
    } else {
      missingSectionNames.add(targetName);
    }
  });

  return {
    typeToSectionId,
    sectionsToCreate: Array.from(missingSectionNames),
  };
};

/**
 * Step 2: Calculate Positions
 * Assumes all sections exist now.
 */
export const calculatePositions = (
  questionsToMove: GeneratedQuestionWithConcepts[],
  allQuestions: GeneratedQuestionWithConcepts[],
  sections: QgenDraftSection[]
): QuestionDraftUpdate[] => {
  // Sort sections
  const sortedSections = [...sections].sort(
    (a, b) => (a.position_in_draft || 0) - (b.position_in_draft || 0)
  );

  // Prepare working list of all draft questions (excluding ones being moved currently)
  // We treat "questionsToMove" as new additions, even if they were already in draft (moving within draft)
  // For simplicity, we filter out "questionsToMove" from "currentDraftQuestions"
  const movingIds = new Set(questionsToMove.map((q) => q.id));

  let layoutQuestions = allQuestions
    .filter((q) => q.is_in_draft && !movingIds.has(q.id))
    .map((q) => ({ ...q })); // shallow copy

  // Sort questions to move? Let's keep input order, or sort by type -> text?
  // User didn't specify, input order is safest (user selection order)

  // To handle updates efficiently, we can:
  // 1. Group layoutQuestions by section
  // 2. Insert moving questions into appropriate groups
  // 3. Flatten and re-assign position_in_draft globally

  const sectionGroups = new Map<string, GeneratedQuestionWithConcepts[]>();
  sortedSections.forEach((s) => sectionGroups.set(s.id, []));

  // Distribute existing
  layoutQuestions.forEach((q) => {
    if (q.qgen_draft_section_id && sectionGroups.has(q.qgen_draft_section_id)) {
      sectionGroups.get(q.qgen_draft_section_id)?.push(q);
    } else {
      // Orphaned questions or undefined section? Use first or default?
      // Better to leave them be or put in first section?
      // For now, ignore or put in first if exists
      if (sortedSections.length > 0) {
        sectionGroups.get(sortedSections[0]!.id)?.push(q);
      }
    }
  });

  // Sort internal groups by current position
  sectionGroups.forEach((group) => {
    group.sort(
      (a, b) => (a.position_in_draft || 0) - (b.position_in_draft || 0)
    );
  });

  // Distribute new/moving questions
  questionsToMove.forEach((q) => {
    const targetName = getSectionNameForType(q.question_type);
    const targetSection = sortedSections.find(
      (s) => s.section_name === targetName
    );

    // Fallback: If specific section not found (shouldn't happen if Step 1 worked), try generic or first
    const sectionId = targetSection?.id || sortedSections[0]?.id;

    if (sectionId) {
      const group = sectionGroups.get(sectionId);
      if (group) {
        // Assign temp section ID for the object
        const newQ = { ...q, qgen_draft_section_id: sectionId };
        group.push(newQ);
        // We push to end of specific section as requested
      }
    }
  });

  // Re-calculate global positions
  let currentPos = 1;
  const changedQuestions: QuestionDraftUpdate[] = [];

  sortedSections.forEach((section) => {
    const group = sectionGroups.get(section.id) || [];
    group.forEach((q) => {
      // Check if position or section changed
      // Note: for questionsToMove, we force update
      // For others, check diff
      if (q.position_in_draft !== currentPos || movingIds.has(q.id)) {
        // Also check if section changed for existing questions (unlikely in this flow, but possible if fallback logic hit)
        if (
          !movingIds.has(q.id) &&
          q.position_in_draft === currentPos &&
          q.qgen_draft_section_id === section.id
        ) {
          // specific edge case: redundant?
        } else {
          changedQuestions.push({
            id: q.id,
            position_in_draft: currentPos,
            qgen_draft_section_id: section.id,
            is_in_draft: true,
          });
        }
      }
      currentPos++;
    });
  });

  return changedQuestions;
};
