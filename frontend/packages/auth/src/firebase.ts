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

  // Try to auto-initialize from environment variables
  // Uses the same inline import.meta.env access pattern as client.ts
  // (Vite requires direct `import.meta.env.VITE_*` access for static replacement)
  const apiKey =
    (typeof import.meta !== "undefined" &&
      (import.meta as unknown as { env?: Record<string, string> }).env
        ?.VITE_FIREBASE_API_KEY) ||
    "";
  const authDomain =
    (typeof import.meta !== "undefined" &&
      (import.meta as unknown as { env?: Record<string, string> }).env
        ?.VITE_FIREBASE_AUTH_DOMAIN) ||
    "";
  const projectId =
    (typeof import.meta !== "undefined" &&
      (import.meta as unknown as { env?: Record<string, string> }).env
        ?.VITE_FIREBASE_PROJECT_ID) ||
    "";
  const storageBucket =
    (typeof import.meta !== "undefined" &&
      (import.meta as unknown as { env?: Record<string, string> }).env
        ?.VITE_FIREBASE_STORAGE_BUCKET) ||
    "";
  const messagingSenderId =
    (typeof import.meta !== "undefined" &&
      (import.meta as unknown as { env?: Record<string, string> }).env
        ?.VITE_FIREBASE_MESSAGING_SENDER_ID) ||
    "";
  const appId =
    (typeof import.meta !== "undefined" &&
      (import.meta as unknown as { env?: Record<string, string> }).env
        ?.VITE_FIREBASE_APP_ID) ||
    "";

  if (apiKey) {
    return initializeFirebase({
      apiKey,
      authDomain,
      projectId,
      storageBucket,
      messagingSenderId,
      appId,
    });
  }

  // Fallback: check for existing Firebase apps
  if (getApps().length) {
    return getAuth(getApp());
  }

  throw new Error(
    "Firebase not initialized. Call initializeFirebase(config) first."
  );
};
