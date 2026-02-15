/**
 * Shared authentication for Skolist frontend apps
 * Provides Supabase auth with cross-domain cookie storage
 */

// Client
export {
  createClient,
  getSupabaseClient,
  getCurrentUserId,
  isAuthenticated,
} from "./client";

export { initializeFirebase } from "./firebase";

// Context & Hooks
export { AuthProvider, useAuth, type AuthContextValue } from "./context";

// Components
export { LoginPage } from "./components/login-page/index";
export { ProtectedRoute } from "./components/protected-route";
export { UserMenu } from "./components/user-menu";
export { AuthButton } from "./components/auth-button";

// Types
export type {
  AuthUser,
  AuthSession,
  SignInWithEmailParams,
  SignInWithOAuthParams,
  SignInWithPhoneParams,
} from "./types";

// Schemas
export {
  emailLoginSchema,
  phoneLoginSchema,
  type EmailLoginFormData,
  type PhoneLoginFormData,
} from "./schemas";
