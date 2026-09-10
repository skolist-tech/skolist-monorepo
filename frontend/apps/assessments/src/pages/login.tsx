import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LoginPage as AuthLoginPage, useAuth } from "@skolist/auth";

export function LoginPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from =
    (location.state as { from?: { pathname: string } })?.from?.pathname || "/";
  const isPhoneAvailable =
    (import.meta.env.VITE_PHONE_SMS_AVAILABLE || "false").toLowerCase() ===
    "true";

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  return (
    <AuthLoginPage
      variant="simple"
      title="Assessments"
      productTagline="Sign in to take or create tests"
      onSuccess={() => navigate(from, { replace: true })}
      apiUrl={import.meta.env.VITE_FASTAPI_URL}
      enabledMethods={["phone", "google", "email"]}
      isPhoneAvailable={isPhoneAvailable}
    />
  );
}
