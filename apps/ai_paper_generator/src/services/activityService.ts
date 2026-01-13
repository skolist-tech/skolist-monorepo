/**
 * Activity Service
 * Handles Supabase operations for activities with product_type='qgen'
 */

import { getClient, getCurrentUserId } from "./supabase";
import type {
  Activity,
  InsertActivity,
  UpdateActivity,
  InsertConceptAndActivity,
} from "@skolist/db";

const PRODUCT_TYPE = "qgen" as const;

/**
 * Fetch all activities for the current user filtered by product_type='qgen'
 */
export async function fetchUserActivities(): Promise<Activity[]> {
  const client = getClient();
  const userId = await getCurrentUserId();

  const { data, error } = await client
    .from("activities")
    .select("*")
    .eq("user_id", userId)
    .eq("product_type", PRODUCT_TYPE)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch activities:", error);
    throw error;
  }

  return data ?? [];
}

/**
 * Create a new activity for the current user
 */
export async function createActivity(name: string): Promise<Activity> {
  const client = getClient();
  const userId = await getCurrentUserId();

  const insertData: InsertActivity = {
    name,
    user_id: userId,
    product_type: PRODUCT_TYPE,
  };

  const { data, error } = await client
    .from("activities")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error("Failed to create activity:", error);
    throw error;
  }

  return data;
}

/**
 * Delete an activity by ID
 */
export async function deleteActivity(activityId: string): Promise<void> {
  const client = getClient();

  const { error } = await client
    .from("activities")
    .delete()
    .eq("id", activityId);

  if (error) {
    console.error("Failed to delete activity:", error);
    throw error;
  }
}

/**
 * Update an activity
 */
export async function updateActivity(
  activityId: string,
  updates: UpdateActivity
): Promise<Activity> {
  const client = getClient();

  const { data, error } = await client
    .from("activities")
    .update(updates)
    .eq("id", activityId)
    .select()
    .single();

  if (error) {
    console.error("Failed to update activity:", error);
    throw error;
  }

  return data;
}

/**
 * Upsert concept-activity mappings
 * Ignores duplicates if the pair already exists
 */
export async function upsertActivityConcepts(
  activityId: string,
  conceptIds: string[]
): Promise<void> {
  const client = getClient();

  if (conceptIds.length === 0) return;

  const records: InsertConceptAndActivity[] = conceptIds.map((conceptId) => ({
    activity_id: activityId,
    concept_id: conceptId,
  }));

  const { error } = await client
    .from("concepts_activities_maps")
    .upsert(records, {
      onConflict: "activity_id,concept_id",
      ignoreDuplicates: true,
    });

  if (error) {
    console.error("Failed to upsert activity concepts:", error);
    throw error;
  }
}

/**
 * Fetch concept IDs associated with an activity
 */
export async function fetchActivityConcepts(
  activityId: string
): Promise<string[]> {
  const client = getClient();

  const { data, error } = await client
    .from("concepts_activities_maps")
    .select("concept_id")
    .eq("activity_id", activityId);

  if (error) {
    console.error("Failed to fetch activity concepts:", error);
    throw error;
  }

  return data.map((row) => row.concept_id);
}
