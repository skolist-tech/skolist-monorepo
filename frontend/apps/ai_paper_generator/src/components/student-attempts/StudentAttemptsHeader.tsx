import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@skolist/ui";
import { UserProfile } from "../header/UserProfile";
import { useTheme } from "../../context/ThemeProvider";

export function StudentAttemptsHeader() {
  const { theme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4 md:h-16 md:px-6">
        <div className="flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-xl font-bold tracking-tight">My Test Attempts</h1>
        </div>

        <UserProfile
          showThemeToggle={true}
          theme={theme}
          onThemeChange={setTheme}
        />
      </div>
    </header>
  );
}
