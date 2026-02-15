import type { User, Session } from "@supabase/supabase-js";

export type AuthUser = User;
export type AuthSession = Session;

export interface SignInWithEmailParams {
  email: string;
  password: string;
}

export interface SignUpWithEmailParams {
  email: string;
  password: string;
  name: string;
  options?: {
    emailRedirectTo?: string;
  };
}

export interface SignInWithOAuthParams {
  provider: "google";
  options?: {
    redirectTo?: string;
  };
}

export interface SignInWithPhoneParams {
  phone: string;
  name: string;
}

export interface VerifyOtpParams {
  phone: string;
  token: string;
  type: "sms";
}
