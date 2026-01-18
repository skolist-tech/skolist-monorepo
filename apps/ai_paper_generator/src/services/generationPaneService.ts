/**
 * Generation Pane Service
 * Handles Supabase operations for persisting generation pane status
 */

import { getClient } from "./supabase";
import type {
  QgenGenerationPaneStatus,
  InsertQgenGenerationPaneStatus,
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
