import { Link } from "react-router-dom";
import { UserMenu } from "@skolist/auth";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-primary">AI Tutor</span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <Link
              to="/"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Chat
            </Link>
            {/* Add more nav items here */}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="https://skolist.com"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Back to Skolist
          </a>
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
