/**
 * Version Service
 * Handles version management for gen_questions, enabling undo/redo functionality.
 */

import { getSupabaseClient } from "@skolist/auth";
import type { GeneratedQuestion, UpdateGeneratedQuestion } from "@skolist/db";

// ============================================================================
// CONFIGURABLE VERSION FIELDS
// These are the fields that get versioned. Keep in sync with backend.
// ============================================================================

export const VERSION_FIELDS = [
  "question_text",
  "answer_text",
  "explanation",
  "option1",
  "option2",
  "option3",
  "option4",
  "correct_mcq_option",
  "msq_option1_answer",
  "msq_option2_answer",
  "msq_option3_answer",
  "msq_option4_answer",
  "question_type",
  "hardness_level",
  "marks",
  "match_the_following_columns",
] as const;

export type VersionField = (typeof VERSION_FIELDS)[number];

export interface VersionState {
  canUndo: boolean;
  canRedo: boolean;
}

interface QuestionVersion {
  id: string;
  gen_question_id: string;
  version_index: number;
  is_active: boolean;
  is_deleted: boolean;
  // Versioned fields
  question_text: string | null;
  answer_text: string;
  explanation: string | null;
  option1: string | null;
  option2: string | null;
  option3: string | null;
  option4: string | null;
  correct_mcq_option: number | null;
  msq_option1_answer: boolean | null;
  msq_option2_answer: boolean | null;
  msq_option3_answer: boolean | null;
  msq_option4_answer: boolean | null;
  question_type: string;
  hardness_level: string;
  marks: number;
  match_the_following_columns: Record<string, string[]> | null;
}

/**
 * Extract only versioned fields from question data
 */
function extractVersionData(
  questionData: Partial<GeneratedQuestion>
): Partial<QuestionVersion> {
  const result: Record<string, unknown> = {};
  for (const key of VERSION_FIELDS) {
    if (key in questionData) {
      result[key] = questionData[key as keyof GeneratedQuestion];
    }
  }
  return result;
}

/**
 * Create initial version (v0) when a question is first created.
 */
export async function createInitialVersion(
  questionId: string,
  questionData: Partial<GeneratedQuestion>
): Promise<QuestionVersion | null> {
  const client = getSupabaseClient();

  const versionData = {
    ...extractVersionData(questionData),
    gen_question_id: questionId,
    version_index: 0,
    is_active: true,
    is_deleted: false,
  };

  const { data, error } = await client
    .from("gen_question_versions")
    .insert(versionData)
    .select()
    .single();

  if (error) {
    console.error("Failed to create initial version:", error);
    return null;
  }

  return data as QuestionVersion;
}

/**
 * Create a new version when a question is updated.
 *
 * This function:
 * 1. Fetches the current question to get all fields
 * 2. Merges with the update data
 * 3. Gets the current active version index
 * 4. Marks all versions with index > current as is_deleted=true
 * 5. Sets current active version to is_active=false
 * 6. Creates new version with index = max + 1, is_active=true
 */
