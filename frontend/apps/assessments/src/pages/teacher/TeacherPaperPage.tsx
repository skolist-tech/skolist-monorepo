import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  PaperView,
  correctOptions,
  numericAnswer,
} from "@/components/shared/PaperView";
import type { QuestionEditor } from "@/components/student/QuestionViewer";
import type { BlockSave } from "@/components/teacher/EditableBlock";
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

export function TeacherPaperPage() {
  const { testId } = useParams();
  const [test, setTest] = useState<TeacherTestDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!testId) return;
    setTest(await getTeacherTest(testId));
  }, [testId]);

  useEffect(() => {
    reload().catch((err: Error) => setError(err.message));
  }, [reload]);

  function editorFor(current: TeacherQuestion): QuestionEditor {
    return {
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
    };
  }

  if (error) {
    return <p className="p-8 text-center text-red-600">{error}</p>;
  }
  if (!test) {
    return <p className="p-8 text-center text-slate-600">Loading paper…</p>;
  }

  return (
    <PaperView
      paper={test}
      subtitle="Teacher view · edits are saved to the paper"
      backTo={{ href: `/teacher/tests/${test.id}`, label: "Back to test" }}
      editorFor={editorFor}
    />
  );
}
