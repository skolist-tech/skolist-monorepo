import { getSupabaseClient } from "@skolist/auth";
import { ApiError } from "./api";

const API_URL = import.meta.env.VITE_FASTAPI_URL;

type LoginResponse = {
  access_token: string;
  refresh_token: string;
};

function detailMessage(body: unknown, fallback: string): string {
  if (body && typeof body === "object" && "detail" in body) {
    const detail = (body as { detail: unknown }).detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      return detail
        .map((item) =>
          item && typeof item === "object" && "msg" in item
            ? String((item as { msg: unknown }).msg)
            : JSON.stringify(item)
        )
        .join("; ");
    }
  }
  return fallback;
}

export async function signInWithOrganisation(input: {
  email: string;
  password: string;
  organisationCode: string;
}): Promise<void> {
  const response = await fetch(`${API_URL}/api/v1/assessment/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: input.email,
      password: input.password,
      organisation_code: input.organisationCode,
    }),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(
      detailMessage(body, "Could not sign in"),
      response.status
    );
  }

  const session = body as LoginResponse;
  const { error } = await getSupabaseClient().auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });
  if (error) {
    throw new ApiError(error.message, 401);
  }
}
