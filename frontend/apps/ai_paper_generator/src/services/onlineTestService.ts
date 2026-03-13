/**
 * Online Test Service
 * Handles Supabase operations for online test creation and management
 */

import { getSupabaseClient, getCurrentUserId } from "@skolist/auth";

const API_URL = import.meta.env.VITE_FASTAPI_URL;

async function getAuthToken(): Promise<string> {
  const {
    data: { session },
  } = await getSupabaseClient().auth.getSession();

  const token = session?.access_token;
  if (!token) throw new Error("User not authenticated");
  return token;
}

export interface CreateOnlineTestResult {
  id: string;
  share_code: string;
  status: "draft" | "active" | "closed";
  title: string;
  duration_minutes: number;
  created_at: string;
  already_exists: boolean;
}

export interface CreateOnlineTestOptions {
  maxAttempts?: number;
  showResultsImmediately?: boolean;
  negativeMarksConfig?: Record<string, number>;
}

/**ssss
 * Create an online test from a draft
 * Calls the Supabase RPC function
 */
export async function createOnlineTestFromDraft(
  draftId: string,
  options: CreateOnlineTestOptions = {}
): Promise<CreateOnlineTestResult> {
  const client = getSupabaseClient();

  const { data, error } = await client.rpc("create_online_test_from_draft", {
    p_draft_id: draftId,
    p_max_attempts: options.maxAttempts ?? 1,
    p_show_results_immediately: options.showResultsImmediately ?? false,
    p_negative_marks_config: options.negativeMarksConfig ?? null,
  });

  if (error) {
    console.error("Failed to create online test:", error);
    throw new Error(error.message || "Failed to create online test");
  }

  return data as CreateOnlineTestResult;
}

/**
 * Generate the shareable test URL from a share code
 */
export function getTestShareUrl(shareCode: string): string {
  // Use window.location.origin to get the base URL dynamically
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  return `${baseUrl}/test/${shareCode}`;
}

/**
 * Get online test details by share code
 */
export async function getOnlineTestByShareCode(shareCode: string) {
  const token = await getAuthToken();
  const response = await fetch(
    `${API_URL}/api/v1/test-attempts/share-code/${encodeURIComponent(shareCode.toUpperCase())}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to get online test");
  }

  return response.json();
}

/**
 * Get online test details by ID
 */
export async function getOnlineTestById(testId: string) {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("online_tests")
    .select("*, qgen_drafts ( paper_title, subject_name, school_class_name )")
    .eq("id", testId)
    .single();

  if (error) {
    console.error("Failed to get online test:", error);
    throw new Error(error.message || "Failed to get online test");
  }

  return data;
}

/**
 * Fetch existing online test for a draft (if any)
 */
export async function getOnlineTestByDraftId(draftId: string) {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("online_tests")
    .select("*")
    .eq("qgen_draft_id", draftId)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 = not found, which is ok
    console.error("Failed to fetch online test:", error);
    throw error;
  }

  return data;
}

/**
 * Fetch online tests filtered by subject ID and optionally class ID.
 * Uses a multi-step query due to indirect relationship:
 * online_tests -> qgen_drafts -> activities -> qgen_generation_panes -> subject_id
 * Since we don't have direct FKs for efficient joins in one go, we step through.
 */
export async function getOnlineTestsBySubject(
  subjectId: string,
  classId?: string
) {
  const client = getSupabaseClient();
  const userId = await getCurrentUserId().catch(() => null);

  if (!userId) return [];

  // 1. Get generation panes (linked to activities) for this subject (and class if provided)
  let query = client
    .from("qgen_generation_panes")
    .select("activity_id")
    .eq("subject_id", subjectId);

  if (classId) {
    query = query.eq("school_class_id", classId);
  }

  const { data: paneData, error: paneError } = await query;

  if (paneError) {
    console.error("Failed to fetch panes:", paneError);
    throw paneError;
  }

  const activityIds = paneData.map((p) => p.activity_id).filter(Boolean);

  if (activityIds.length === 0) return [];

  // 2. Get drafts for these activities
  // Note: qgen_drafts.activity_id links to activities.id
  const { data: draftData, error: draftError } = await client
    .from("qgen_drafts")
    .select("id")
    .in("activity_id", activityIds);

  if (draftError) {
    console.error("Failed to fetch drafts:", draftError);
    throw draftError;
  }

  const draftIds = draftData.map((d) => d.id);

  if (draftIds.length === 0) return [];

  // 3. Get online tests for these drafts
  const { data: testData, error: testError } = await client
    .from("online_tests")
    .select("*, qgen_drafts ( paper_title, subject_name, school_class_name )")
    .in("qgen_draft_id", draftIds)
    .order("created_at", { ascending: false });

  if (testError) {
    console.error("Failed to fetch online tests:", testError);
    throw testError;
  }

  return testData;
}
