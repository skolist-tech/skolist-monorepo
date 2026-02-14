import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

let firebaseAuth: Auth;

export function initializeFirebase(config: FirebaseConfig) {
  if (!getApps().length) {
    const app = initializeApp(config);
    firebaseAuth = getAuth(app);
  } else {
    const app = getApp();
    firebaseAuth = getAuth(app);
  }
  return firebaseAuth;
}

// For backward compatibility with existing Vite apps that might import this directly
// We try to initialize with import.meta.env if available, but safely
export const getFirebaseAuth = () => {
  if (firebaseAuth) return firebaseAuth;

  // Try to use environment variables if not initialized manually
  // This block is for legacy support of non-refactored apps
  try {
    const metaWithEnv = import.meta as unknown as {
      env: Record<string, string | undefined>;
    };
    if (typeof import.meta !== "undefined" && metaWithEnv.env) {
      const config = {
        apiKey: metaWithEnv.env.VITE_FIREBASE_API_KEY as string,
        authDomain: metaWithEnv.env.VITE_FIREBASE_AUTH_DOMAIN as string,
        projectId: metaWithEnv.env.VITE_FIREBASE_PROJECT_ID as string,
        storageBucket: metaWithEnv.env.VITE_FIREBASE_STORAGE_BUCKET as string,
        messagingSenderId: metaWithEnv.env
          .VITE_FIREBASE_MESSAGING_SENDER_ID as string,
        appId: metaWithEnv.env.VITE_FIREBASE_APP_ID as string,
      };
      // Only initialize if config keys allow (simple check)
      if (config.apiKey) {
        return initializeFirebase(config);
      }
    }
  } catch {
    // Ignore error if import.meta is accessed where not allowed or fields missing
  }

  // If we reach here, it means we couldn't auto-initialize.
  // The consuming app MUST call initializeFirebase first.
  // We return a dummy or undefined here, but ideally the app crashes if used before init.
  // For now, let's look for existing apps.
  if (getApps().length) {
    return getAuth(getApp());
  }

  throw new Error(
    "Firebase not initialized. Call initializeFirebase(config) first."
  );
};
