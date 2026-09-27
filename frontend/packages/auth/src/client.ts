import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CookieOptions } from "@supabase/ssr";

const AUTH_COOKIE_PATTERN = /^sb-.*auth-token/;

const authClearedListeners = new Set<() => void>();
let clearLocalAuthInFlight: Promise<void> | null = null;

function isAuthCookieName(name: string): boolean {
  return AUTH_COOKIE_PATTERN.test(name);
}

function expireCookie(name: string, domain?: string) {
  if (typeof document === "undefined") return;

  const attrs = [
    `${name}=`,
    "Path=/",
    "Max-Age=0",
    "Expires=Thu, 01 Jan 1970 00:00:01 GMT",
  ];
  if (domain) attrs.push(`Domain=${domain}`);
  if (typeof window !== "undefined" && window.location.protocol === "https:") {
    attrs.push("Secure");
  }
  document.cookie = attrs.join("; ");
}

function writeCookie(
  name: string,
  value: string,
  options: CookieOptions | undefined,
  domain?: string
) {
  const isDelete = value === "" || options?.maxAge === 0;
  if (isDelete) {
    expireCookie(name, domain);
    return;
  }

  let cookieString = `${name}=${value}`;
  if (domain) cookieString += `; Domain=${domain}`;
  cookieString += `; Path=${options?.path ?? "/"}`;
  cookieString += `; SameSite=${options?.sameSite ?? "Lax"}`;
  if (typeof window !== "undefined" && window.location.protocol === "https:") {
    cookieString += "; Secure";
  }
  if (options?.maxAge != null) {
    cookieString += `; Max-Age=${options.maxAge}`;
  }
  document.cookie = cookieString;
}

function cookieNames(): string[] {
  if (typeof document === "undefined" || !document.cookie) return [];
  return document.cookie
    .split("; ")
    .map((cookie) => cookie.split("=")[0] ?? "");
}

export function clearAuthCookies() {
  if (typeof document === "undefined") return;

  const { cookieDomain } = getSupabaseConfig();
  const names = new Set(cookieNames());
  names.forEach((name) => {
    if (!name || !isAuthCookieName(name)) return;
    expireCookie(name);
    if (cookieDomain) expireCookie(name, cookieDomain);
  });
}

export function subscribeLocalAuthCleared(listener: () => void) {
  authClearedListeners.add(listener);
  return () => {
    authClearedListeners.delete(listener);
  };
}

function notifyLocalAuthCleared() {
  authClearedListeners.forEach((listener) => listener());
}

/**
 * Drop the browser session even when the refresh token is already dead.
 * Supabase signOut can return early on a session error and leave cookies in place.
 */
export async function clearLocalAuth(): Promise<void> {
  if (clearLocalAuthInFlight) return clearLocalAuthInFlight;

  clearLocalAuthInFlight = (async () => {
    try {
      if (supabaseClient) {
        await supabaseClient.auth.signOut({ scope: "local" });
      }
    } catch {
      // The stored token may already be invalid; cookies still need to go.
    }
    clearAuthCookies();
    notifyLocalAuthCleared();
  })().finally(() => {
    clearLocalAuthInFlight = null;
  });

  return clearLocalAuthInFlight;
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
          const isDelete = value === "" || options?.maxAge === 0;
          if (isDelete) {
            writeCookie(name, "", options);
            if (cookieDomain) writeCookie(name, "", options, cookieDomain);
            return;
          }
          writeCookie(name, value, options, cookieDomain || undefined);
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
