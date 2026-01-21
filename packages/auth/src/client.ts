import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CookieOptions } from "@supabase/ssr";

let supabaseClient: SupabaseClient | null = null;

/**
 * Get environment variables for Supabase
 * Supports both VITE_ prefix (for Vite apps) and fallback
 */
function getSupabaseConfig() {
  // Try VITE_ prefix first (Vite apps)
  const url =
    (typeof import.meta !== "undefined" &&
      (import.meta as unknown as { env?: Record<string, string> }).env
        ?.VITE_SUPABASE_URL) ||
    "";
  const anonKey =
    (typeof import.meta !== "undefined" &&
      (import.meta as unknown as { env?: Record<string, string> }).env
        ?.VITE_SUPABASE_ANON_KEY) ||
    "";
  const cookieDomain =
    (typeof import.meta !== "undefined" &&
      (import.meta as unknown as { env?: Record<string, string> }).env
        ?.VITE_COOKIE_DOMAIN) ||
    "";

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
