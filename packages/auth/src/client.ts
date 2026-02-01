import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CookieOptions } from "@supabase/ssr";

/**
 * Cleanup legacy cookies from previous Supabase projects or incorrect domains
 * This addresses issues where old session tokens cause authentication failures
 */
const cleanupSubdomainAuth = () => {
  if (typeof window === "undefined") return;

  const cookieNames = [
    "sb-xgugcyguhzfevxvjdgbm-auth-token",
    "sb-xgugcyguhzfevxvjdgbm-auth-token-code-verifier",
    "sb-xgugcyguhzfevxvjdgbm-auth-token.0",
    "sb-xgugcyguhzfevxvjdgbm-auth-token.1",
  ];

  cookieNames.forEach((name) => {
    // Force delete by setting expiry to 1970
    document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
    console.log(`${name}=; Path=/;  Expires=Thu, 01 Jan 1970 00:00:01 GMT;`);
  });
};

// Execute cleanup immediately on module load if in browser
if (typeof window !== "undefined") {
  cleanupSubdomainAuth();
}

let supabaseClient: SupabaseClient | null = null;

/**
 * Get environment variables for Supabase
 * Supports both VITE_ prefix (for Vite apps) and NEXT_PUBLIC_ prefix (for Next.js apps)
 */
function getSupabaseConfig() {
  // Try VITE_ prefix first (Vite apps)
  let url =
    (typeof import.meta !== "undefined" &&
      (import.meta as unknown as { env?: Record<string, string> }).env
        ?.VITE_SUPABASE_URL) ||
    "";
  let anonKey =
    (typeof import.meta !== "undefined" &&
      (import.meta as unknown as { env?: Record<string, string> }).env
        ?.VITE_SUPABASE_ANON_KEY) ||
    "";
  let cookieDomain =
    (typeof import.meta !== "undefined" &&
      (import.meta as unknown as { env?: Record<string, string> }).env
        ?.VITE_COOKIE_DOMAIN) ||
    "";

  // Fallback to NEXT_PUBLIC_ prefix (Next.js apps)
  if (!url && typeof process !== "undefined" && process.env) {
    url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  }
  if (!anonKey && typeof process !== "undefined" && process.env) {
    anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  }
  if (!cookieDomain && typeof process !== "undefined" && process.env) {
    cookieDomain = process.env.NEXT_PUBLIC_COOKIE_DOMAIN || "";
  }

  return { url, anonKey, cookieDomain };
}

/**
 * Create a Supabase client configured for browser usage
 * Uses cookie storage for cross-subdomain authentication
 */
export function createClient(): SupabaseClient {
  const { url, anonKey, cookieDomain } = getSupabaseConfig();

  if (!url || !anonKey) {
    console.warn(
      "Supabase URL or Anon Key not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables."
    );
  }

  return createBrowserClient(url, anonKey, {
    cookies: {
      // Custom cookie options for cross-subdomain auth
      getAll() {
        if (typeof document === "undefined") return [];
        return document.cookie.split("; ").map((cookie) => {
          const [name, ...rest] = cookie.split("=");
          return {
            name: name ?? "",
            value: rest.join("=") ?? "",
          };
        });
      },
      setAll(
        cookiesToSet: {
          name: string;
          value: string;
          options?: CookieOptions;
        }[]
      ) {
        if (typeof document === "undefined") return;

        cookiesToSet.forEach(({ name, value, options }) => {
          let cookieString = `${name}=${value}`;

          if (cookieDomain) {
            cookieString += `; Domain=${cookieDomain}`;
          }

          cookieString += `; Path=${options?.path ?? "/"}`;
          cookieString += `; SameSite=${options?.sameSite ?? "Lax"}`;

          if (
            typeof window !== "undefined" &&
            window.location.protocol === "https:"
          ) {
            cookieString += "; Secure";
          }

          if (options?.maxAge) {
            cookieString += `; Max-Age=${options.maxAge}`;
          }

          document.cookie = cookieString;
        });
      },
    },
  });
}

/**
 * Get or create a singleton Supabase client
 * Use this in components to avoid creating multiple clients
 */
export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    supabaseClient = createClient();
  }
  return supabaseClient;
}

export async function isAuthenticated(): Promise<boolean> {
  const client = getSupabaseClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  return !!user;
}

export async function getCurrentUserId(): Promise<string> {
  const client = getSupabaseClient();
  const {
    data: { user },
    error,
  } = await client.auth.getUser();

  if (error || !user) {
    throw new Error("User not authenticated");
  }

  return user.id;
}
