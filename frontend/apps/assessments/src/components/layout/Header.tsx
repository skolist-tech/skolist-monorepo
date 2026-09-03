import { Link, Outlet } from "react-router-dom";
import { UserMenu } from "@skolist/auth";
import { useActor } from "@/hooks/useActor";

export function Header() {
  const { actor } = useActor();
  const isTeacher = actor?.role === "teacher";

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-xl font-bold text-primary">
            Assessments
          </Link>
          {isTeacher ? (
            <nav className="hidden items-center gap-4 md:flex">
              <Link
                to="/teacher/tests"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Tests
              </Link>
            </nav>
          ) : (
            <nav className="hidden items-center gap-4 md:flex">
              <Link
                to="/student/tests"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                My tests
              </Link>
            </nav>
          )}
        </div>
        <UserMenu />
      </div>
    </header>
  );
}

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-6">
        <Outlet />
      </main>
    </div>
  );
}

export function TeacherNav() {
  return (
    <Link
      to="/teacher/tests"
      className="text-sm text-muted-foreground hover:text-foreground"
    >
      Tests
    </Link>
  );
}

export function StudentNav() {
  return (
    <Link
      to="/student/tests"
      className="text-sm text-muted-foreground hover:text-foreground"
    >
      My tests
    </Link>
  );
}
