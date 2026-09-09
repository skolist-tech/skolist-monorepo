import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { InstructionsGate } from "@/components/student/InstructionsGate";
import { QuestionPalette } from "@/components/student/QuestionPalette";
import { QuestionViewer } from "@/components/student/QuestionViewer";
import { Timer } from "@/components/student/Timer";
import { useActor } from "@/hooks/useActor";
import { useAttempt } from "@/hooks/useAttempt";
import {
  draftHasAnswer,
  emptyAnswerPayload,
  isAnswerable,
  isPassageStem,
} from "@/lib/ntaPalette";
import { saveResponse, submitAttempt } from "@/services/attempts";
import type { StudentQuestion, StudentResponse } from "@/types/assessment";

function displayName(
  actor: { name?: string | null; email?: string | null } | null | undefined,
  fallback: string
) {
  if (actor?.name?.trim()) return actor.name.trim();
  if (!actor?.email) return fallback;
  return actor.email.split("@")[0] || fallback;
}

export function AttemptPage() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const { actor } = useActor();
  const { paper, error, loading } = useAttempt(attemptId);

  const [instructionsDone, setInstructionsDone] = useState(false);
  const [language, setLanguage] = useState<"en" | "hi">("en");
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(
    null
  );
  const [responsesByQuestion, setResponsesByQuestion] = useState<
    Record<string, StudentResponse>
  >({});
  const [draft, setDraft] = useState<Partial<StudentResponse>>({});
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const sections = useMemo(() => paper?.sections || [], [paper]);

  const answerableBySection = useMemo(() => {
    const map = new Map<string, StudentQuestion[]>();
    for (const section of sections) {
      map.set(section.id, section.questions.filter(isAnswerable));
    }
    return map;
  }, [sections]);

  const allAnswerable = useMemo(
    () => sections.flatMap((section) => section.questions.filter(isAnswerable)),
    [sections]
  );

  const questionsById = useMemo(() => {
    const map = new Map<string, StudentQuestion>();
    for (const section of sections) {
      for (const question of section.questions) {
        map.set(question.id, question);
      }
    }
    return map;
  }, [sections]);

  const current = currentQuestionId
    ? questionsById.get(currentQuestionId)
    : allAnswerable[0];

  const passageText = useMemo(() => {
    if (!current?.parent_question_id) return null;
    const parent = questionsById.get(current.parent_question_id);
    return parent?.question_text || null;
  }, [current, questionsById]);

  const sectionQuestions = activeSectionId
    ? answerableBySection.get(activeSectionId) || []
    : [];
  const questionNumberInSection = current
    ? sectionQuestions.findIndex((q) => q.id === current.id) + 1
    : 0;

  useEffect(() => {
    if (!paper) return;
    const mapped: Record<string, StudentResponse> = {};
    for (const response of paper.responses) {
      mapped[response.question_id] = response;
    }
    setResponsesByQuestion(mapped);
    const firstSection = paper.sections[0];
    setActiveSectionId(firstSection?.id ?? null);
    const firstQ = firstSection?.questions.find(isAnswerable);
    setCurrentQuestionId(firstQ?.id ?? null);
  }, [paper]);

  useEffect(() => {
    if (!current || !attemptId) return;
    const saved = responsesByQuestion[current.id];
    setDraft({
      selected_mcq_option: saved?.selected_mcq_option ?? null,
      selected_msq_options: saved?.selected_msq_options ?? [
        false,
        false,
        false,
        false,
      ],
      numerical_answer: saved?.numerical_answer ?? null,
      integer_answer: saved?.integer_answer ?? null,
    });
    if (!saved?.is_visited) {
      void saveResponse(attemptId, current.id, { is_visited: true }).then(
        (row) => {
          setResponsesByQuestion((prev) => ({
            ...prev,
            [current.id]: { ...prev[current.id], ...row },
          }));
        }
      );
    }
  }, [current?.id, attemptId]); // eslint-disable-line react-hooks/exhaustive-deps

  const mergeResponse = useCallback(
    (questionId: string, row: StudentResponse) => {
      setResponsesByQuestion((prev) => ({
        ...prev,
        [questionId]: { ...prev[questionId], ...row },
      }));
    },
    []
  );

  const goToQuestion = useCallback(
    (questionId: string) => {
      const question = questionsById.get(questionId);
      if (!question) return;
      setActiveSectionId(question.section_id);
      setCurrentQuestionId(questionId);
    },
    [questionsById]
  );

  const goNext = useCallback(() => {
    if (!current) return;
    const idx = allAnswerable.findIndex((q) => q.id === current.id);
    const next = allAnswerable[idx + 1];
    if (next) goToQuestion(next.id);
  }, [allAnswerable, current, goToQuestion]);

  const persist = useCallback(
    async (
      question: StudentQuestion,
      payload: Partial<StudentResponse>
    ): Promise<StudentResponse | null> => {
      if (!attemptId) return null;
      const row = await saveResponse(attemptId, question.id, {
        is_visited: true,
        ...payload,
      });
      mergeResponse(question.id, row);
      return row;
    },
    [attemptId, mergeResponse]
  );

  const handleSaveAndNext = async () => {
    if (!current) return;
    await persist(current, {
      ...draft,
      is_marked_for_review: false,
    });
    goNext();
  };

  const handleClear = async () => {
    if (!current) return;
    const cleared = {
      ...emptyAnswerPayload(current),
      is_marked_for_review: false,
      is_visited: true,
    };
    setDraft({
      selected_mcq_option: null,
      selected_msq_options: [false, false, false, false],
      numerical_answer: null,
      integer_answer: null,
    });
    await persist(current, cleared);
  };

  const handleMarkForReviewAndNext = async () => {
    if (!current) return;
    // NTA: mark without requiring save of draft selection
    await persist(current, {
      ...emptyAnswerPayload(current),
      is_marked_for_review: true,
    });
    goNext();
  };

  const handleSaveAndMarkForReview = async () => {
    if (!current) return;
    await persist(current, {
      ...draft,
      is_marked_for_review: true,
    });
    goNext();
  };

  const handleSubmit = async () => {
    if (!attemptId || submitting) return;
    setSubmitting(true);
    try {
      if (current && draftHasAnswer(current, draft)) {
        await persist(current, {
          ...draft,
          is_marked_for_review:
            responsesByQuestion[current.id]?.is_marked_for_review ?? false,
        });
      }
      await submitAttempt(attemptId);
      navigate(`/student/attempts/${attemptId}/result`);
    } finally {
      setSubmitting(false);
      setShowSubmitConfirm(false);
    }
  };

  if (loading) {
    return (
      <p className="p-8 text-center text-slate-600">Loading examination…</p>
    );
  }
  if (error || !paper || !attemptId) {
    return (
      <p className="p-8 text-center text-red-600">
        {error || "Missing attempt"}
      </p>
    );
  }

  if (!instructionsDone) {
    return (
      <div className="min-h-screen bg-[#e8eef5] py-8">
        <InstructionsGate
          testName={paper.test.name}
          examType={paper.test.exam_type}
          durationMinutes={paper.test.duration_minutes}
          totalQuestions={allAnswerable.length}
          onProceed={() => setInstructionsDone(true)}
        />
      </div>
    );
  }

  const candidate = displayName(actor, "Candidate");
  const roll = (actor?.id || "0000").slice(-8).toUpperCase();

  return (
    <div className="flex h-screen flex-col bg-[#dfe7f1] text-slate-900">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-400 bg-[#1e3a5f] px-4 py-2 text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded border border-slate-300 bg-slate-200 text-xs font-bold text-slate-600">
            {actor?.avatar_url ? (
              <img
                src={actor.avatar_url}
                alt="PHOTO"
                className="h-full w-full object-cover"
              />
            ) : (
              "PHOTO"
            )}
          </div>
          <div className="text-sm">
            <p className="font-semibold">{candidate}</p>
            <p className="text-slate-200">Roll No: {roll}</p>
            <p className="text-xs text-slate-300">{paper.test.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-xs">
            Language{" "}
            <select
              className="ml-1 rounded border border-slate-400 bg-white px-2 py-1 text-slate-900"
              value={language}
              onChange={(event) =>
                setLanguage(event.target.value as "en" | "hi")
              }
            >
              <option value="en">English</option>
              <option value="hi">हिन्दी</option>
            </select>
          </label>
          <div className="text-right text-xs">
            <p className="text-slate-300">Time Left</p>
            <Timer
              startedAt={paper.attempt.started_at}
              durationMinutes={paper.test.duration_minutes}
              onExpire={() => {
                void handleSubmit();
              }}
            />
          </div>
        </div>
      </header>

      <nav className="flex flex-wrap gap-1 border-b border-slate-300 bg-[#2c5282] px-2 py-1">
        {sections.map((section) => (
          <button
            key={section.id}
            type="button"
            className={`rounded px-3 py-1 text-sm font-medium ${
              section.id === activeSectionId
                ? "bg-white text-[#1e3a5f]"
                : "text-white hover:bg-white/10"
            }`}
            onClick={() => {
              setActiveSectionId(section.id);
              const first = answerableBySection.get(section.id)?.[0];
              if (first) setCurrentQuestionId(first.id);
            }}
          >
            {section.name}
          </button>
        ))}
      </nav>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[1fr_300px]">
        <div className="flex min-h-0 flex-col overflow-hidden bg-white">
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {current && !isPassageStem(current) ? (
              <QuestionViewer
                question={current}
                draft={draft}
                onDraftChange={(payload) =>
                  setDraft((prev) => ({ ...prev, ...payload }))
                }
                questionNumber={questionNumberInSection || current.position}
                passageText={passageText}
                language={language}
              />
            ) : (
              <p className="text-slate-500">No question selected.</p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-slate-300 bg-[#f3f6fb] px-4 py-3">
            <button
              type="button"
              className="rounded border border-slate-400 bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50"
              onClick={() => void handleClear()}
            >
              Clear Response
            </button>
            <button
              type="button"
              className="rounded bg-purple-700 px-3 py-2 text-sm font-semibold text-white hover:bg-purple-800"
              onClick={() => void handleMarkForReviewAndNext()}
            >
              Mark for Review &amp; Next
            </button>
            <button
              type="button"
              className="rounded bg-purple-600 px-3 py-2 text-sm font-semibold text-white hover:bg-purple-700"
              onClick={() => void handleSaveAndMarkForReview()}
            >
              Save &amp; Mark for Review
            </button>
            <button
              type="button"
              className="rounded bg-green-700 px-3 py-2 text-sm font-semibold text-white hover:bg-green-800"
              onClick={() => void handleSaveAndNext()}
            >
              Save &amp; Next
            </button>
            <button
              type="button"
              className="ml-auto rounded bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800"
              onClick={() => setShowSubmitConfirm(true)}
            >
              Submit
            </button>
          </div>
        </div>

        <QuestionPalette
          sections={sections}
          activeSectionId={activeSectionId}
          currentQuestionId={currentQuestionId}
          responses={responsesByQuestion}
          onSelect={goToQuestion}
          language={language}
        />
      </div>

      {showSubmitConfirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md space-y-4 rounded bg-white p-5 shadow-xl">
            <h2 className="text-lg font-bold text-[#1e3a5f]">
              Submit Examination?
            </h2>
            <p className="text-sm text-slate-600">
              Once submitted, you cannot change answers. Review the palette for
              unanswered or marked questions before confirming.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="rounded border border-slate-400 px-3 py-2 text-sm"
                onClick={() => setShowSubmitConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded bg-red-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                disabled={submitting}
                onClick={() => void handleSubmit()}
              >
                {submitting ? "Submitting…" : "Yes, Submit"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
