import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  List,
  Monitor,
  Loader2,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@skolist/ui";
import { getOnlineTestById } from "../../services/onlineTestService";
import {
  getTestAnswers,
  getTestAttemptsByTestId,
  getTestQuestions,
  type TestAnswer,
  type TestAttemptDetails,
  type TestQuestion,
} from "../../services/testAttemptService";
import { LatexHtmlRenderer, LatexRenderer } from "../shared/LatexRenderer";

type ViewMode = "live" | "list";

function getQuestionResultStyle(answer?: TestAnswer) {
  if (
    !answer ||
    answer.marks_obtained === null ||
    answer.marks_obtained === undefined
  ) {
    return {
      card: "border-gray-200 bg-white",
      label: "text-gray-600",
    };
  }

  if (Number(answer.marks_obtained) > 0) {
    return {
      card: "border-green-200 bg-green-50/40",
      label: "text-green-700",
    };
  }

  return {
    card: "border-red-200 bg-red-50/40",
    label: "text-red-700",
  };
}

function getAnswerDisplay(question: TestQuestion, answer?: TestAnswer): string {
  if (!answer) return "Not answered";

  if (question.type === "multiple_choice_single") {
    const idx = (answer.selected_mcq_option || 0) - 1;
    if (idx >= 0 && question.options?.[idx]) return question.options[idx];
    return "Not answered";
  }

  if (question.type === "multiple_choice_multiple") {
    const selected = (answer.selected_msq_options || [])
      .map((isSelected, i) => (isSelected ? question.options?.[i] : null))
      .filter((v): v is string => Boolean(v));
    return selected.length ? selected.join(", ") : "Not answered";
  }

  if (answer.match_answer) return JSON.stringify(answer.match_answer);
  if (
    answer.numerical_answer !== null &&
    answer.numerical_answer !== undefined
  ) {
    return String(answer.numerical_answer);
  }

  return answer.text_answer?.trim() ? answer.text_answer : "Not answered";
}

export function TestAttemptView() {
  const { testId, attemptId } = useParams();
  const [viewMode, setViewMode] = useState<ViewMode>("live");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [test, setTest] = useState<any>(null);
  const [attempt, setAttempt] = useState<TestAttemptDetails | null>(null);
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [answers, setAnswers] = useState<TestAnswer[]>([]);

  useEffect(() => {
    if (!testId || !attemptId) return;

    const loadAttempt = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [testData, attemptsData, questionsData, answersData] =
          await Promise.all([
            getOnlineTestById(testId),
            getTestAttemptsByTestId(testId),
            getTestQuestions(attemptId),
            getTestAnswers(attemptId),
          ]);

        setTest(testData);
        setAttempt(attemptsData.find((a) => a.id === attemptId) || null);
        setQuestions(questionsData);
        setAnswers(answersData);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Failed to load attempt");
      } finally {
        setIsLoading(false);
      }
    };

    loadAttempt();
  }, [attemptId, testId]);

  const answersByQuestionId = useMemo(() => {
    const map: Record<string, TestAnswer> = {};
    for (const ans of answers) {
      map[ans.gen_question_id] = ans;
    }
    return map;
  }, [answers]);

  const currentQuestion = questions[currentIndex];
  const currentAnswer = currentQuestion
    ? answersByQuestionId[currentQuestion.id]
    : undefined;
  const currentStyle = getQuestionResultStyle(currentAnswer);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !test || !attempt) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <h2 className="text-xl font-semibold">Unable to load attempt</h2>
        <p className="text-sm text-muted-foreground">
          {error || "Attempt not found"}
        </p>
        <Link to={`/test-dashboard/details/${testId}`}>
          <Button>Back to Attempts</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to={`/test-dashboard/details/${testId}`}>
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              {test.title || test.qgen_drafts?.paper_title || "Untitled Test"}
            </h2>
            <p className="text-sm text-muted-foreground">
              Attempt by {attempt.student?.name || "Unknown Student"} •{" "}
              {new Date(attempt.started_at).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "live" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("live")}
          >
            <Monitor className="mr-2 h-4 w-4" />
            Live View
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            <List className="mr-2 h-4 w-4" />
            List View
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Attempt Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">Status</p>
            <Badge
              variant={attempt.status === "graded" ? "secondary" : "default"}
            >
              {attempt.status}
            </Badge>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Score</p>
            <p className="font-semibold">
              {attempt.total_marks_obtained ?? "Pending"}
              {attempt.total_marks_possible
                ? ` / ${attempt.total_marks_possible}`
                : ""}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Questions</p>
            <p className="font-semibold">{questions.length}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Answered</p>
            <p className="font-semibold">
              {
                questions.filter((q) => {
                  const text = getAnswerDisplay(q, answersByQuestionId[q.id]);
                  return text !== "Not answered";
                }).length
              }
            </p>
          </div>
        </CardContent>
      </Card>

      {viewMode === "live" ? (
        <>
          <Card className={currentStyle.card}>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base">
                  Question {currentIndex + 1} of {questions.length}
                </CardTitle>
                {currentQuestion && (
                  <span
                    className={`text-sm font-semibold ${currentStyle.label}`}
                  >
                    Marks: {Number(currentAnswer?.marks_obtained ?? 0)} /{" "}
                    {currentQuestion.marks}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentQuestion ? (
                <>
                  <LatexHtmlRenderer
                    content={currentQuestion.question_text || ""}
                    className="prose max-w-none text-sm"
                  />
                  <div className="rounded-md border bg-muted/30 p-3">
                    <p className="mb-1 text-xs font-medium text-muted-foreground">
                      Student Answer
                    </p>
                    <LatexRenderer
                      content={getAnswerDisplay(
                        currentQuestion,
                        answersByQuestionId[currentQuestion.id]
                      )}
                      className="whitespace-pre-wrap text-sm"
                    />
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No questions found.
                </p>
              )}
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentIndex((v) => Math.max(0, v - 1))}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                setCurrentIndex((v) => Math.min(questions.length - 1, v + 1))
              }
              disabled={currentIndex >= questions.length - 1}
            >
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              All Questions (List View)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {questions.map((q, i) => (
              <div
                key={q.id}
                className={`rounded-md border p-4 ${getQuestionResultStyle(answersByQuestionId[q.id]).card}`}
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold">Question {i + 1}</p>
                  <span
                    className={`text-sm font-semibold ${getQuestionResultStyle(answersByQuestionId[q.id]).label}`}
                  >
                    Marks:{" "}
                    {Number(answersByQuestionId[q.id]?.marks_obtained ?? 0)} /{" "}
                    {q.marks}
                  </span>
                </div>
                <LatexHtmlRenderer
                  content={q.question_text || ""}
                  className="prose mb-3 max-w-none text-sm"
                />
                <div className="rounded-md border bg-muted/30 p-3">
                  <p className="mb-1 text-xs font-medium text-muted-foreground">
                    Student Answer
                  </p>
                  <LatexRenderer
                    content={getAnswerDisplay(q, answersByQuestionId[q.id])}
                    className="whitespace-pre-wrap text-sm"
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
