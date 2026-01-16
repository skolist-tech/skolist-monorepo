import { getClient } from "./supabase";

// Get API URL from environment variables, fallback to localhost for development
const API_URL = import.meta.env.VITE_FASTAPI_URL;

interface GenerateQuestionsPayload {
  activity_id: string;
  concept_ids: string[];
  config: {
    question_types: {
      type: string;
      count: number;
    }[];
    difficulty_distribution: {
      easy: number;
      medium: number;
      hard: number;
    };
  };
}

export const fastApiService = {
  /**
   * info: Calls the FastAPI backend to generate questions
   * endpoint: POST /api/v1/generate/questions
   */
  async generateQuestions(payload: GenerateQuestionsPayload) {
    try {
      const {
        data: { session },
      } = await getClient().auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error("User not authenticated");
      }

      const response = await fetch(`${API_URL}/api/v1/generate/questions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail ||
            `Failed to generate questions: ${response.statusText}`
        );
      }

      // 201 Created returns empty body, so don't try to parse JSON
      if (response.status === 201) {
        return { success: true };
      }

      return await response.json();
    } catch (error) {
      console.error("Error generating questions:", error);
      throw error;
    }
  },
  /**
   * info: Calls the FastAPI backend to beautify the question
   * endpoint: POST /api/v1/beautify_question
   */
  async beautifyQuestion(gen_question_id: string) {
    try {
      const {
        data: { session },
      } = await getClient().auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error("User not authenticated");
      }

      const response = await fetch(
        `${API_URL}/api/v1/beautify_question?gen_question_id=${gen_question_id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail ||
            `Failed to beautify question: ${response.statusText}`
        );
      }

      // 201 Created returns empty body, so don't try to parse JSON
      if (response.status === 201) {
        return { success: true };
      }

      return await response.json();
    } catch (error) {
      console.error("Error beautifying question:", error);
      throw error;
    }
  },
};
