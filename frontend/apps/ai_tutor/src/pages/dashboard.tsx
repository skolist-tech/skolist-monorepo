import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@skolist/ui";
import { useAuth } from "@skolist/auth";

export function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome to AI Tutor</h1>
        <p className="text-muted-foreground">
          Hello, {user?.email || user?.phone || "User"}! I'm here to help you
          learn.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Start Learning</CardTitle>
            <CardDescription>
              Ask me anything and I'll help you understand
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Coming soon - Interactive AI chat interface
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>My Sessions</CardTitle>
            <CardDescription>
              Review your previous learning sessions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Coming soon - Session history and insights
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subjects</CardTitle>
            <CardDescription>Browse subjects and topics</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Coming soon - Organized learning paths
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
