import type { GeneratedQuestionWithConcepts } from "../../services/questionService";

export interface QuestionItemData extends GeneratedQuestionWithConcepts {
  displayIndex: number;
}