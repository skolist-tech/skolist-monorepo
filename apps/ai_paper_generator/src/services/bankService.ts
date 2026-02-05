import { getSupabaseClient } from "@skolist/auth";
import type { GeneratedQuestionWithConcepts } from "./questionService";

const API_URL = import.meta.env.VITE_FASTAPI_URL;

export interface BankFilter {
  subject_id?: string;
  question_type?: string;
  hardness_level?: string;
  is_solved_example?: boolean;
  is_from_exercise?: boolean;
  is_image_needed?: boolean;
  is_incomplete?: boolean;
  concept_ids?: string[];
  search_query?: string;
}

export interface BankQuestionResponse {
  id: string;
  question: GeneratedQuestionWithConcepts; // We cast the payload to this type for the card
  concept_ids: string[];
  raw_data: any;
}

export interface ListQuestionsResponse {
  data: BankQuestionResponse[];
  total: number;
  page: number;
  page_size: number;
}

export interface CompareResponse {
  original: any;
  new: any;
}

export const bankService = {
  /**
   * info: List bank questions with filters and pagination
   * endpoint: POST /api/v1/bank/list
   */
  async listQuestions(page: number, page_size: number, filters: BankFilter) {
    try {
      const {
        data: { session },
      } = await getSupabaseClient().auth.getSession();
      const token = session?.access_token;

      if (!token) throw new Error("User not authenticated");

      const response = await fetch(`${API_URL}/api/v1/bank/list`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ page, page_size, filters }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail ||
            `Failed to fetch questions: ${response.statusText}`
        );
      }

      return (await response.json()) as ListQuestionsResponse;
    } catch (error) {
      console.error("Error listing bank questions:", error);
      throw error;
    }
  },

  /**
   * info: Preview Auto-Correct (No Save)
   * endpoint: POST /api/v1/bank/preview/auto-correct
   */
  async previewAutoCorrect(question: any) {
    try {
      const {
        data: { session },
      } = await getSupabaseClient().auth.getSession();
      const token = session?.access_token;

      if (!token) throw new Error("User not authenticated");

      const response = await fetch(
        `${API_URL}/api/v1/bank/preview/auto-correct`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ question }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail ||
            `Failed to preview auto-correct: ${response.statusText}`
        );
      }

      return (await response.json()) as CompareResponse;
    } catch (error) {
      console.error("Error previewing auto-correct:", error);
      throw error;
    }
  },

  /**
   * info: Preview Regenerate (No Save)
   * endpoint: POST /api/v1/bank/preview/regenerate
   */
  async previewRegenerate(question: any, prompt?: string) {
    try {
      const {
        data: { session },
      } = await getSupabaseClient().auth.getSession();
      const token = session?.access_token;

      if (!token) throw new Error("User not authenticated");

      const response = await fetch(
        `${API_URL}/api/v1/bank/preview/regenerate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ question, prompt }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail ||
            `Failed to preview regenerate: ${response.statusText}`
        );
      }

      return (await response.json()) as CompareResponse;
    } catch (error) {
      console.error("Error previewing regenerate:", error);
      throw error;
    }
  },

  /**
   * info: Update Bank Question (Persistence)
   * endpoint: POST /api/v1/bank/update
   */
  async updateQuestion(id: string, question: any) {
    try {
      const {
        data: { session },
      } = await getSupabaseClient().auth.getSession();
      const token = session?.access_token;

      if (!token) throw new Error("User not authenticated");

      const response = await fetch(`${API_URL}/api/v1/bank/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id, question }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail ||
            `Failed to update question: ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error updating bank question:", error);
      throw error;
    }
  },

  /**
   * info: Fetch all subjects
   * endpoint: GET /api/v1/bank/subjects (Assume we add this or use existing?)
   * Wait, we can likely use standard Supabase client since subjects are public data basically.
   */
  async fetchSubjects() {
    try {
      // Direct Supabase call is easiest since subjects table is likely readable
      const client = getSupabaseClient();
      const { data, error } = await client
        .from("subjects")
        .select("id, name")
        .order("name");

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching subjects:", error);
      return [];
    }
  },

  /**
   * info: Remove Image Needed Flag
   * endpoint: POST /api/v1/bank/remove_image_needed
   */
  async removeImageNeeded(id: string) {
    try {
      const {
        data: { session },
      } = await getSupabaseClient().auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("User not authenticated");

      const response = await fetch(
        `${API_URL}/api/v1/bank/remove_image_needed`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ id }),
        }
      );
      if (!response.ok) throw new Error("Failed to remove image flag");
      return await response.json();
    } catch (error) {
      console.error("Error removing image needed flag:", error);
      throw error;
    }
  },

  /**
   * info: Remove Incomplete Flag
   * endpoint: POST /api/v1/bank/remove_incomplete
   */
  async removeIncomplete(id: string) {
    try {
      const {
        data: { session },
      } = await getSupabaseClient().auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("User not authenticated");

      const response = await fetch(`${API_URL}/api/v1/bank/remove_incomplete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json", // Fixed content-type
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id }),
      });
      if (!response.ok) throw new Error("Failed to remove incomplete flag");
      return await response.json();
    } catch (error) {
      console.error("Error removing incomplete flag:", error);
      throw error;
    }
  },
};
