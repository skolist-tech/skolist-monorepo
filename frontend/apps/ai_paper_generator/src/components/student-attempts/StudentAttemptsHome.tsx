import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button, Card, CardContent } from "@skolist/ui";
import {
  studentAttemptApiService,
  type StudentAttemptRow,
} from "../../services/studentAttemptApiService";

export function StudentAttemptsHome() {
  const [attempts, setAttempts] = useState<StudentAttemptRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await studentAttemptApiService.getMyAttempts();
        setAttempts(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load attempts"
        );
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <h2 className="text-xl font-bold tracking-tight">
        All Attempted Tests ({attempts.length})
      </h2>

      {isLoading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : attempts.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground">
          No attempted tests found yet.
        </div>
      ) : (
        <div className="space-y-4">
          {attempts.map((attempt) => {
            const testName = attempt.test?.title || "Untitled Test";
            const submittedAt = attempt.submitted_at
              ? new Date(attempt.submitted_at).toLocaleString([], {
                  year: "numeric",
                  month: "numeric",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })
              : "Not submitted";
            const marksText =
              attempt.total_marks_obtained !== null &&
              attempt.total_marks_obtained !== undefined
                ? `${attempt.total_marks_obtained}${attempt.total_marks_possible ? ` / ${attempt.total_marks_possible}` : ""}`
                : "Pending";

            return (
              <Card
                key={attempt.id}
                className="border border-border/70 shadow-sm"
              >
                <CardContent className="space-y-4 p-4">
                  <div className="space-y-1">
                    <h3 className="line-clamp-2 text-base font-semibold leading-snug text-foreground">
                      {testName}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Submitted at: {submittedAt}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Attempt Number: #{attempt.attempt_number}
                    </p>
                    <p className="text-sm font-medium text-foreground text-green-900">
                      Marks: {marksText}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link to={`/my-attempts/attempt/${attempt.id}`}>
                      <Button variant="outline" size="sm">
                        {/* <Eye className="mr-2 h-4 w-4" /> */}
                        View Attempt
                      </Button>
                    </Link>

                    <Link
                      to={`/my-attempts/attempt/${attempt.id}?tab=weak-concepts`}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800"
                      >
                        {/* <Eye className="mr-2 h-4 w-4" /> */}
                        Weak Concepts
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
