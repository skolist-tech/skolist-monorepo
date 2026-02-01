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
    if (typeof import.meta !== "undefined" && (import.meta as any).env) {
      const config = {
        apiKey: (import.meta as any).env.VITE_FIREBASE_API_KEY,
        authDomain: (import.meta as any).env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: (import.meta as any).env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: (import.meta as any).env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: (import.meta as any).env
          .VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: (import.meta as any).env.VITE_FIREBASE_APP_ID,
      };
      // Only initialize if config keys allow (simple check)
      if (config.apiKey) {
        return initializeFirebase(config);
      }
    }
  } catch (e) {
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
