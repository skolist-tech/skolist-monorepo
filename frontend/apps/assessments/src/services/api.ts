import { getSupabaseClient } from "@skolist/auth";

const API_URL = import.meta.env.VITE_FASTAPI_URL;

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function detailMessage(body: unknown, fallback: string): string {
  if (body && typeof body === "object" && "detail" in body) {
    const detail = (body as { detail: unknown }).detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail))
      return detail.map((item) => JSON.stringify(item)).join("; ");
  }
  return fallback;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const {
    data: { session },
  } = await getSupabaseClient().auth.getSession();
  const token = session?.access_token;
  if (!token) {
    throw new Error("User not authenticated");
  }

  const response = await fetch(`${API_URL}/api/v1/assessment${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(
      detailMessage(body, response.statusText),
      response.status
    );
  }
  return body as T;
}