export async function createNewVersionOnUpdate(
  questionId: string,
  newQuestionData: Partial<GeneratedQuestion>
): Promise<QuestionVersion | null> {
  const client = getSupabaseClient();

  try {
    // 0. Fetch the current question to get ALL fields (required for NOT NULL constraints)
    const { data: currentQuestion, error: fetchError } = await client
      .from("gen_questions")
      .select("*")
      .eq("id", questionId)
      .single();

    if (fetchError || !currentQuestion) {
      console.error("Question not found, cannot create version:", questionId);
      return null;
    }

    // Merge current question data with the updates (updates take precedence)
    const fullQuestionData = { ...currentQuestion, ...newQuestionData };

    // 1. Get current active version
    const { data: activeVersion, error: activeError } = await client
      .from("gen_question_versions")
      .select("id, version_index")
      .eq("gen_question_id", questionId)
      .eq("is_active", true)
      .eq("is_deleted", false)
      .single();

    if (activeError || !activeVersion) {
      // No active version - create initial version
      console.warn(
        "No active version found, creating initial version for:",
        questionId
      );
      return createInitialVersion(questionId, fullQuestionData);
    }

    const currentIndex = activeVersion.version_index;

    // 2. Mark all versions with index > current as deleted (invalidate redo history)
    await client
      .from("gen_question_versions")
      .update({ is_deleted: true })
      .eq("gen_question_id", questionId)
      .gt("version_index", currentIndex)
      .eq("is_deleted", false);

    // 3. Set current active to inactive
    await client
      .from("gen_question_versions")
      .update({ is_active: false })
      .eq("id", activeVersion.id);

    // 4. Get max version index
    const { data: maxData } = await client
      .from("gen_question_versions")
      .select("version_index")
      .eq("gen_question_id", questionId)
      .order("version_index", { ascending: false })
      .limit(1);

    const maxIndex = maxData?.[0]?.version_index ?? -1;
    const newIndex = maxIndex + 1;

    // 5. Create new version with FULL question data (merged)
    const versionData = {
      ...extractVersionData(fullQuestionData),
      gen_question_id: questionId,
      version_index: newIndex,
      is_active: true,
      is_deleted: false,
    };

    const { data, error } = await client
      .from("gen_question_versions")
      .insert(versionData)
      .select()
      .single();

    if (error) {
      console.error("Failed to create new version:", error);
      return null;
    }

    return data as QuestionVersion;
  } catch (err) {
    console.error("Failed to create new version on update:", err);
    return null;
  }
}

/**
 * Get version state (canUndo, canRedo) for a question.
 */
export async function getVersionState(
  questionId: string
): Promise<VersionState> {
  const client = getSupabaseClient();

  try {
    // Get active version
    const { data: activeVersion } = await client
      .from("gen_question_versions")
      .select("version_index")
      .eq("gen_question_id", questionId)
      .eq("is_active", true)
      .eq("is_deleted", false)
      .single();

    if (!activeVersion) {
      return { canUndo: false, canRedo: false };
    }

    const currentIndex = activeVersion.version_index;

    // Check if previous version exists
    const { count: undoCount } = await client
      .from("gen_question_versions")
      .select("*", { count: "exact", head: true })
      .eq("gen_question_id", questionId)
      .lt("version_index", currentIndex)
      .eq("is_deleted", false);

    // Check if next version exists
    const { count: redoCount } = await client
      .from("gen_question_versions")
      .select("*", { count: "exact", head: true })
      .eq("gen_question_id", questionId)
      .gt("version_index", currentIndex)
      .eq("is_deleted", false);

    return {
      canUndo: (undoCount ?? 0) > 0,
      canRedo: (redoCount ?? 0) > 0,
    };
  } catch {
    return { canUndo: false, canRedo: false };
  }
}

/**
 * Batch get version states for multiple questions in a single RPC call.
 * Reduces N questions × 3 API calls down to 1 API call.
 */
export async function getVersionStatesBatch(
  questionIds: string[]
): Promise<Map<string, VersionState>> {
  const client = getSupabaseClient();
  const resultMap = new Map<string, VersionState>();

  if (questionIds.length === 0) {
    return resultMap;
  }

  try {
    const { data, error } = await client.rpc("get_version_states_batch", {
      question_ids: questionIds,
    });

    if (error) {
      console.error("Failed to fetch version states batch:", error);
      // Return default states for all questions
      questionIds.forEach((id) => {
        resultMap.set(id, { canUndo: false, canRedo: false });
      });
      return resultMap;
    }

    // Map the results
    if (data) {
      data.forEach((row: any) => {
        resultMap.set(row.gen_question_id, {
          canUndo: row.can_undo,
          canRedo: row.can_redo,
        });
      });
    }

    // Fill in missing questions with default state
    questionIds.forEach((id) => {
      if (!resultMap.has(id)) {
        resultMap.set(id, { canUndo: false, canRedo: false });
      }
    });

    return resultMap;
  } catch (err) {
    console.error("Error in getVersionStatesBatch:", err);
    // Return default states for all questions
    questionIds.forEach((id) => {
      resultMap.set(id, { canUndo: false, canRedo: false });
    });
    return resultMap;
  }
}

