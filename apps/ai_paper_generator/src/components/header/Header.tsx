import { Logo } from "./Logo";
import { PaneNavigationButtons } from "./PaneNavigationButtons";
import { UserProfile } from "./UserProfile";
import { ModeToggle } from "./ModeToggle";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@skolist/ui";
import { Menu, Sparkles, FileEdit, BarChart3, ChevronDown } from "lucide-react";
import { usePaneContext } from "../../context/PaneContext";
import { useTheme } from "../theme-provider";
import type { PaneType } from "../../types/pane";

import { useUserCredits } from "../../hooks/useUserCredits";

interface HeaderProps {
  onMenuClick?: () => void;
}

// Pane config for dropdown
const panes: { type: PaneType; label: string; icon: React.ReactNode }[] = [
  {
    type: "generation",
    label: "Generate",
    icon: <Sparkles className="h-4 w-4" />,
  },
  { type: "draft", label: "Draft", icon: <FileEdit className="h-4 w-4" /> },
  {
    type: "analysis",
    label: "Analysis",
    icon: <BarChart3 className="h-4 w-4" />,
  },
];

export function Header({ onMenuClick }: HeaderProps) {
  const { credits } = useUserCredits();
  const { activePane, setActivePane } = usePaneContext();
  const { theme, setTheme } = useTheme();

  const currentPane = panes.find((p) => p.type === activePane) ?? panes[0]!;

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

        {/* Mobile pane dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 md:hidden">
              {currentPane.icon}
              <span>{currentPane.label}</span>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center">
            {panes.map((pane) => (
              <DropdownMenuItem
                key={pane.type}
                onClick={() => setActivePane(pane.type)}
                className={activePane === pane.type ? "bg-accent" : ""}
              >
                {pane.icon}
                <span className="ml-2">{pane.label}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

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
