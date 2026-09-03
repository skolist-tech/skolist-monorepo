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
  onStart,
}: {
  test: TestSummary;
  onStart: (testId: string) => void;
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
        <Button onClick={() => onStart(test.id)}>
          {attempt?.status === "in_progress" ? "Continue" : "Start"}
        </Button>
      </CardContent>
    </Card>
  );
}
