import { useEffect, useRef } from "react";
import { RecaptchaVerifier } from "firebase/auth";
import { firebaseAuth } from "../../firebase";

declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier | undefined;
  }
}

/**
 * Custom hook to manage reCAPTCHA lifecycle for Firebase phone auth.
 * Returns a ref to attach to the container div and a setup function.
 */
export function useRecaptcha(authMethod: "phone" | "email", otpSent: boolean) {
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);

  // Cleanup verifier when auth method changes or OTP is sent
  useEffect(() => {
    return () => {
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch (e) {
          console.warn("Error clearing recaptcha:", e);
        }
        recaptchaVerifierRef.current = null;
        window.recaptchaVerifier = undefined;
      }
    };
  }, [authMethod, otpSent]);

  const setupRecaptcha = (): RecaptchaVerifier | null => {
    if (recaptchaVerifierRef.current) {
      return recaptchaVerifierRef.current;
    }

    if (!recaptchaContainerRef.current) {
      console.error("Recaptcha container ref is not available");
      return null;
    }

    // Clear any existing children to prevent "already rendered" error
    if (recaptchaContainerRef.current.childNodes.length > 0) {
      recaptchaContainerRef.current.innerHTML = "";
    }

    const verifier = new RecaptchaVerifier(
      firebaseAuth,
      recaptchaContainerRef.current,
      {
        size: "invisible",
        callback: () => {
          // reCAPTCHA solved
        },
      }
    );

    recaptchaVerifierRef.current = verifier;
    window.recaptchaVerifier = verifier;
    return verifier;
  };

  return {
    recaptchaContainerRef,
    setupRecaptcha,
  };
}
