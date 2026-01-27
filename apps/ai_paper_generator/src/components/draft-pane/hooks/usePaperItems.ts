import { useMemo } from "react";
import type {
  QgenDraft,
  QgenDraftSection,
  QgenDraftInstructionAndQgenDraft,
} from "@skolist/db";
import type { GeneratedQuestionWithConcepts } from "../../../services/questionService";
import type { QuestionItemData } from "../types";

export interface HeaderItem {
  id: string;
  type: "header";
  data: QgenDraft;
  isPageBreakBelow?: boolean;
}

export interface InstructionsItem {
  id: string;
  type: "instructions";
  data: QgenDraftInstructionAndQgenDraft[];
  isPageBreakBelow?: boolean;
}

export interface SectionItem {
  id: string;
  type: "section";
  data: QgenDraftSection;
  isPageBreakBelow?: boolean;
  totalMarks?: number;
}

export interface QuestionPaperItem {
  id: string;
  type: "question";
  data: QuestionItemData;
  isPageBreakBelow?: boolean;
}

export interface AnswerPaperItem {
  id: string;
  type: "answer";
  data: QuestionItemData;
  isPageBreakBelow?: boolean;
}

export type PaperItem =
  | HeaderItem
  | InstructionsItem
  | SectionItem
  | QuestionPaperItem
  | AnswerPaperItem;

interface UsePaperItemsProps {
  draft: QgenDraft | null | undefined;
  sections: QgenDraftSection[];
  questions: GeneratedQuestionWithConcepts[];
  instructions: QgenDraftInstructionAndQgenDraft[];
  previewMode: "paper" | "answer";
}

export function usePaperItems({
  draft,
  sections,
  questions,
  instructions,
  previewMode,
}: UsePaperItemsProps) {
  const items: PaperItem[] = useMemo(() => {
    if (!draft) return [];

    const result: PaperItem[] = [];

    // Header
    result.push({
      id: "header",
      type: "header",
      data: draft,
    });

    // Instructions - Only for Paper mode
    if (previewMode === "paper" && instructions.length > 0) {
      result.push({
        id: "instructions",
        type: "instructions",
        data: instructions,
      });
    }

    // Sections and Questions
    let globalQIndex = 0;
    sections.forEach((section: QgenDraftSection) => {
      // Questions in Section
      const sectionQuestions = questions
        .filter(
          (q: GeneratedQuestionWithConcepts) =>
            q.is_in_draft && q.qgen_draft_section_id === section.id
        )
        .sort(
          (
            a: GeneratedQuestionWithConcepts,
            b: GeneratedQuestionWithConcepts
          ) => (a.position_in_draft || 0) - (b.position_in_draft || 0)
        );

      const totalMarks = sectionQuestions.reduce(
        (sum: number, q: GeneratedQuestionWithConcepts) =>
          sum + Number(q.marks || 0),
        0
      );

      // Section Header
      result.push({
        id: `section-${section.id}`,
        type: "section",
        data: section,
        totalMarks: totalMarks,
      });

      // Questions by Section
      sectionQuestions.forEach((q) => {
        result.push({
          id: `${previewMode}-${q.id}`, // Distinct IDs to force re-measure on mode switch
          type: previewMode === "paper" ? "question" : "answer",
          data: { ...q, displayIndex: globalQIndex },
          isPageBreakBelow: q.is_page_break_below,
        });
        globalQIndex++;
      });
    });

    return result;
  }, [draft, sections, questions, instructions, previewMode]);

  return items;
}
