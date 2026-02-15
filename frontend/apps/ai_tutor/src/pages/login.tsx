import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LoginPage as AuthLoginPage, useAuth } from "@skolist/auth";

export function LoginPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get the page user was trying to access
  const from =
    (location.state as { from?: { pathname: string } })?.from?.pathname || "/";

  // Redirect to intended page if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  return (
    <AuthLoginPage
      title="AI Tutor"
      description="Sign in to start your personalized learning journey"
      onSuccess={() => navigate(from, { replace: true })}
    />
  );
}
