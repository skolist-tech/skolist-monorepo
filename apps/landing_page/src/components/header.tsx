import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@skolist/ui";
import { useAuth, UserMenu } from "@skolist/auth";

export function Header() {
  const { isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="flex flex-1 items-center">
          <Link to="/" className="flex items-center">
            <img src="/logo.png" alt="Skolist Logo" className="h-10" />
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-8 md:flex">
          <Link
            to="/"
            className="text-sm font-medium transition-colors hover:text-foreground"
          >
            Home
          </Link>
          <Link
            to="/vision"
            className="text-sm font-medium transition-colors hover:text-foreground"
          >
            Vision
          </Link>
          <Link
            to="/product"
            className="text-sm font-medium transition-colors hover:text-foreground"
          >
            Product
          </Link>
          <Link
            to="/contact"
            className="text-sm font-medium transition-colors hover:text-foreground"
          >
            Contact
          </Link>
        </nav>

        <div className="hidden flex-1 items-center justify-end md:flex">
          {isAuthenticated ? (
            <UserMenu />
          ) : (
            <Button asChild>
              <Link to="/login">Sign Up</Link>
            </Button>
          )}
        </div>

        {/* Mobile Actions and Menu Button */}
        <div className="flex flex-1 items-center justify-end gap-4 md:hidden">
          {isAuthenticated ? (
            <UserMenu />
          ) : (
            <Button asChild size="sm">
              <Link to="/login">Sign Up</Link>
            </Button>
          )}

          <button
            className="p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="border-t bg-background md:hidden">
          <nav className="container flex flex-col gap-4 py-4">
            <Link
              to="/"
              className="py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/vision"
              className="py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              Vision
            </Link>
            <Link
              to="/product"
              className="py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              Product
            </Link>
            <Link
              to="/contact"
              className="py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              Contact
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
