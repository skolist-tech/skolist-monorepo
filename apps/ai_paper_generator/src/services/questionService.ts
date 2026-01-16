/**
 * Question Service
 * Handles Supabase operations for generated questions
 */

import { getClient } from "./supabase";
import type {
  GeneratedQuestion,
  GeneratedImage,
  InsertGeneratedQuestion,
  UpdateGeneratedQuestion,
} from "@skolist/db";


export async function createQuestion(
  question: InsertGeneratedQuestion
): Promise<GeneratedQuestion> {
  const client = getClient();

  const { data, error } = await client
    .from("gen_questions")
    .insert(question)
    .select()
    .single();

  if (error) {
    console.error("Failed to create question:", error);
    throw error;
  }

  return data;
}

export type GeneratedQuestionWithConcepts = GeneratedQuestion & {
  concepts: { id: string; name: string }[];
  images: GeneratedImage[];
};

// Define the raw response type from Supabase join
type QuestionWithConceptsResponse = GeneratedQuestion & {
  gen_questions_concepts_maps: {
    concepts: {
      id: string;
      name: string;
    } | null;
  }[];
  gen_images: GeneratedImage[];
};

/**
 * Fetch all questions for a specific activity
 */
export async function fetchQuestions(
  activityId: string
): Promise<GeneratedQuestionWithConcepts[]> {
  const client = getClient();

  // We order by created_at for now, as requested to be sequential as fetched
  const { data, error } = await client
    .from("gen_questions")
    .select(
      `
      *,
      gen_questions_concepts_maps (
        concepts (
          id,
          name
        )
      ),
      gen_images (
        id,
        gen_question_id,
        svg_string,
        img_url,
        position,
        created_at
      )
    `
    )
    .eq("activity_id", activityId)
    .order("created_at", { ascending: true })
    .returns<QuestionWithConceptsResponse[]>();

  if (error) {
    console.error("Failed to fetch questions:", error);
    throw error;
  }

  // Transform the data to a cleaner structure
  return (data ?? []).map((q) => ({
    ...q,
    concepts:
      q.gen_questions_concepts_maps
        ?.map((map) => map.concepts)
        .filter(
          (c): c is { id: string; name: string } =>
            c !== null && c !== undefined
        ) || [],
    // Sort images by position, filter out those without svg_string or img_url
    images: (q.gen_images || [])
      .filter((img) => img.svg_string || img.img_url)
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
    gen_questions_concepts_maps: undefined, // Remove the raw mapping data from the result object if desired, or keep it.
    gen_images: undefined, // Remove the raw gen_images from result
    // The Type specifies GeneratedQuestionWithConcepts which adds concepts array.
    // We destructured q so it has all properties of GeneratedQuestion.
  }));
}

/**
 * Update a question
 */
export async function updateQuestion(
  questionId: string,
  updates: UpdateGeneratedQuestion
): Promise<GeneratedQuestion> {
  const client = getClient();

  const { data, error } = await client
    .from("gen_questions")
    .update(updates)
    .eq("id", questionId)
    .select()
    .single();

  if (error) {
    console.error("Failed to update question:", error);
    throw error;
  }

  return data;
}

/**
 * Delete a question
 */
export async function deleteQuestion(questionId: string): Promise<void> {
  const client = getClient();

  const { error } = await client
    .from("gen_questions")
    .delete()
    .eq("id", questionId);

  if (error) {
    console.error("Failed to delete question:", error);
    throw error;
  }
}

/**
 * Bulk upsert questions (for reordering)
 */
export async function upsertQuestions(
  questions: InsertGeneratedQuestion[]
): Promise<void> {
  const client = getClient();

  const { error } = await client
    .from("gen_questions")
    .upsert(questions, { onConflict: "id" });

  if (error) {
    console.error("Failed to upsert questions:", error);
    throw error;
  }
}
