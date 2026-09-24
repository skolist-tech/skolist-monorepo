import { LatexRenderer } from "@/components/shared/LatexRenderer";
import { QuestionFigure } from "@/components/shared/QuestionFigure";
import { optionEntries } from "@/lib/ntaPalette";
import type { StudentQuestion, StudentResponse } from "@/types/assessment";

type Props = {
  question: StudentQuestion;
  draft: Partial<StudentResponse>;
  onDraftChange: (payload: Partial<StudentResponse>) => void;
  questionNumber: number;
  passageText?: string | null;
  language: "en" | "hi";
};

export function QuestionViewer({
  question,
  draft,
  onDraftChange,
  questionNumber,
  passageText,
  language,
}: Props) {
  const options = optionEntries(question);
  const typeLabel =
    question.question_type === "mcq"
      ? language === "hi"
        ? "बहुविकल्पीय (एक सही)"
        : "Multiple Choice (Single Correct)"
      : question.question_type === "msq"
        ? language === "hi"
          ? "बहुविकल्पीय (एक से अधिक सही)"
          : "Multiple Correct"
        : question.question_type === "numerical"
          ? language === "hi"
            ? "संख्यात्मक"
            : "Numerical Answer"
          : language === "hi"
            ? "पूर्णांक"
            : "Integer Answer";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-300 pb-2 text-sm">
        <p className="font-semibold text-slate-800">
          {language === "hi" ? "प्रश्न" : "Question"} {questionNumber}
        </p>
        <p className="text-slate-600">
          {typeLabel} · {question.marks} {language === "hi" ? "अंक" : "marks"}
          {question.negative_marks > 0 ? ` · −${question.negative_marks}` : ""}
        </p>
      </div>

      {passageText ? (
        <div className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-slate-800">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-amber-800">
            {language === "hi" ? "अनुच्छेद" : "Paragraph"}
          </p>
          <LatexRenderer content={passageText} />
        </div>
      ) : null}

      <div className="text-[15px] leading-relaxed text-slate-900">
        <LatexRenderer content={question.question_text} />
      </div>

      {question.svg_image_code || question.image_url ? (
        <div className="overflow-hidden rounded border border-slate-200 bg-white p-2 [&>div>svg]:mx-auto [&>div>svg]:max-h-72 [&>div>svg]:w-auto">
          <QuestionFigure
            svgCode={question.svg_image_code}
            imageUrl={question.image_url}
            alt={`Figure for question ${questionNumber}`}
            className="mx-auto max-h-72 object-contain"
          />
        </div>
      ) : null}

      {question.question_type === "mcq" ? (
        <div className="space-y-2">
          {options.map((option) => {
            const selected = draft.selected_mcq_option === option.index;
            return (
              <label
                key={option.index}
                className={`flex cursor-pointer items-start gap-3 rounded border px-3 py-2 text-sm ${
                  selected
                    ? "border-sky-600 bg-sky-50"
                    : "border-slate-300 bg-white hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  className="mt-1"
                  name={`q-${question.id}`}
                  checked={selected}
                  onChange={() =>
                    onDraftChange({ selected_mcq_option: option.index })
                  }
                />
                <span className="font-semibold text-slate-700">
                  ({String.fromCharCode(64 + option.index)})
                </span>
                <span className="flex-1">
                  {option.text ? <LatexRenderer content={option.text} /> : null}
                  <QuestionFigure
                    svgCode={option.svgCode}
                    imageUrl={option.imageUrl}
                    alt={`Option ${option.index}`}
                    className="mt-2 max-h-40 object-contain [&>svg]:max-h-40 [&>svg]:w-auto"
                  />
                </span>
              </label>
            );
          })}
        </div>
      ) : null}

      {question.question_type === "msq" ? (
        <div className="space-y-2">
          {options.map((option) => {
            const flags = draft.selected_msq_options || [
              false,
              false,
              false,
              false,
            ];
            const selected = Boolean(flags[option.index - 1]);
            return (
              <label
                key={option.index}
                className={`flex cursor-pointer items-start gap-3 rounded border px-3 py-2 text-sm ${
                  selected
                    ? "border-sky-600 bg-sky-50"
                    : "border-slate-300 bg-white hover:bg-slate-50"
                }`}
              >
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={selected}
                  onChange={() => {
                    const next = [...flags];
                    while (next.length < 4) next.push(false);
                    next[option.index - 1] = !selected;
                    onDraftChange({ selected_msq_options: next });
                  }}
                />
                <span className="font-semibold text-slate-700">
                  ({String.fromCharCode(64 + option.index)})
                </span>
                <span className="flex-1">
                  {option.text ? <LatexRenderer content={option.text} /> : null}
                  <QuestionFigure
                    svgCode={option.svgCode}
                    imageUrl={option.imageUrl}
                    alt={`Option ${option.index}`}
                    className="mt-2 max-h-40 object-contain [&>svg]:max-h-40 [&>svg]:w-auto"
                  />
                </span>
              </label>
            );
          })}
        </div>
      ) : null}

      {question.question_type === "numerical" ||
      question.question_type === "integer" ? (
        <div className="max-w-xs space-y-1">
          <label className="text-xs font-medium text-slate-600">
            {language === "hi" ? "अपना उत्तर दर्ज करें" : "Enter your answer"}
          </label>
          <input
            type="number"
            step={question.question_type === "integer" ? 1 : "any"}
            className="w-full rounded border border-slate-400 px-3 py-2 text-sm"
            value={
              question.question_type === "numerical"
                ? (draft.numerical_answer ?? "")
                : (draft.integer_answer ?? "")
            }
            onChange={(event) => {
              const raw = event.target.value;
              if (raw === "") {
                onDraftChange(
                  question.question_type === "numerical"
                    ? { numerical_answer: null }
                    : { integer_answer: null }
                );
                return;
              }
              if (question.question_type === "numerical") {
                onDraftChange({ numerical_answer: Number(raw) });
              } else {
                onDraftChange({ integer_answer: Number.parseInt(raw, 10) });
              }
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
