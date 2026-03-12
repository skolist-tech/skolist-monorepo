import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  List,
  Loader2,
  Monitor,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@skolist/ui";
import {
  studentAttemptApiService,
  type StudentAttemptDetailResponse,
} from "../../services/studentAttemptApiService";

type ViewMode = "live" | "list";

type AnswerRow = StudentAttemptDetailResponse["answers"][number];
type QuestionRow = StudentAttemptDetailResponse["questions"][number];

function getQuestionResultStyle(answer?: AnswerRow) {
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

function getAnswerDisplay(question: QuestionRow, answer?: AnswerRow): string {
  if (!answer) return "Not answered";

  if (question.type === "multiple_choice_single") {
    const idx = (answer.selected_mcq_option || 0) - 1;
    if (idx >= 0 && question.options?.[idx])
      return String(question.options[idx]);
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

export function StudentAttemptView() {
  const { attemptId } = useParams();
  const [viewMode, setViewMode] = useState<ViewMode>("live");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<StudentAttemptDetailResponse | null>(
    null
  );

  useEffect(() => {
    if (!attemptId) return;

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data =
          await studentAttemptApiService.getMyAttemptDetail(attemptId);
        setDetail(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load attempt");
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [attemptId]);

  const answersByQuestionId = useMemo(() => {
    const map: Record<string, AnswerRow> = {};
    for (const ans of detail?.answers || []) {
      map[ans.gen_question_id] = ans;
    }
    return map;
  }, [detail?.answers]);

  const questions = detail?.questions || [];
  const attempt = detail?.attempt;
  const test = detail?.test;

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

  if (error || !detail || !attempt || !test) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <h2 className="text-xl font-semibold">Unable to load attempt</h2>
        <p className="text-sm text-muted-foreground">
          {error || "Attempt not found"}
        </p>
        <Link to="/my-attempts">
          <Button>Back to My Attempts</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/my-attempts">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{test.title}</h2>
            <p className="text-sm text-muted-foreground">
              Attempt #{attempt.attempt_number} •{" "}
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
                questions.filter(
                  (q) =>
                    getAnswerDisplay(q, answersByQuestionId[q.id]) !==
                    "Not answered"
                ).length
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
                  <div
                    className="prose max-w-none text-sm"
                    dangerouslySetInnerHTML={{
                      __html: currentQuestion.question_text,
                    }}
                  />
                  <div className="rounded-md border bg-muted/30 p-3">
                    <p className="mb-1 text-xs font-medium text-muted-foreground">
                      Student Answer
                    </p>
                    <p className="whitespace-pre-wrap text-sm">
                      {getAnswerDisplay(currentQuestion, currentAnswer)}
                    </p>
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
                <div
                  className="prose mb-3 max-w-none text-sm"
                  dangerouslySetInnerHTML={{ __html: q.question_text }}
                />
                <div className="rounded-md border bg-muted/30 p-3">
                  <p className="mb-1 text-xs font-medium text-muted-foreground">
                    Student Answer
                  </p>
                  <p className="whitespace-pre-wrap text-sm">
                    {getAnswerDisplay(q, answersByQuestionId[q.id])}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
