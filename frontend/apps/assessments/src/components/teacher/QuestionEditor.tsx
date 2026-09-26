import { useState } from "react";
import { Badge, Button, Input, Label, Textarea } from "@skolist/ui";
import { LatexRenderer } from "@/components/shared/LatexRenderer";
import { QuestionFigure } from "@/components/shared/QuestionFigure";
import { optionEntries } from "@/lib/ntaPalette";
import type { TeacherQuestion } from "@/types/assessment";

const QUESTION_TYPES = ["mcq", "msq", "numerical", "integer"] as const;

type QuestionType = (typeof QUESTION_TYPES)[number];

type DraftFields = {
  question_text: string;
  question_type: QuestionType;
  marks: string;
  negative_marks: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  correct_mcq_option: string;
  msq_option1_answer: boolean;
  msq_option2_answer: boolean;
  msq_option3_answer: boolean;
  msq_option4_answer: boolean;
  numerical_answer: string;
  integer_answer: string;
  explanation: string;
};

function toDraft(question: TeacherQuestion): DraftFields {
  const type = QUESTION_TYPES.includes(question.question_type as QuestionType)
    ? (question.question_type as QuestionType)
    : "mcq";
  return {
    question_text: question.question_text ?? "",
    question_type: type,
    marks: String(question.marks ?? 0),
    negative_marks: String(question.negative_marks ?? 0),
    option1: question.option1 ?? "",
    option2: question.option2 ?? "",
    option3: question.option3 ?? "",
    option4: question.option4 ?? "",
    correct_mcq_option: String(question.correct_mcq_option ?? 1),
    msq_option1_answer: Boolean(question.msq_option1_answer),
    msq_option2_answer: Boolean(question.msq_option2_answer),
    msq_option3_answer: Boolean(question.msq_option3_answer),
    msq_option4_answer: Boolean(question.msq_option4_answer),
    numerical_answer:
      question.numerical_answer == null
        ? ""
        : String(question.numerical_answer),
    integer_answer:
      question.integer_answer == null ? "" : String(question.integer_answer),
    explanation: question.explanation ?? "",
  };
}

function msqCorrect(question: TeacherQuestion, index: number) {
  const flags = [
    question.msq_option1_answer,
    question.msq_option2_answer,
    question.msq_option3_answer,
    question.msq_option4_answer,
  ];
  return Boolean(flags[index - 1]);
}

function buildPayload(draft: DraftFields): Partial<TeacherQuestion> {
  const payload: Partial<TeacherQuestion> = {
    question_text: draft.question_text,
    question_type: draft.question_type,
    marks: Number(draft.marks),
    negative_marks: Number(draft.negative_marks),
    explanation: draft.explanation || null,
  };

  if (draft.question_type === "mcq" || draft.question_type === "msq") {
    payload.option1 = draft.option1 || null;
    payload.option2 = draft.option2 || null;
    payload.option3 = draft.option3 || null;
    payload.option4 = draft.option4 || null;
  }

  if (draft.question_type === "mcq") {
    payload.correct_mcq_option = Number(draft.correct_mcq_option);
  }

  if (draft.question_type === "msq") {
    payload.msq_option1_answer = draft.msq_option1_answer;
    payload.msq_option2_answer = draft.msq_option2_answer;
    payload.msq_option3_answer = draft.msq_option3_answer;
    payload.msq_option4_answer = draft.msq_option4_answer;
  }

  if (draft.question_type === "numerical") {
    payload.numerical_answer =
      draft.numerical_answer === "" ? null : Number(draft.numerical_answer);
  }

  if (draft.question_type === "integer") {
    payload.integer_answer =
      draft.integer_answer === ""
        ? null
        : Number.parseInt(draft.integer_answer, 10);
  }

  return payload;
}

