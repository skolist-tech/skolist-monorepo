import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useActor } from "@/hooks/useActor";
import type { UserRole } from "@/types/assessment";

export function RoleRoute({
  role,
  children,
}: {
  role: UserRole;
  children: ReactNode;
}) {
  const { actor, loading, error } = useActor();

  if (loading) {
    return <p className="text-muted-foreground">Loading…</p>;
  }
  if (error || !actor) {
    return (
      <p className="text-destructive">{error || "Could not load profile"}</p>
    );
  }
  if (actor.role !== role) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
