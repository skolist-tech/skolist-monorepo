/**
 * Generation Pane Service
 * Handles Supabase operations for persisting generation pane status
 */

import { getClient } from "./supabase";
import type {
  QgenGenerationPaneStatus,
  InsertQgenGenerationPaneStatus,
  InsertQgenGenerationPaneConcept,
} from "@skolist/db";

/**
 * Fetch generation pane status for an activity
 */
export async function fetchGenerationPaneStatus(
  activityId: string
): Promise<QgenGenerationPaneStatus | null> {
  const client = getClient();

  const { data, error } = await client
    .from("qgen_generation_panes")
    .select("*")
    .eq("activity_id", activityId)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch generation pane status:", error);
    throw error;
  }

  return data;
}

/**
 * Upsert generation pane status for an activity
 * Creates a new record if one doesn't exist, otherwise updates the existing one
 */
export async function upsertGenerationPaneStatus(
  status: InsertQgenGenerationPaneStatus
): Promise<QgenGenerationPaneStatus> {
  const client = getClient();

  const { data, error } = await client
    .from("qgen_generation_panes")
    .upsert(status, {
      onConflict: "activity_id",
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to upsert generation pane status:", error);
    throw error;
  }

  return data;
}

/**
 * Fetch concept IDs associated with a generation pane
 */
export async function fetchGenerationPaneConcepts(
  paneId: string
): Promise<string[]> {
  const client = getClient();

  const { data, error } = await client
    .from("generation_pane_concepts_maps")
    .select("concept_id")
    .eq("qgen_generation_pane_id", paneId);

  if (error) {
    console.error("Failed to fetch generation pane concepts:", error);
    throw error;
  }

  return data.map((row) => row.concept_id);
}

/**
 * Replace concepts associated with a generation pane
 * Deletes all existing mappings and inserts new ones
 */
export async function replaceGenerationPaneConcepts(
  paneId: string,
  conceptIds: string[]
): Promise<void> {
  const client = getClient();

  // 1. Delete existing mappings
  const { error: deleteError } = await client
    .from("generation_pane_concepts_maps")
    .delete()
    .eq("qgen_generation_pane_id", paneId);

  if (deleteError) {
    console.error("Failed to clear previous concepts:", deleteError);
    throw deleteError;
  }

  if (conceptIds.length === 0) return;

  // 2. Insert new mappings
  const records: InsertQgenGenerationPaneConcept[] = conceptIds.map(
    (conceptId) => ({
      qgen_generation_pane_id: paneId,
      concept_id: conceptId,
    })
  );

  const { error: insertError } = await client
    .from("generation_pane_concepts_maps")
    .insert(records);

  if (insertError) {
    console.error("Failed to insert new concepts:", insertError);
    throw insertError;
  }
}
