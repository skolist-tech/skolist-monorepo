import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@skolist/ui";
import { QuestionPalette } from "@/components/student/QuestionPalette";
import { QuestionViewer } from "@/components/student/QuestionViewer";
import { Timer } from "@/components/student/Timer";
import { AttemptContext } from "@/context/AttemptContext";
import { useAttempt } from "@/hooks/useAttempt";
import { saveResponse, submitAttempt } from "@/services/attempts";
import type { StudentQuestion, StudentResponse } from "@/types/assessment";

export function AttemptPage() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const { paper, error, loading } = useAttempt(attemptId);
  const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(
    null
  );
  const [responsesByQuestion, setResponsesByQuestion] = useState<
    Record<string, StudentResponse>
  >({});

  const questions: StudentQuestion[] = useMemo(
    () => paper?.sections.flatMap((section) => section.questions) || [],
    [paper]
  );

  useEffect(() => {
    if (!paper) return;
    const mapped: Record<string, StudentResponse> = {};
    for (const response of paper.responses) {
      mapped[response.question_id] = response;
    }
    setResponsesByQuestion(mapped);
    setCurrentQuestionId(questions[0]?.id ?? null);
  }, [paper, questions]);

  const current =
    questions.find((question) => question.id === currentQuestionId) ||
    questions[0];

  if (loading) return <p className="text-muted-foreground">Loading paper…</p>;
  if (error || !paper || !attemptId)
    return <p className="text-destructive">{error || "Missing attempt"}</p>;

  return (
    <AttemptContext.Provider
      value={{
        currentQuestionId,
        setCurrentQuestionId,
        responsesByQuestion,
        setResponsesByQuestion,
      }}
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{paper.test.name}</h1>
              <p className="text-muted-foreground">{paper.attempt.status}</p>
            </div>
            <Timer
              startedAt={paper.attempt.started_at}
              durationMinutes={paper.test.duration_minutes}
              onExpire={() => {
                void submitAttempt(attemptId).then(() =>
                  navigate(`/student/attempts/${attemptId}/result`)
                );
              }}
            />
          </div>
          {current ? (
            <QuestionViewer
              question={current}
              response={responsesByQuestion[current.id]}
              onChange={(payload) => {
                setResponsesByQuestion((prev) => ({
                  ...prev,
                  [current.id]: {
                    ...prev[current.id],
                    question_id: current.id,
                    attempt_id: attemptId,
                    ...payload,
                  },
                }));
                void saveResponse(attemptId, current.id, payload);
              }}
            />
          ) : null}
          <Button
            onClick={() =>
              submitAttempt(attemptId).then(() =>
                navigate(`/student/attempts/${attemptId}/result`)
              )
            }
          >
            Submit
          </Button>
        </div>
        <QuestionPalette
          questions={questions}
          currentQuestionId={currentQuestionId}
          responses={responsesByQuestion}
          onSelect={setCurrentQuestionId}
        />
      </div>
    </AttemptContext.Provider>
  );
}
