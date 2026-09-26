import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { QuestionPalette } from "@/components/student/QuestionPalette";
import {
  QuestionViewer,
  type QuestionEditor,
} from "@/components/student/QuestionViewer";
import type { BlockSave } from "@/components/teacher/EditableBlock";
import { isAnswerable, isPassageStem } from "@/lib/ntaPalette";
import {
  getTeacherTest,
  removeQuestionImage,
  updateQuestion,
  uploadQuestionImage,
  type ImageSlot,
} from "@/services/tests";
import type { TeacherQuestion, TeacherTestDetail } from "@/types/assessment";

async function applyImage(
  questionId: string,
  slot: ImageSlot,
  save: BlockSave
) {
  if (save.removeImage) await removeQuestionImage(questionId, slot);
  if (save.file) await uploadQuestionImage(questionId, slot, save.file);
}

function correctOptions(question: TeacherQuestion): number[] {
  if (question.question_type === "mcq") {
    return question.correct_mcq_option ? [question.correct_mcq_option] : [];
  }
  if (question.question_type === "msq") {
    return [1, 2, 3, 4].filter(
      (index) =>
        question[`msq_option${index}_answer` as keyof TeacherQuestion] === true
    );
  }
  return [];
}

function numericAnswer(question: TeacherQuestion): string | null {
  if (question.question_type === "numerical") {
    return question.numerical_answer != null
      ? String(question.numerical_answer)
      : null;
  }
  if (question.question_type === "integer") {
    return question.integer_answer != null
      ? String(question.integer_answer)
      : null;
  }
  return null;
}

export function TeacherPaperPage() {
  const { testId } = useParams();
  const [test, setTest] = useState<TeacherTestDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<"en" | "hi">("en");
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(
    null
  );

  const reload = useCallback(async () => {
    if (!testId) return;
    setTest(await getTeacherTest(testId));
  }, [testId]);

  useEffect(() => {
    reload().catch((err: Error) => setError(err.message));
  }, [reload]);

  const sections = useMemo(() => test?.sections ?? [], [test]);

  useEffect(() => {
    const first = sections[0];
    if (!first || activeSectionId) return;
    setActiveSectionId(first.id);
    setCurrentQuestionId(first.questions.find(isAnswerable)?.id ?? null);
  }, [sections, activeSectionId]);

  const questionsById = useMemo(() => {
    const map = new Map<string, TeacherQuestion>();
    for (const section of sections) {
      for (const question of section.questions) map.set(question.id, question);
    }
    return map;
  }, [sections]);

  const allAnswerable = useMemo(
    () => sections.flatMap((section) => section.questions.filter(isAnswerable)),
    [sections]
  );

  const current = currentQuestionId
    ? questionsById.get(currentQuestionId)
    : allAnswerable[0];

  const passageText = current?.parent_question_id
    ? (questionsById.get(current.parent_question_id)?.question_text ?? null)
    : null;

  const sectionQuestions = activeSectionId
    ? (sections
        .find((section) => section.id === activeSectionId)
        ?.questions.filter(isAnswerable) ?? [])
    : [];
  const questionNumber = current
    ? sectionQuestions.findIndex((q) => q.id === current.id) + 1
    : 0;

  function goToQuestion(questionId: string) {
    const question = questionsById.get(questionId);
    if (!question) return;
    setActiveSectionId(question.section_id);
    setCurrentQuestionId(questionId);
  }

  function step(offset: number) {
    if (!current) return;
    const idx = allAnswerable.findIndex((q) => q.id === current.id);
    const target = allAnswerable[idx + offset];
    if (target) goToQuestion(target.id);
  }

  const editor: QuestionEditor | undefined = current
    ? {
        correctOptions: correctOptions(current),
        answer: numericAnswer(current),
        onSaveStem: async (save) => {
          const payload: Partial<TeacherQuestion> = {
            question_text: save.text,
          };
          if (save.answer !== undefined && save.answer.trim() !== "") {
            if (current.question_type === "numerical") {
              payload.numerical_answer = Number(save.answer);
            } else if (current.question_type === "integer") {
              payload.integer_answer = Number.parseInt(save.answer, 10);
            }
          }
          await updateQuestion(current.id, payload);
          await applyImage(current.id, "stem", save);
          await reload();
        },
        onSaveOption: async (index, save) => {
          const payload: Record<string, unknown> = {
            [`option${index}`]: save.text,
          };
          if (current.question_type === "mcq" && save.correct) {
            payload.correct_mcq_option = index;
          }
          if (current.question_type === "msq" && save.correct !== undefined) {
            payload[`msq_option${index}_answer`] = save.correct;
          }
          await updateQuestion(current.id, payload as Partial<TeacherQuestion>);
          await applyImage(current.id, `option${index}` as ImageSlot, save);
          await reload();
        },
        onSaveExplanation: async (save) => {
          await updateQuestion(current.id, { explanation: save.text || null });
          await applyImage(current.id, "explanation", save);
          await reload();
        },
      }
    : undefined;

  if (error) {
    return <p className="p-8 text-center text-red-600">{error}</p>;
  }
  if (!test) {
    return <p className="p-8 text-center text-slate-600">Loading paper…</p>;
  }

  return (
    <div className="flex h-screen flex-col bg-[#dfe7f1] text-slate-900">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-400 bg-[#1e3a5f] px-4 py-2 text-white">
        <div className="text-sm">
          <p className="font-semibold">{test.name}</p>
          <p className="text-xs text-slate-300">
            Teacher view · edits are saved to the paper
          </p>
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
            <p className="text-slate-300">Duration</p>
            <p className="font-mono text-base font-semibold">
              {test.duration_minutes} min
            </p>
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
              const first = section.questions.find(isAnswerable);
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
            {current && !isPassageStem(current) && editor ? (
              <QuestionViewer
                key={current.id}
                question={current}
                draft={{}}
                onDraftChange={() => undefined}
                questionNumber={questionNumber || current.position}
                passageText={passageText}
                language={language}
                editor={editor}
              />
            ) : (
              <p className="text-slate-500">No question selected.</p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-slate-300 bg-[#f3f6fb] px-4 py-3">
            <button
              type="button"
              className="rounded border border-slate-400 bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50"
              onClick={() => step(-1)}
            >
              Previous
            </button>
            <button
              type="button"
              className="rounded bg-green-700 px-3 py-2 text-sm font-semibold text-white hover:bg-green-800"
              onClick={() => step(1)}
            >
              Next
            </button>
            <Link
              to={`/teacher/tests/${test.id}`}
              className="ml-auto rounded bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#16304f]"
            >
              Back to test
            </Link>
          </div>
        </div>

        <QuestionPalette
          sections={sections}
          activeSectionId={activeSectionId}
          currentQuestionId={currentQuestionId}
          responses={{}}
          onSelect={goToQuestion}
          language={language}
        />
      </div>
    </div>
  );
}
