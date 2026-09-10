import { Link } from "react-router-dom";
import { Button } from "@skolist/ui";

export function BackLink({
  to,
  children = "Back",
}: {
  to: string;
  children?: string;
}) {
  return (
    <Button asChild variant="outline" size="sm">
      <Link to={to}>{children}</Link>
    </Button>
  );
}
