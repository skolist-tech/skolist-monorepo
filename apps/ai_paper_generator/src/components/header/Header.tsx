import { useEffect } from "react";
import { Logo } from "./Logo";
import { PaneNavigationButtons } from "./PaneNavigationButtons";
import { UserProfile } from "./UserProfile";
// import { ModeToggle } from "./ModeToggle";
import { Button, useToast } from "@skolist/ui";
import { Menu } from "lucide-react";
import { useTheme } from "../../context/ThemeProvider";

import { useUserCredits } from "../../hooks/useUserCredits";

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { credits } = useUserCredits();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();

  useEffect(() => {
    const handleCreditsExhausted = () => {
      toast({
        title: "Credits Exhausted",
        description: "You have 0 credits. Please recharge to continue.",
        variant: "destructive",
      });
    };

    window.addEventListener("credits-exhausted", handleCreditsExhausted);
    return () => {
      window.removeEventListener("credits-exhausted", handleCreditsExhausted);
    };
  }, [toast]);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4 md:h-16 md:px-6">
        <div className="flex flex-1 items-center gap-2">
          {/* Hamburger menu - mobile only */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Logo />
        </div>

        {/* Mobile pane dropdown - REMOVED */}

        {/* Desktop pane navigation */}
        <div className="hidden md:block">
          <PaneNavigationButtons />
        </div>

        <div className="flex flex-1 items-center justify-end gap-2">
          {credits !== null && (
            <div className="flex items-center rounded-full border border-primary/20 bg-primary/10 px-2 py-1 text-xs font-medium text-primary md:px-3 md:py-1.5 md:text-sm">
              <span className="hidden sm:inline">Credits: </span>
              <span>{credits}</span>
            </div>
          )}
          {/* Desktop only: Mode toggle */}
          {/* <div className="hidden md:block">
            <ModeToggle />
          </div> */}
          {/* Mobile: theme toggle is in UserProfile menu */}
          <div className="md:hidden">
            <UserProfile
              showThemeToggle
              theme={theme}
              onThemeChange={setTheme}
            />
          </div>
          {/* Desktop: UserProfile without theme toggle */}
          <div className="hidden md:block">
            <UserProfile />
          </div>
        </div>
      </div>
    </header>
  );
}
