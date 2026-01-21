/**
 * Supabase client for AI Paper Generator app
 * Re-exports the shared auth client and provides app-specific utilities
 */

import { getSupabaseClient } from "@skolist/auth";


/**
 * Helper to get the current user ID
 * Throws if not authenticated
 */
export async function getCurrentUserId(): Promise<string> {
  const client = getSupabaseClient();
  const {
    data: { user },
    error,
  } = await client.auth.getUser();

  if (error || !user) {
    throw new Error("User not authenticated");
  }

  return user.id;
}

/**
 * Helper to check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const client = getSupabaseClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  return !!user;
}