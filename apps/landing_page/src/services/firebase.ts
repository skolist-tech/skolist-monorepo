import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";

/**
 * Get Firebase config from environment variables
 * Supports both VITE_ prefix (for Vite apps) and NEXT_PUBLIC_VITE_ prefix (for Next.js apps)
 */
function getFirebaseConfig() {
  // Try VITE_ prefix first (Vite apps)
  let apiKey =
    (typeof import.meta !== "undefined" &&
      (import.meta as unknown as { env?: Record<string, string> }).env
        ?.VITE_FIREBASE_API_KEY) ||
    "";
  let authDomain =
    (typeof import.meta !== "undefined" &&
      (import.meta as unknown as { env?: Record<string, string> }).env
        ?.VITE_FIREBASE_AUTH_DOMAIN) ||
    "";
  let projectId =
    (typeof import.meta !== "undefined" &&
      (import.meta as unknown as { env?: Record<string, string> }).env
        ?.VITE_FIREBASE_PROJECT_ID) ||
    "";
  let storageBucket =
    (typeof import.meta !== "undefined" &&
      (import.meta as unknown as { env?: Record<string, string> }).env
        ?.VITE_FIREBASE_STORAGE_BUCKET) ||
    "";
  let messagingSenderId =
    (typeof import.meta !== "undefined" &&
      (import.meta as unknown as { env?: Record<string, string> }).env
        ?.VITE_FIREBASE_MESSAGING_SENDER_ID) ||
    "";
  let appId =
    (typeof import.meta !== "undefined" &&
      (import.meta as unknown as { env?: Record<string, string> }).env
        ?.VITE_FIREBASE_APP_ID) ||
    "";

  // Fallback to NEXT_PUBLIC_VITE_ prefix (Next.js apps)
  if (!apiKey && typeof process !== "undefined" && process.env) {
    apiKey = process.env.NEXT_PUBLIC_VITE_FIREBASE_API_KEY || "";
  }
  if (!authDomain && typeof process !== "undefined" && process.env) {
    authDomain = process.env.NEXT_PUBLIC_VITE_FIREBASE_AUTH_DOMAIN || "";
  }
  if (!projectId && typeof process !== "undefined" && process.env) {
    projectId = process.env.NEXT_PUBLIC_VITE_FIREBASE_PROJECT_ID || "";
  }
  if (!storageBucket && typeof process !== "undefined" && process.env) {
    storageBucket = process.env.NEXT_PUBLIC_VITE_FIREBASE_STORAGE_BUCKET || "";
  }
  if (!messagingSenderId && typeof process !== "undefined" && process.env) {
    messagingSenderId =
      process.env.NEXT_PUBLIC_VITE_FIREBASE_MESSAGING_SENDER_ID || "";
  }
  if (!appId && typeof process !== "undefined" && process.env) {
    appId = process.env.NEXT_PUBLIC_VITE_FIREBASE_APP_ID || "";
  }

  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
  };
}

// Firebase configuration object
const firebaseConfig = getFirebaseConfig();

// Check if Firebase is configured
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error(
    "Firebase configuration is missing! Please check your .env file."
  );
  console.error(
    "Required variables: VITE_FIREBASE_API_KEY (or NEXT_PUBLIC_VITE_FIREBASE_API_KEY), VITE_FIREBASE_PROJECT_ID, etc."
  );
}

// Initialize Firebase - use existing app if already initialized
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Get Firestore instance
export const db: Firestore = getFirestore(app);

export default app;
