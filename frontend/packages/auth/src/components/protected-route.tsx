import { type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Spinner } from "@skolist/ui";
import { useAuth } from "../context";

interface ProtectedRouteProps {
  children: ReactNode;
  /**
   * Path to redirect to if not authenticated
   * @default "/login"
   */
  redirectTo?: string;
  /**
   * Show loading spinner while checking auth
   * @default true
   */
  showLoader?: boolean;
}

/**
 * Wrapper component that protects routes from unauthenticated access
 * Redirects to login page if user is not authenticated
 */
export function ProtectedRoute({
  children,
  redirectTo = "/login",
  showLoader = true,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (isLoading) {
    if (!showLoader) {
      return null;
    }
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    // Save the attempted URL for redirecting after login
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Render protected content
  return <>{children}</>;
}
