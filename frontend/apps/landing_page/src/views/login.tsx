"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoginPage as AuthLoginPage, useAuth } from "@skolist/auth";

export function LoginPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  // Redirect to home if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  const envPhone = process.env.NEXT_PUBLIC_VITE_PHONE_SMS_AVAILABLE;
  const isPhoneAvailable = (envPhone || "false").toLowerCase() !== "false";
  const apiUrl = process.env.NEXT_PUBLIC_VITE_FASTAPI_URL;

  return (
    <AuthLoginPage
      title="Welcome to Skolist"
      description="Sign in to access AI Paper Generator and AI Tutor"
      onSuccess={() => router.push("/")}
      logoUrl=""
      isPhoneAvailable={isPhoneAvailable}
      apiUrl={apiUrl}
    />
  );
}
