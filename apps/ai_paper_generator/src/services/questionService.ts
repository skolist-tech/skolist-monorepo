/**
 * Question Service
 * Handles Supabase operations for generated questions
 */

import { getSupabaseClient } from "@skolist/auth";
import type {
  GeneratedQuestion,
  GeneratedImage,
  InsertGeneratedQuestion,
  UpdateGeneratedQuestion,
} from "@skolist/db";

export interface QuestionDraftRpcUpdate {
  id: string;
  position_in_draft: number;
  qgen_draft_section_id: string;
}

export async function createQuestion(
  question: InsertGeneratedQuestion
): Promise<GeneratedQuestion> {
  const client = getSupabaseClient();

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
  const client = getSupabaseClient();

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
 * Fetch a single question by ID
 */
export async function fetchQuestion(
  questionId: string
): Promise<GeneratedQuestionWithConcepts | null> {
  const client = getSupabaseClient();

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
    .eq("id", questionId)
    .single();

  if (error) {
    console.error("Failed to fetch question:", error);
    return null;
  }

  // Transform to cleaner structure
  const q = data as QuestionWithConceptsResponse;

  // Destructure to remove the raw mapping properties matching the type
  const {
    gen_questions_concepts_maps: _maps,
    gen_images: _imgs,
    ...cleanQ
  } = q;

  return {
    ...cleanQ,
    concepts:
      q.gen_questions_concepts_maps
        ?.map((map) => map.concepts)
        .filter(
          (c): c is { id: string; name: string } =>
            c !== null && c !== undefined
        ) || [],
    images: (q.gen_images || [])
      .filter((img) => img.svg_string || img.img_url)
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
  };
}

/**
 * Update a question
 */
export async function updateQuestion(
  questionId: string,
  updates: UpdateGeneratedQuestion
): Promise<GeneratedQuestion> {
  const client = getSupabaseClient();

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

export async function updateQuestionPosition(
  questionId: string,
  position_in_draft: number
): Promise<GeneratedQuestion> {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("gen_questions")
    .update({ position_in_draft })
    .eq("id", questionId)
    .select()
    .single();

  if (error) {
    console.error("Failed to update question position:", error);
    throw error;
  }

  return data;
}

/**
 * Bulk update multiple questions with the same updates (single query)
 */
export async function bulkUpdateQuestions(
  questionIds: string[],
  updates: UpdateGeneratedQuestion
): Promise<GeneratedQuestion[]> {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("gen_questions")
    .update(updates)
    .in("id", questionIds)
    .select();

  if (error) {
    console.error("Failed to bulk update questions:", error);
    throw error;
  }

  return data;
}

/**
 * Delete a question
 */
export async function deleteQuestion(questionId: string): Promise<void> {
  const client = getSupabaseClient();

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
  const client = getSupabaseClient();

  const { error } = await client
    .from("gen_questions")
    .upsert(questions, { onConflict: "id" });

  if (error) {
    console.error("Failed to upsert questions:", error);
    throw error;
  }
}

/**
 * Upload an image for a question
 */
export async function uploadQuestionImage(
  file: File,
  questionId: string
): Promise<{ success: boolean; imgUrl: string; filePath: string }> {
  // 1. Validate file type
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files are allowed");
  }

  const client = getSupabaseClient();
  const ext = file.name.split(".").pop();
  const filePath = `${questionId}/${crypto.randomUUID()}.${ext}`;

  // 2. Upload to Supabase Storage
  const { error: uploadError } = await client.storage
    .from("gen_images_bucket")
    .upload(filePath, file);

  if (uploadError) {
    console.error("Failed to upload image:", uploadError);
    throw uploadError;
  }

  // 3. Generate Signed URL (1 year expiry)
  const { data: signedData, error: urlError } = await client.storage
    .from("gen_images_bucket")
    .createSignedUrl(filePath, 60 * 60 * 24 * 365); // 1 year

  if (urlError || !signedData?.signedUrl) {
    console.error("Failed to generate signed URL:", urlError);
    throw urlError || new Error("Failed to generate signed URL");
  }

  const imgUrl = signedData.signedUrl;

  // 4. Insert Metadata Into Table gen_images
  const { error: insertError } = await client.from("gen_images").insert({
    gen_question_id: questionId,
    img_url: imgUrl,
    file_path: filePath,
  });

  if (insertError) {
    console.error("Failed to insert image metadata:", insertError);
    throw insertError;
  }

  return { success: true, imgUrl, filePath };
}

/**
 * Delete a question image
 */
export async function deleteQuestionImage(imageId: string): Promise<void> {
  const client = getSupabaseClient();

  const { error } = await client.from("gen_images").delete().eq("id", imageId);

  if (error) {
    console.error("Failed to delete question image:", error);
    throw error;
  }
}

/**
 * Update an image's SVG string
 */
export async function updateQuestionImageSvg(
  imageId: string,
  svgString: string
): Promise<void> {
  const client = getSupabaseClient();

  const { error } = await client
    .from("gen_images")
    .update({ svg_string: svgString })
    .eq("id", imageId);

  if (error) {
    console.error("Failed to update image SVG:", error);
    throw error;
  }
}

/**
 * Batch update questions for draft move
 */
export async function moveQuestionsToDraftBatch(
  updates: QuestionDraftRpcUpdate[]
): Promise<void> {
  const client = getSupabaseClient();

  const { error } = await client.rpc(
    "update_question_position_and_section_ids",
    {
      updates: updates, // Supabase RPC matches keys to arguments "updates"
    }
  );

  if (error) {
    console.error("Failed to batch move questions to draft:", error);
    throw error;
  }
}