export function QuestionEditor({
  question,
  editable = false,
  onSave,
}: {
  question: TeacherQuestion;
  editable?: boolean;
  onSave?: (
    questionId: string,
    payload: Partial<TeacherQuestion>
  ) => Promise<void> | void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<DraftFields>(() => toDraft(question));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const options = optionEntries(question);
  const needsOptions =
    draft.question_type === "mcq" || draft.question_type === "msq";

  function startEdit() {
    setDraft(toDraft(question));
    setError(null);
    setEditing(true);
  }

  function cancelEdit() {
    setDraft(toDraft(question));
    setError(null);
    setEditing(false);
  }

  async function saveEdit() {
    if (!onSave) return;
    setSaving(true);
    setError(null);
    try {
      await onSave(question.id, buildPayload(draft));
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save question");
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <div className="space-y-3 rounded-md bg-muted/40 p-3 text-sm">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="secondary">{draft.question_type}</Badge>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              onClick={saveEdit}
              disabled={saving}
            >
              Save
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={cancelEdit}
              disabled={saving}
            >
              Cancel
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`question-text-${question.id}`}>Question</Label>
          <Textarea
            id={`question-text-${question.id}`}
            value={draft.question_text}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                question_text: event.target.value,
              }))
            }
          />
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor={`question-type-${question.id}`}>Type</Label>
            <select
              id={`question-type-${question.id}`}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={draft.question_type}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  question_type: event.target.value as QuestionType,
                }))
              }
            >
              {QUESTION_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`marks-${question.id}`}>Marks</Label>
            <Input
              id={`marks-${question.id}`}
              type="number"
              min={0}
              value={draft.marks}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  marks: event.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`negative-${question.id}`}>Negative marks</Label>
            <Input
              id={`negative-${question.id}`}
              type="number"
              min={0}
              value={draft.negative_marks}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  negative_marks: event.target.value,
                }))
              }
            />
          </div>
        </div>

        {needsOptions ? (
          <div className="space-y-3">
            {([1, 2, 3, 4] as const).map((index) => {
              const key = `option${index}` as const;
              const msqKey = `msq_option${index}_answer` as const;
              return (
                <div key={key} className="space-y-2">
                  <Label htmlFor={`${key}-${question.id}`}>
                    Option {index}
                  </Label>
                  <Input
                    id={`${key}-${question.id}`}
                    value={draft[key]}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        [key]: event.target.value,
                      }))
                    }
                  />
                  {draft.question_type === "mcq" ? (
                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                      <input
                        type="radio"
                        name={`correct-${question.id}`}
                        checked={draft.correct_mcq_option === String(index)}
                        onChange={() =>
                          setDraft((current) => ({
                            ...current,
                            correct_mcq_option: String(index),
                          }))
                        }
                      />
                      Correct
                    </label>
                  ) : (
                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={draft[msqKey]}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            [msqKey]: event.target.checked,
                          }))
                        }
                      />
                      Correct
                    </label>
                  )}
                </div>
              );
            })}
          </div>
        ) : null}

        {draft.question_type === "numerical" ? (
          <div className="space-y-2">
            <Label htmlFor={`numerical-${question.id}`}>Numerical answer</Label>
            <Input
              id={`numerical-${question.id}`}
              type="number"
              step="any"
              value={draft.numerical_answer}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  numerical_answer: event.target.value,
                }))
              }
            />
          </div>
        ) : null}

        {draft.question_type === "integer" ? (
          <div className="space-y-2">
            <Label htmlFor={`integer-${question.id}`}>Integer answer</Label>
            <Input
              id={`integer-${question.id}`}
              type="number"
              step={1}
              value={draft.integer_answer}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  integer_answer: event.target.value,
                }))
              }
            />
          </div>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor={`explanation-${question.id}`}>Explanation</Label>
          <Textarea
            id={`explanation-${question.id}`}
            value={draft.explanation}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                explanation: event.target.value,
              }))
            }
          />
        </div>

        {error ? <p className="text-destructive">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="rounded-md bg-muted/40 p-3 text-sm">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{question.question_type}</Badge>
          <span className="text-muted-foreground">
            {question.marks} marks
            {question.negative_marks > 0
              ? ` · −${question.negative_marks}`
              : ""}
          </span>
        </div>
        {editable ? (
          <Button type="button" size="sm" variant="outline" onClick={startEdit}>
            Edit
          </Button>
        ) : null}
      </div>

      <div className="leading-relaxed">
        <LatexRenderer content={question.question_text} />
      </div>

      {question.svg_image_code || question.image_url ? (
        <div className="mt-2 overflow-hidden rounded border bg-background p-2 [&>div>svg]:mx-auto [&>div>svg]:max-h-72 [&>div>svg]:w-auto">
          <QuestionFigure
            svgCode={question.svg_image_code}
            imageUrl={question.image_url}
            alt="Question figure"
            className="mx-auto max-h-72 object-contain"
          />
        </div>
      ) : null}

      {options.length ? (
        <ul className="mt-3 space-y-2">
          {options.map((option) => {
            const isCorrect =
              question.question_type === "mcq"
                ? question.correct_mcq_option === option.index
                : question.question_type === "msq"
                  ? msqCorrect(question, option.index)
                  : false;
            return (
              <li
                key={option.index}
                className={`rounded border px-3 py-2 ${
                  isCorrect
                    ? "border-primary/40 bg-background"
                    : "border-transparent"
                }`}
              >
                <span className="mr-2 font-semibold">
                  ({String.fromCharCode(64 + option.index)})
                </span>
                {option.text ? <LatexRenderer content={option.text} /> : null}
                <QuestionFigure
                  svgCode={option.svgCode}
                  imageUrl={option.imageUrl}
                  alt={`Option ${option.index}`}
                  className="mt-2 max-h-40 object-contain [&>svg]:max-h-40 [&>svg]:w-auto"
                />
              </li>
            );
          })}
        </ul>
      ) : null}

      {question.question_type === "numerical" &&
      question.numerical_answer != null ? (
        <p className="mt-2 text-muted-foreground">
          Answer: {question.numerical_answer}
        </p>
      ) : null}

      {question.question_type === "integer" &&
      question.integer_answer != null ? (
        <p className="mt-2 text-muted-foreground">
          Answer: {question.integer_answer}
        </p>
      ) : null}

      {question.explanation ||
      question.explanation_svg_image_code ||
      question.explanation_image_url ? (
        <div className="mt-2 text-muted-foreground">
          Key:{" "}
          {question.explanation ? (
            <LatexRenderer content={question.explanation} />
          ) : null}
          <QuestionFigure
            svgCode={question.explanation_svg_image_code}
            imageUrl={question.explanation_image_url}
            alt="Explanation figure"
            className="mt-2 max-h-48 object-contain [&>svg]:max-h-48 [&>svg]:w-auto"
          />
        </div>
      ) : null}
    </div>
  );
}
