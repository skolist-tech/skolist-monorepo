import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
  LogOut,
  User,
  Settings,
} from "@skolist/ui";
import { Moon, Sun, Monitor } from "lucide-react";
import { useAuth } from "../context";

interface UserMenuProps {
  /**
   * Show settings option
   * @default true
   */
  showSettings?: boolean;
  /**
   * Callback when settings is clicked
   */
  onSettingsClick?: () => void;
  /**
   * Show theme toggle in menu (for mobile)
   * @default false
   */
  showThemeToggle?: boolean;
  /**
   * Current theme value
   */
  theme?: "light" | "dark" | "system";
  /**
   * Callback when theme changes
   */
  onThemeChange?: (theme: "light" | "dark" | "system") => void;
}

/**
 * Dropdown menu showing user info and logout option
 * Shows avatar with user initials/image
 */
export function UserMenu({
  showSettings = true,
  onSettingsClick,
  showThemeToggle = false,
  theme,
  onThemeChange,
}: UserMenuProps) {
  const { user, signOut } = useAuth();

  if (!user) return null;

  // Get user initials for avatar fallback
  const fullName = user.user_metadata?.name;
  const nameInitials = fullName
    ? fullName
        .split(" ")
        .filter((n: string) => n.length > 0)
        .map((n: string) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "";

  const initials =
    nameInitials ||
    (user.email
      ? user.email.split("@")[0]?.slice(0, 2).toUpperCase()
      : user.phone
        ? user.phone.slice(-2)
        : "U");

  const displayName =
    user.user_metadata?.full_name || user.email || user.phone || "User";

  const avatarUrl = user.user_metadata?.avatar_url;

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            {user.email && (
              <p className="text-muted-foreground text-xs leading-none">
                {user.email}
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        {showSettings && (
          <DropdownMenuItem onClick={onSettingsClick}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
        )}
        {showThemeToggle && onThemeChange && (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              {theme === "dark" ? (
                <Moon className="mr-2 h-4 w-4" />
              ) : theme === "light" ? (
                <Sun className="mr-2 h-4 w-4" />
              ) : (
                <Monitor className="mr-2 h-4 w-4" />
              )}
              <span>Theme</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => onThemeChange("light")}>
                  <Sun className="mr-2 h-4 w-4" />
                  <span>Light</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onThemeChange("dark")}>
                  <Moon className="mr-2 h-4 w-4" />
                  <span>Dark</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onThemeChange("system")}>
                  <Monitor className="mr-2 h-4 w-4" />
                  <span>System</span>
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
