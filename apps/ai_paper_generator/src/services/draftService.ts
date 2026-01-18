/**
 * Draft Service
 * Handles Supabase operations for draft management
 */

import { getClient } from "./supabase";
import type {
  QgenDraftInstructionAndQgenDraft,
  QgenDraft,
  UpdateQgenDraft,
  QgenDraftSection,
  UpdateQgenDraftSection,
} from "@skolist/db";

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
  updates: UpdateQgenDraft
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
  updates: UpdateQgenDraftSection
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
  activityId: string
): Promise<{ status: string; path: string; message?: string }> {
  const client = getClient();
  const filePath = `${activityId}/logo.png`;

  // 1. Upload file (upsert: true to replace)
  const { error: uploadError } = await client.storage
    .from("draft_logo_bucket")
    .upload(filePath, file, {
      upsert: true,
    });

  if (uploadError) {
    console.error("Error uploading logo:", uploadError);
    throw uploadError;
  }

  // 2. Update qgen_drafts table
  const { error: dbError } = await client
    .from("qgen_drafts")
    .update({ logo_url: filePath })
    .eq("activity_id", activityId);

  if (dbError) {
    console.error("Error updating draft logo_url:", dbError);
    throw dbError;
  }

  return { status: "success", path: filePath };
}

/**
 * Delete logo from storage
 */
export async function deleteLogo(activityId: string): Promise<void> {
  const client = getClient();
  const filePath = `${activityId}/logo.png`;

  // 1. Remove from storage
  const { error: removeError } = await client.storage
    .from("draft_logo_bucket")
    .remove([filePath]);

  if (removeError) {
    console.error("Error deleting logo:", removeError);
    throw removeError;
  }

  // 2. Update qgen_drafts table
  const { error: dbError } = await client
    .from("qgen_drafts")
    .update({ logo_url: null })
    .eq("activity_id", activityId);

  if (dbError) {
    console.error("Error updating draft logo_url:", dbError);
    throw dbError;
  }
}

/**
 * Get signed URL for logo (valid for 1 hour)
 */
export async function getSignedLogoUrl(
  path: string | null
): Promise<string | null> {
  if (!path) return null;
  const client = getClient();
  const { data, error } = await client.storage
    .from("draft_logo_bucket")
    .createSignedUrl(path, 3600); // 1 hour

  if (error) {
    console.error("Error creating signed URL:", error);
    return null;
  }
  return data.signedUrl;
}

/**
 * Check if logo exists in storage
 */
export async function hasLogo(activityId: string): Promise<boolean> {
  const client = getClient();
  const filePath = "logo.png";

  // List files in the folder
  const { data, error } = await client.storage
    .from("draft_logo_bucket")
    .list(activityId, {
      limit: 1,
      search: filePath,
    });

  if (error) {
    console.error("Error checking logo existence:", error);
    return false;
  }

  // Check if file exists in the list
  return data && data.length > 0 && data[0]!.name === "logo.png";
}
