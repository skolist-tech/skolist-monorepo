"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import type { AuthError, Provider } from "@supabase/supabase-js";
import { getSupabaseClient } from "./client";
import type { AuthUser, AuthSession } from "./types";

export interface AuthContextValue {
  user: AuthUser | null;
  session: AuthSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Email auth
  signInWithEmail: (
    email: string,
    password: string
  ) => Promise<{ error: AuthError | null }>;
  signUpWithEmail: (
    email: string,
    password: string,
    name: string
  ) => Promise<{ error: AuthError | null }>;

  // OAuth
  signInWithOAuth: (provider: Provider) => Promise<{ error: AuthError | null }>;

  // Phone auth
  signInWithPhone: (
    phone: string,
    name: string
  ) => Promise<{ error: AuthError | null }>;
  verifyOtp: (
    phone: string,
    token: string
  ) => Promise<{ error: AuthError | null }>;

  // Sign out
  signOut: () => Promise<{ error: AuthError | null }>;

  // Password reset
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;

  // User check
  checkUserExists: (phone: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
  apiUrl?: string;
}

export function AuthProvider({
  children,
  apiUrl = "http://localhost:8080",
}: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Memoize supabase client to ensure stable reference
  const supabase = useMemo(() => getSupabaseClient(), []);

  // Initialize auth state
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    },
    [supabase]
  );

  const signUpWithEmail = useCallback(
    async (email: string, password: string, name: string) => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            name: name,
          },
        },
      });
      return { error };
    },
    [supabase]
  );

  const signInWithOAuth = useCallback(
    async (provider: Provider) => {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin,
        },
      });
      return { error };
    },
    [supabase]
  );

  const signInWithPhone = useCallback(
    async (phone: string, name: string) => {
      const { error } = await supabase.auth.signInWithOtp({
        phone,
        options: {
          data: {
            name: name,
          },
        },
      });
      return { error };
    },
    [supabase]
  );

  const verifyOtp = useCallback(
    async (phone: string, token: string) => {
      const { error } = await supabase.auth.verifyOtp({
        phone,
        token,
        type: "sms",
      });
      return { error };
    },
    [supabase]
  );

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  }, [supabase]);

  const resetPassword = useCallback(
    async (email: string) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      return { error };
    },
    [supabase]
  );

  const checkUserExists = useCallback(
    async (phone: string) => {
      try {
        // Use the apiUrl from props
        const response = await fetch(
          `${apiUrl}/api/v1/security/check_phone_number`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ phone }),
          }
        );

        if (!response.ok) {
          return false;
        }

        const data = await response.json();
        return data.exists;
      } catch (error) {
        console.error("Error checking user existence:", error);
        return false;
      }
    },
    [apiUrl]
  );

  const value: AuthContextValue = {
    user,
    session,
    isLoading,
    isAuthenticated: !!user,
    signInWithEmail,
    signUpWithEmail,
    signInWithOAuth,
    signInWithPhone,
    verifyOtp,
    signOut,
    resetPassword,
    checkUserExists,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
