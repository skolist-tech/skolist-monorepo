import type { Database } from "./database.types";

type Tables = Database["public"]["Tables"];

// User, Organisation and Cross Platform  Tables (Not Just Limited To A Single Product)
export type User = Tables["users"]["Row"];
export type InsertUser = Tables["users"]["Insert"];
export type UpdateUser = Tables["users"]["Update"];

export type Organisation = Tables["orgs"]["Row"];
export type InsertOrganisation = Tables["orgs"]["Insert"];
export type UpdateOrganisation = Tables["orgs"]["Update"];

export type Activity = Tables["activities"]["Row"];
export type InsertActivity = Tables["activities"]["Insert"];
export type UpdateActivity = Tables["activities"]["Update"];
export type ProductType = Database["public"]["Enums"]["product_type_enum"];

// Knowledge Base Related Tables (Knowledge Base is also cross platform)
export type Board = Tables["boards"]["Row"];
export type InsertBoard = Tables["boards"]["Insert"];
export type UpdateBoard = Tables["boards"]["Update"];

export type SchoolClass = Tables["school_classes"]["Row"];
export type InsertSchoolClass = Tables["school_classes"]["Insert"];
export type UpdateSchoolClass = Tables["school_classes"]["Update"];

export type Subject = Tables["subjects"]["Row"];
export type InsertSubject = Tables["subjects"]["Insert"];
export type UpdateSubject = Tables["subjects"]["Update"];

export type Chapter = Tables["chapters"]["Row"];
export type InsertChapter = Tables["chapters"]["Insert"];
export type UpdateChapter = Tables["chapters"]["Update"];

export type Topic = Tables["topics"]["Row"];
export type InsertTopic = Tables["topics"]["Insert"];
export type UpdateTopic = Tables["topics"]["Update"];

export type Concept = Tables["concepts"]["Row"];
export type InsertConcept = Tables["concepts"]["Insert"];
export type UpdateConcept = Tables["concepts"]["Update"];

// AI Paper Generator (qgen) Product Related Tables
export type GeneratedQuestion = Tables["gen_questions"]["Row"];
export type InsertGeneratedQuestion = Tables["gen_questions"]["Insert"];
export type UpdateGeneratedQuestion = Tables["gen_questions"]["Update"];
export type QuestionType = Database["public"]["Enums"]["question_type_enum"];
export type HardnessLevel = Database["public"]["Enums"]["hardness_level_enum"];

export type GeneratedImage = Tables["gen_images"]["Row"]; // Image is associated with a Generated Questions in the AI Paper Generator Product
export type InsertGeneratedImage = Tables["gen_images"]["Insert"];
export type UpdateGeneratedImage = Tables["gen_images"]["Update"];

// Constants for runtime usage - TypeScript will error if these don't match the database enum
export const QUESTION_TYPE = {
  MCQ4: "mcq4",
  MSQ4: "msq4",
  SHORT_ANSWER: "short_answer",
  TRUE_OR_FALSE: "true_or_false",
  FILL_IN_THE_BLANKS: "fill_in_the_blanks",
  LONG_ANSWER: "long_answer",
} as const satisfies Record<string, QuestionType>;

export const HARDNESS_LEVEL = {
  EASY: "easy",
  MEDIUM: "medium",
  HARD: "hard",
} as const satisfies Record<string, HardnessLevel>;


export type GeneratedPDF = Tables["gen_artifacts"]["Row"]; // PDFs generated in the AI Paper Generator Product
export type InsertGeneratedPDF = Tables["gen_artifacts"]["Insert"];
export type UpdateGeneratedPDF = Tables["gen_artifacts"]["Update"];

export type GeneratedQuestionAndConcept =
  Tables["gen_questions_concepts_maps"]["Row"]; // One Concept is mapped to One Generated Question in each row, though same concept can map to multiple generated questions and same generated question can map to multiple concepts through this table
export type InsertGeneratedQuestionAndConcept =
  Tables["gen_questions_concepts_maps"]["Insert"];
export type UpdateGeneratedQuestionAndConcept =
  Tables["gen_questions_concepts_maps"]["Update"];

export type QgenDraftInstructionAndQgenDraft =
  Tables["qgen_draft_instructions_drafts_maps"]["Row"]; // One instruction is mapped to One User in this table. Though, each user can have multiple instructions mapped to them. But no instruction can have multiple users mapped.
export type InsertQgenDraftInstructionAndQgenDraft =
  Tables["qgen_draft_instructions_drafts_maps"]["Insert"];
export type UpdateQgenDraftInstructionAndQgenDraft =
  Tables["qgen_draft_instructions_drafts_maps"]["Update"];

export type QgenDraftSection = Tables["qgen_draft_sections"]["Row"];
export type InsertQgenDraftSection = Tables["qgen_draft_sections"]["Insert"];
export type UpdateQgenDraftSection = Tables["qgen_draft_sections"]["Update"];

export type QgenDraft = Tables["qgen_drafts"]["Row"];
export type InsertQgenDraft = Tables["qgen_drafts"]["Insert"];
export type UpdateQgenDraft = Tables["qgen_drafts"]["Update"];

export type QgenGenerationPaneStatus = Tables["qgen_generation_panes"]["Row"]
export type InsertQgenGenerationPaneStatus = Tables["qgen_generation_panes"]["Insert"]
export type UpdateQgenGenerationPaneStatus = Tables["qgen_generation_panes"]["Update"]

export type ConceptAndActivity = Tables["concepts_activities_maps"]["Row"];
export type InsertConceptAndActivity = Tables["concepts_activities_maps"]["Insert"];
export type UpdateConceptAndActivity = Tables["concepts_activities_maps"]["Update"];
