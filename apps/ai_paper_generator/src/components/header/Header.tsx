import { Logo } from "./Logo";
import { PaneNavigationButtons } from "./PaneNavigationButtons";
import { UserProfile } from "./UserProfile";
import { ModeToggle } from "./ModeToggle";

import { useUserCredits } from "../../hooks/useUserCredits";

export function Header() {
  const { credits } = useUserCredits();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-6">
        <div className="flex flex-1 items-center">
          <Logo />
        </div>
        <PaneNavigationButtons />
        <div className="flex flex-1 items-center justify-end gap-2">
          {credits !== null && (
            <div className="flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
              <span>Credits: {credits}</span>
            </div>
          )}
          <ModeToggle />
          <UserProfile />
        </div>
      </div>
    </header>
  );
}
