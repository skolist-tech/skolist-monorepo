import { Link } from "react-router-dom";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@skolist/ui";
import type { TestSummary } from "@/types/assessment";

function TrashIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

export function TeacherTestCard({
  test,
  onDelete,
}: {
  test: TestSummary;
  onDelete: (test: TestSummary) => void;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <CardTitle className="pr-2">{test.name}</CardTitle>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Delete"
          onClick={() => onDelete(test)}
        >
          <TrashIcon />
        </Button>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {test.exam_type} · {test.status}
        </p>
        <Button asChild variant="outline">
          <Link to={`/teacher/tests/${test.id}`}>Open</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
