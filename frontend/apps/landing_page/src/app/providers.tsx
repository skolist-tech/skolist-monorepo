"use client";

import { AuthProvider } from "@skolist/auth";
import { Toaster } from "@skolist/ui";

import { initializeFirebase } from "@skolist/auth";
import { useEffect } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    try {
      const firebaseConfig = {
        apiKey: process.env.NEXT_PUBLIC_VITE_FIREBASE_API_KEY!,
        authDomain: process.env.NEXT_PUBLIC_VITE_FIREBASE_AUTH_DOMAIN!,
        projectId: process.env.NEXT_PUBLIC_VITE_FIREBASE_PROJECT_ID!,
        storageBucket: process.env.NEXT_PUBLIC_VITE_FIREBASE_STORAGE_BUCKET!,
        messagingSenderId:
          process.env.NEXT_PUBLIC_VITE_FIREBASE_MESSAGING_SENDER_ID!,
        appId: process.env.NEXT_PUBLIC_VITE_FIREBASE_APP_ID!,
      };

      if (firebaseConfig.apiKey) {
        initializeFirebase(firebaseConfig);
      }
    } catch (e) {
      console.error("Failed to initialize Firebase:", e);
    }
  }, []);

  return (
    <AuthProvider apiUrl={process.env.NEXT_PUBLIC_VITE_FASTAPI_URL}>
      {children}
      <Toaster />
    </AuthProvider>
  );
}
