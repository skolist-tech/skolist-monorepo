import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, Loader2 } from "lucide-react";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@skolist/ui";
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
      <Card>
        <CardHeader>
          <CardTitle>All Attempted Tests ({attempts.length})</CardTitle>
        </CardHeader>
        <CardContent>
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
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-left text-sm">
                <thead>
                  <tr className="border-b transition-colors hover:bg-muted/50">
                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">
                      Test Name
                    </th>
                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">
                      Attempt Number
                    </th>
                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">
                      Submitted At
                    </th>
                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">
                      Marks
                    </th>
                    <th className="h-12 w-[140px] px-4 text-right align-middle font-medium text-muted-foreground">
                      View Attempt
                    </th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {attempts.map((attempt) => (
                    <tr
                      key={attempt.id}
                      className="border-b transition-colors hover:bg-muted/50"
                    >
                      <td className="p-4 align-middle font-medium">
                        {attempt.test?.title || "Untitled Test"}
                      </td>
                      <td className="p-4 align-middle">
                        #{attempt.attempt_number}
                      </td>
                      <td className="p-4 align-middle">
                        {attempt.submitted_at
                          ? new Date(attempt.submitted_at).toLocaleString()
                          : "Not submitted"}
                      </td>
                      <td className="p-4 align-middle">
                        {attempt.total_marks_obtained !== null &&
                        attempt.total_marks_obtained !== undefined
                          ? `${attempt.total_marks_obtained}${attempt.total_marks_possible ? ` / ${attempt.total_marks_possible}` : ""}`
                          : "Pending"}
                      </td>
                      <td className="p-4 text-right align-middle">
                        <Link to={`/my-attempts/attempt/${attempt.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
