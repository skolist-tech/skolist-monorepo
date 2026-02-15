import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export interface ContactFormRequest {
  name: string;
  role: string;
  school_name: string;
  email: string;
  phone: string;
  message?: string;
  form_type: "demo_form" | "waitlist_form" | "school_registration";
}

export interface ApiResponse {
  success: boolean;
  message: string;
  errors?: { field: string; message: string }[];
}

export const submitContactForm = async (
  data: ContactFormRequest
): Promise<ApiResponse> => {
  try {
    const contactCollection = collection(db, "contact_submission");
    await addDoc(contactCollection, {
      ...data,
      submittedAt: serverTimestamp(),
    });

    return {
      success: true,
      message: "Thank you! We will contact you soon.",
    };
  } catch (error) {
    console.error("Error submitting form:", error);
    return {
      success: false,
      message: "Failed to submit. Please try again.",
    };
  }
};

export default { submitContactForm };
