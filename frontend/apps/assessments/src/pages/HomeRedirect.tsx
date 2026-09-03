import { Navigate } from "react-router-dom";
import { useActor } from "@/hooks/useActor";

export function HomeRedirect() {
  const { actor, loading, error } = useActor();

  if (loading) {
    return <p className="text-muted-foreground">Loading…</p>;
  }
  if (error || !actor) {
    return (
      <p className="text-destructive">{error || "Could not load profile"}</p>
    );
  }
  if (actor.role === "teacher") {
    return <Navigate to="/teacher/tests" replace />;
  }
  if (actor.role === "student") {
    return <Navigate to="/student/tests" replace />;
  }
  return (
    <p className="text-muted-foreground">
      This account ({actor.user_type || "unknown"}) cannot use Assessments.
    </p>
  );
}
