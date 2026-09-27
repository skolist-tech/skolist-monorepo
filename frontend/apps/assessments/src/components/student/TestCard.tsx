import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@skolist/ui";
import type { TestSummary } from "@/types/assessment";

export function TestCard({
  test,
  starting = false,
  onViewAttempts,
  onStartAttempt,
}: {
  test: TestSummary;
  starting?: boolean;
  onViewAttempts: (testId: string) => void;
  onStartAttempt: (testId: string) => void;
}) {
  const attempt = test.latest_attempt;
  return (
    <Card>
      <CardHeader>
        <CardTitle>{test.name}</CardTitle>
        <CardDescription>
          {test.exam_type} · {test.duration_minutes} min
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{test.description}</p>
        {attempt ? (
          <p className="text-sm">Latest attempt: {attempt.status}</p>
        ) : (
          <p className="text-sm">No attempt yet</p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => onViewAttempts(test.id)}>
            View Past Attempts
          </Button>
          <Button
            disabled={!test.can_start || starting}
            onClick={() => onStartAttempt(test.id)}
          >
            Start New Attempt
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
