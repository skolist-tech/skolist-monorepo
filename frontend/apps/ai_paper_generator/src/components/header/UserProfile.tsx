import { UserMenu } from "@skolist/auth";

interface UserProfileProps {
  showThemeToggle?: boolean;
  theme?: "light" | "dark" | "system";
  onThemeChange?: (theme: "light" | "dark" | "system") => void;
}

export function UserProfile({
  showThemeToggle,
  theme,
  onThemeChange,
}: UserProfileProps) {
  return (
    <UserMenu
      showThemeToggle={showThemeToggle}
      theme={theme}
      onThemeChange={onThemeChange}
    />
  );
}