/**
 * Undo: Activate previous version and copy data to question.
 * Returns the updated question.
 */
export async function undoQuestionVersion(
  questionId: string
): Promise<GeneratedQuestion | null> {
  const client = getSupabaseClient();

  try {
    // 1. Get current active version
    const { data: activeVersion } = await client
      .from("gen_question_versions")
      .select("id, version_index")
      .eq("gen_question_id", questionId)
      .eq("is_active", true)
      .eq("is_deleted", false)
      .single();

    if (!activeVersion) {
      console.error("No active version found for undo");
      return null;
    }

    // 2. Find previous version
    const { data: previousVersion } = await client
      .from("gen_question_versions")
      .select("*")
      .eq("gen_question_id", questionId)
      .lt("version_index", activeVersion.version_index)
      .eq("is_deleted", false)
      .order("version_index", { ascending: false })
      .limit(1)
      .single();

    if (!previousVersion) {
      console.error("No previous version found for undo");
      return null;
    }

    // 3. Set current as inactive
    await client
      .from("gen_question_versions")
      .update({ is_active: false })
      .eq("id", activeVersion.id);

    // 4. Set previous as active
    await client
      .from("gen_question_versions")
      .update({ is_active: true })
      .eq("id", previousVersion.id);

    // 5. Copy versioned fields to gen_questions
    const updateData: UpdateGeneratedQuestion = {};
    for (const field of VERSION_FIELDS) {
      if (field in previousVersion) {
        (updateData as Record<string, unknown>)[field] =
          previousVersion[field as keyof typeof previousVersion];
      }
    }

    const { data: updatedQuestion, error } = await client
      .from("gen_questions")
      .update(updateData)
      .eq("id", questionId)
      .select()
      .single();

    if (error) {
      console.error("Failed to update question on undo:", error);
      return null;
    }

    return updatedQuestion;
  } catch (err) {
    console.error("Undo failed:", err);
    return null;
  }
}

/**
 * Redo: Activate next version and copy data to question.
 * Returns the updated question.
 */
export async function redoQuestionVersion(
  questionId: string
): Promise<GeneratedQuestion | null> {
  const client = getSupabaseClient();

  try {
    // 1. Get current active version
    const { data: activeVersion } = await client
      .from("gen_question_versions")
      .select("id, version_index")
      .eq("gen_question_id", questionId)
      .eq("is_active", true)
      .eq("is_deleted", false)
      .single();

    if (!activeVersion) {
      console.error("No active version found for redo");
      return null;
    }

    // 2. Find next version
    const { data: nextVersion } = await client
      .from("gen_question_versions")
      .select("*")
      .eq("gen_question_id", questionId)
      .gt("version_index", activeVersion.version_index)
      .eq("is_deleted", false)
      .order("version_index", { ascending: true })
      .limit(1)
      .single();

    if (!nextVersion) {
      console.error("No next version found for redo");
      return null;
    }

    // 3. Set current as inactive
    await client
      .from("gen_question_versions")
      .update({ is_active: false })
      .eq("id", activeVersion.id);

    // 4. Set next as active
    await client
      .from("gen_question_versions")
      .update({ is_active: true })
      .eq("id", nextVersion.id);

    // 5. Copy versioned fields to gen_questions
    const updateData: UpdateGeneratedQuestion = {};
    for (const field of VERSION_FIELDS) {
      if (field in nextVersion) {
        (updateData as Record<string, unknown>)[field] =
          nextVersion[field as keyof typeof nextVersion];
      }
    }

    const { data: updatedQuestion, error } = await client
      .from("gen_questions")
      .update(updateData)
      .eq("id", questionId)
      .select()
      .single();

    if (error) {
      console.error("Failed to update question on redo:", error);
      return null;
    }

    return updatedQuestion;
  } catch (err) {
    console.error("Redo failed:", err);
    return null;
  }
}
