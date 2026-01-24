import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LoginPage as AuthLoginPage, useAuth } from "@skolist/auth";

export function LoginPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect to home if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  return (
    <AuthLoginPage
      title="Welcome to Skolist"
      description="Sign in to access AI Paper Generator and AI Tutor"
      onSuccess={() => navigate("/")}
      logoUrl=""
    />
  );
}
