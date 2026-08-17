import { getSupabaseClient } from "@skolist/auth";

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
  // Optional custom instructions/prompt forwarded from the UI
  instructions?: string;
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
      } = await getSupabaseClient().auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error("User not authenticated");
      }

      const response = await fetch(
        `${API_URL}/api/v1/qgen/generate_questions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        if (response.status === 402) {
          window.dispatchEvent(new Event("credits-exhausted"));
        }
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
   * info: Calls the FastAPI backend to auto correct the question
   * endpoint: POST /api/v1/qgen/auto_correct_question
   * @param gen_question_id - UUID of the question to correct
   * @param image - Optional image blob to attach for context (screenshot of the question card)
   */
  async autoCorrectQuestion(gen_question_id: string) {
    try {
      const {
        data: { session },
      } = await getSupabaseClient().auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error("User not authenticated");
      }

      const formData = new FormData();
      formData.append("gen_question_id", gen_question_id);

      const response = await fetch(
        `${API_URL}/api/v1/qgen/auto_correct_question`,
        {
          method: "POST",
          headers: {
            // Don't set Content-Type - let browser set it with boundary for FormData
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        if (response.status === 402) {
          window.dispatchEvent(new Event("credits-exhausted"));
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail ||
            `Failed to Auto Correct question: ${response.statusText}`
        );
      }

      // 201 Created returns empty body, so don't try to parse JSON
      if (response.status === 201 || response.status === 200) {
        return { success: true };
      }

      return await response.json();
    } catch (error) {
      console.error("Error Auto Correcting question:", error);
      throw error;
    }
  },
  /**
   * info: Calls the FastAPI backend to regenerate a question with same concepts
   * endpoint: POST /api/v1/qgen/regenerate_question
   */
  async regenerateQuestion(gen_question_id: string) {
    try {
      const {
        data: { session },
      } = await getSupabaseClient().auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error("User not authenticated");
      }

      const response = await fetch(
        `${API_URL}/api/v1/qgen/regenerate_question?gen_question_id=${gen_question_id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 402) {
          window.dispatchEvent(new Event("credits-exhausted"));
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail ||
            `Failed to regenerate question: ${response.statusText}`
        );
      }

      if (response.status === 201 || response.status === 200) {
        return { success: true };
      }

      return await response.json();
    } catch (error) {
      console.error("Error regenerating question:", error);
      throw error;
    }
  },
  /**
   * info: Calls the FastAPI backend to regenerate a question with custom prompt and files
   * endpoint: POST /api/v1/qgen/regenerate_question_with_prompt
   */
  async regenerateQuestionWithPrompt(
    gen_question_id: string,
    prompt?: string,
    files?: File[],
    isCameraCapture?: boolean
  ) {
    try {
      const {
        data: { session },
      } = await getSupabaseClient().auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error("User not authenticated");
      }

      // Use FormData for multipart/form-data request (required for file uploads)
      const formData = new FormData();
      formData.append("gen_question_id", gen_question_id);

      if (isCameraCapture) {
        formData.append("is_camera_capture", "true");
      }

      if (prompt) {
        formData.append("prompt", prompt);
      }

      if (files && files.length > 0) {
        files.forEach((file) => {
          formData.append("files", file);
        });
      }

      const response = await fetch(
        `${API_URL}/api/v1/qgen/regenerate_question_with_prompt`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            // Note: Don't set Content-Type for FormData, browser will set it with boundary
          },
          body: formData,
        }
      );

      if (!response.ok) {
        if (response.status === 402) {
          window.dispatchEvent(new Event("credits-exhausted"));
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail ||
            `Failed to regenerate question with prompt: ${response.statusText}`
        );
      }

      if (response.status === 201 || response.status === 200) {
        return { success: true };
      }

      return await response.json();
    } catch (error) {
      console.error("Error regenerating question with prompt:", error);
      throw error;
    }
  },
  /**
   * info: Calls the FastAPI backend to get feedback on a draft
   * endpoint: POST /api/v1/qgen/get_feedback
   */
  async getFeedback(draft_id: string) {
    try {
      const {
        data: { session },
      } = await getSupabaseClient().auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error("User not authenticated");
      }

      const response = await fetch(`${API_URL}/api/v1/qgen/get_feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ draft_id }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `Failed to get feedback: ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error getting feedback:", error);
      throw error;
    }
  },
  /**
   * info: Calls the FastAPI backend to download PDF
   * endpoint: POST /api/v1/qgen/download_pdf
   */
  async downloadPdf(draft_id: string, mode: string) {
    try {
      const {
        data: { session },
      } = await getSupabaseClient().auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error("User not authenticated");
      }

      const response = await fetch(`${API_URL}/api/v1/qgen/download_pdf`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ draft_id, mode }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `Failed to download PDF: ${response.statusText}`
        );
      }

      return await response.blob();
    } catch (error) {
      console.error("Error downloading PDF:", error);
      throw error;
    }
  },
  /**
   * info: Calls the FastAPI backend to download DOCX
   * endpoint: POST /api/v1/qgen/download_docx
   */
  async downloadDocx(draft_id: string, mode: string) {
    try {
      const {
        data: { session },
      } = await getSupabaseClient().auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error("User not authenticated");
      }

      const response = await fetch(`${API_URL}/api/v1/qgen/download_docx`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ draft_id, mode }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `Failed to download DOCX: ${response.statusText}`
        );
      }

      return await response.blob();
    } catch (error) {
      console.error("Error downloading DOCX:", error);
      throw error;
    }
  },
  /**
   * info: Calls the FastAPI backend to edit an SVG using natural language
   * endpoint: POST /api/v1/qgen/edit_svg
   * @param gen_image_id - UUID of the image to edit
   * @param instruction - Natural language instruction for editing
   * @returns Updated image data with new svg_string
   */
  async editSvg(
    gen_image_id: string,
    instruction: string
  ): Promise<{
    id: string;
    svg_string: string;
    gen_question_id: string;
    position: number | null;
  }> {
    try {
      const {
        data: { session },
      } = await getSupabaseClient().auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error("User not authenticated");
      }

      const formData = new FormData();
      formData.append("gen_image_id", gen_image_id);
      formData.append("instruction", instruction);

      const response = await fetch(`${API_URL}/api/v1/qgen/edit_svg`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        if (response.status === 402) {
          window.dispatchEvent(new Event("credits-exhausted"));
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `Failed to edit SVG: ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error editing SVG:", error);
      throw error;
    }
  },
  /**
   * info: Starts extracting questions from a file (image/PDF)
   * endpoint: POST /api/v1/qgen/extract_questions
   * Returns 202 with job_id and section_id. Poll getExtractQuestionsStatus for completion.
   */
  async extractQuestions(
    file: File,
    activity_id: string,
    qgen_draft_id: string,
    prompt?: string,
    section_name?: string
  ): Promise<{
    job_id: string;
    section_id: string;
    section_name: string;
    status: string;
  }> {
    try {
      const {
        data: { session },
      } = await getSupabaseClient().auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error("User not authenticated");
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("activity_id", activity_id);
      formData.append("qgen_draft_id", qgen_draft_id);

      if (prompt) {
        formData.append("prompt", prompt);
      }

      if (section_name) {
        formData.append("section_name", section_name);
      }

      const response = await fetch(`${API_URL}/api/v1/qgen/extract_questions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // Note: Don't set Content-Type for FormData, browser will set it with boundary
        },
        body: formData,
      });

      if (!response.ok) {
        if (response.status === 402) {
          window.dispatchEvent(new Event("credits-exhausted"));
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail ||
            `Failed to extract questions: ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error extracting questions:", error);
      throw error;
    }
  },

  /**
   * info: Poll status of an extract_questions job
   * endpoint: GET /api/v1/qgen/extract_questions/status/{job_id}
   */
  async getExtractQuestionsStatus(job_id: string): Promise<{
    job_id: string;
    request_type: string | null;
    draft_id: string | null;
    section_id: string | null;
    status: "processing" | "success" | "failure";
    error_message: string | null;
    questions_extracted: number | null;
  }> {
    const {
      data: { session },
    } = await getSupabaseClient().auth.getSession();
    const token = session?.access_token;

    if (!token) {
      throw new Error("User not authenticated");
    }

    const response = await fetch(
      `${API_URL}/api/v1/qgen/extract_questions/status/${job_id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.detail ||
          `Failed to fetch extraction status: ${response.statusText}`
      );
    }

    return await response.json();
  },
};
