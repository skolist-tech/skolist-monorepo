/**
 * Draft Service
 * Handles Supabase operations for draft management
 */

import { getClient } from "./supabase";
import type {
  Tables,
  TablesUpdate,
  QgenDraftInstructionAndQgenDraft,
} from "@skolist/db";

export type QgenDraft = Tables<"qgen_drafts">;
export type QgenDraftSection = Tables<"qgen_draft_sections">;
export type QgenInstruction = QgenDraftInstructionAndQgenDraft;

// -- Instructions Service --

/**
 * Fetch all instructions for a draft
 */
export async function fetchDraftInstructions(
  draftId: string
): Promise<QgenInstruction[]> {
  const client = getClient();
  const { data, error } = await client
    .from("qgen_draft_instructions_drafts_maps")
    .select("*")
    .eq("qgen_draft_id", draftId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch instructions:", error);
    throw error;
  }
  return data || [];
}

/**
 * Create a new instruction for the draft
 */
export async function createDraftInstruction(
  draftId: string,
  text: string
): Promise<QgenInstruction> {
  const client = getClient();
  const { data, error } = await client
    .from("qgen_draft_instructions_drafts_maps")
    .insert({
      qgen_draft_id: draftId,
      instruction_text: text,
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to create instruction:", error);
    throw error;
  }
  return data;
}

/**
 * Update an existing instruction
 */
export async function updateDraftInstruction(
  id: string,
  text: string
): Promise<QgenInstruction> {
  const client = getClient();
  const { data, error } = await client
    .from("qgen_draft_instructions_drafts_maps")
    .update({ instruction_text: text })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Failed to update instruction:", error);
    throw error;
  }
  return data;
}

/**
 * Delete an instruction
 */
export async function deleteDraftInstruction(id: string): Promise<void> {
  const client = getClient();
  const { error } = await client
    .from("qgen_draft_instructions_drafts_maps")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Failed to delete instruction:", error);
    throw error;
  }
}

/**
 * Fetch current draft for an activity
 * Creates one if it doesn't exist
 */
export async function fetchOrCreateDraft(
  activityId: string
): Promise<QgenDraft> {
  const client = getClient();

  // Try to find existing draft
  const { data: existingDraft, error: fetchError } = await client
    .from("qgen_drafts")
    .select("*")
    .eq("activity_id", activityId)
    .maybeSingle();

  if (fetchError) {
    console.error("Failed to fetch draft:", fetchError);
    throw fetchError;
  }

  if (existingDraft) {
    return existingDraft;
  }

  // Create new draft
  const { data: newDraft, error: createError } = await client
    .from("qgen_drafts")
    .insert({
      activity_id: activityId,
      paper_title: "Untitled Paper",
    })
    .select()
    .single();

  if (createError) {
    console.error("Failed to create draft:", createError);
    throw createError;
  }

  return newDraft;
}

/**
 * Update draft settings
 */
export async function updateDraft(
  draftId: string,
  updates: TablesUpdate<"qgen_drafts">
): Promise<QgenDraft> {
  const client = getClient();

  const { data, error } = await client
    .from("qgen_drafts")
    .update(updates)
    .eq("id", draftId)
    .select()
    .single();

  if (error) {
    console.error("Failed to update draft:", error);
    throw error;
  }

  return data;
}

/**
 * Fetch sections for a draft
 */
export async function fetchSections(
  draftId: string
): Promise<QgenDraftSection[]> {
  const client = getClient();

  const { data, error } = await client
    .from("qgen_draft_sections")
    .select("*")
    .eq("qgen_draft_id", draftId)
    .order("position_in_draft", { ascending: true });

  if (error) {
    console.error("Failed to fetch sections:", error);
    throw error;
  }

  return data ?? [];
}

/**
 * Create a new section
 */
export async function createSection(
  draftId: string,
  position: number,
  name: string = "New Section"
): Promise<QgenDraftSection> {
  const client = getClient();

  const { data, error } = await client
    .from("qgen_draft_sections")
    .insert({
      qgen_draft_id: draftId,
      position_in_draft: position,
      section_name: name,
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to create section:", error);
    throw error;
  }

  return data;
}

/**
 * Update a section
 */
export async function updateSection(
  sectionId: string,
  updates: TablesUpdate<"qgen_draft_sections">
): Promise<QgenDraftSection> {
  const client = getClient();

  const { data, error } = await client
    .from("qgen_draft_sections")
    .update(updates)
    .eq("id", sectionId)
    .select()
    .single();

  if (error) {
    console.error("Failed to update section:", error);
    throw error;
  }

  return data;
}

/**
 * Delete a section
 */
export async function deleteSection(sectionId: string): Promise<void> {
  const client = getClient();

  // First unassign questions from this section
  const { error: updateError } = await client
    .from("gen_questions")
    .update({ qgen_draft_section_id: null })
    .eq("qgen_draft_section_id", sectionId);

  if (updateError) {
    console.error(
      "Failed to unassign questions before deleting section:",
      updateError
    );
    throw updateError;
  }

  const { error } = await client
    .from("qgen_draft_sections")
    .delete()
    .eq("id", sectionId);

  if (error) {
    console.error("Failed to delete section:", error);
    throw error;
  }
}

/**
 * Upload logo to storage
 */
export async function uploadLogo(
  file: File,
  userId: string
): Promise<string | null> {
  const client = getClient();
  const fileExt = file.name.split(".").pop();
  const fileName = `${userId}-${Math.random().toString(36).substring(2)}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error: uploadError } = await client.storage
    .from("logo_bucket")
    .upload(filePath, file);

  if (uploadError) {
    console.error("Error uploading logo:", uploadError);
    throw uploadError;
  }

  const { data } = client.storage.from("logo_bucket").getPublicUrl(filePath);

  return data.publicUrl;
}
