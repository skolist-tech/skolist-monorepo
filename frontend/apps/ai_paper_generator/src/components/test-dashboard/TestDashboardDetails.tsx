import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getOnlineTestById } from "../../services/onlineTestService";
import {
  getTestAttemptsByTestId,
  TestAttemptDetails,
} from "../../services/testAttemptService";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@skolist/ui";
import { Loader2, ArrowLeft, Eye } from "lucide-react";

export function TestDashboardDetails() {
  const { testId } = useParams();
  const [test, setTest] = useState<any>(null);
  const [attempts, setAttempts] = useState<TestAttemptDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!testId) return;

    const loadData = async () => {
      setIsLoading(true);
      try {
        const [testData, attemptsData] = await Promise.all([
          getOnlineTestById(testId),
          getTestAttemptsByTestId(testId),
        ]);
        setTest(testData);
        setAttempts(attemptsData);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [testId]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!test) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <h2 className="text-xl font-semibold">Test not found</h2>
        <Link to="/test-dashboard">
          <Button>Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/test-dashboard">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {test.title || test.qgen_drafts?.paper_title || "Untitled Test"}
          </h2>
          <p className="text-sm text-muted-foreground">
            Created on {new Date(test.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Students Attempted ({attempts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {attempts.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No attempts found for this test yet.
            </div>
          ) : (
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-left text-sm">
                <thead>
                  <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">
                      Student
                    </th>
                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">
                      Attempted On
                    </th>
                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="h-12 w-[100px] px-4 text-right align-middle font-medium text-muted-foreground">
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
                      className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                    >
                      <td className="p-4 align-middle">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage
                              src={attempt.student?.avatar_url ?? undefined}
                            />
                            <AvatarFallback>
                              {attempt.student?.name?.charAt(0).toUpperCase() ||
                                "S"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {attempt.student?.name || "Unknown Student"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {attempt.student?.email ||
                                attempt.student?.phone_num ||
                                "No contact info"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 align-middle">
                        {new Date(attempt.started_at).toLocaleString()}
                      </td>
                      <td className="p-4 align-middle">
                        <Badge
                          variant={
                            attempt.status === "submitted"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {attempt.status.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="p-4 text-right align-middle font-medium">
                        {attempt.total_marks_obtained !== undefined &&
                        attempt.total_marks_obtained !== null
                          ? attempt.total_marks_obtained
                          : "Pending"}
                        {attempt.total_marks_possible
                          ? ` / ${attempt.total_marks_possible}`
                          : ""}
                      </td>
                      <td className="p-4 text-right align-middle">
                        <Link
                          to={`/test-dashboard/details/${testId}/attempt/${attempt.id}`}
                        >
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
