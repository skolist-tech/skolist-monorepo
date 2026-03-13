import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LoginPage as AuthLoginPage, useAuth } from "@skolist/auth";

export function LoginPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const mode = params.get("mode");
  const redirectParam = params.get("redirect");

  // Get the page user was trying to access
  const fromState = (
    location.state as {
      from?: { pathname?: string; search?: string; hash?: string };
    }
  )?.from;
  const from =
    redirectParam ||
    (fromState?.pathname
      ? `${fromState.pathname}${fromState.search || ""}${fromState.hash || ""}`
      : "/");
  const isTestLoginMode = mode === "test";

  // Redirect to intended page if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  return (
    <AuthLoginPage
      onSuccess={() => navigate(from, { replace: true })}
      apiUrl={import.meta.env.VITE_FASTAPI_URL}
      isPhoneAvailable={
        (import.meta.env.VITE_PHONE_SMS_AVAILABLE || "false").toLowerCase() ===
        "true"
      }
      showLeftPanel={!isTestLoginMode}
      productTagline={
        isTestLoginMode ? "To continue your test" : "To use the QGEN"
      }
      defaultToSignIn={isTestLoginMode}
      hideSignUpToggle={isTestLoginMode}
    />
  );
}
