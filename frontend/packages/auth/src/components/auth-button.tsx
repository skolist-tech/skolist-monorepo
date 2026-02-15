import { Link } from "react-router-dom";
import { Button, LogIn } from "@skolist/ui";
import { useAuth } from "../context";
import { UserMenu } from "./user-menu";

interface AuthButtonProps {
  /**
   * Path to login page
   * @default "/login"
   */
  loginPath?: string;
  /**
   * Show settings option in user menu
   * @default true
   */
  showSettings?: boolean;
  /**
   * Callback when settings is clicked
   */
  onSettingsClick?: () => void;
}

/**
 * Smart auth button that shows login button or user menu
 * based on authentication state
 */
export function AuthButton({
  loginPath = "/login",
  showSettings = true,
  onSettingsClick,
}: AuthButtonProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <div className="bg-muted h-4 w-4 animate-pulse rounded-full" />
      </Button>
    );
  }

  if (isAuthenticated) {
    return (
      <UserMenu showSettings={showSettings} onSettingsClick={onSettingsClick} />
    );
  }

  return (
    <Button asChild variant="default">
      <Link to={loginPath}>
        <LogIn className="mr-2 h-4 w-4" />
        Sign In
      </Link>
    </Button>
  );
}
