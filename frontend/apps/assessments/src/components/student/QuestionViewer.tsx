import { Button, Input } from "@skolist/ui";
import type { StudentQuestion, StudentResponse } from "@/types/assessment";

const OPTIONS = ["option1", "option2", "option3", "option4"] as const;

export function QuestionViewer({
  question,
  response,
  onChange,
}: {
  question: StudentQuestion;
  response?: StudentResponse;
  onChange: (payload: Partial<StudentResponse>) => void;
}) {
  const options = OPTIONS.map((key, index) => ({
    index: index + 1,
    text: question[key],
  })).filter((item) => item.text);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {question.question_type} · {question.marks} marks
      </p>
      <p className="whitespace-pre-wrap text-lg">{question.question_text}</p>
      {question.question_type === "mcq" ? (
        <div className="space-y-2">
          {options.map((option) => (
            <Button
              key={option.index}
              type="button"
              variant={
                response?.selected_mcq_option === option.index
                  ? "default"
                  : "outline"
              }
              className="w-full justify-start"
              onClick={() => onChange({ selected_mcq_option: option.index })}
            >
              {option.index}. {option.text}
            </Button>
          ))}
        </div>
      ) : null}
      {question.question_type === "msq" ? (
        <div className="space-y-2">
          {options.map((option) => {
            const flags = response?.selected_msq_options || [
              false,
              false,
              false,
              false,
            ];
            const selected = Boolean(flags[option.index - 1]);
            return (
              <Button
                key={option.index}
                type="button"
                variant={selected ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => {
                  const next = [...flags];
                  while (next.length < 4) next.push(false);
                  next[option.index - 1] = !selected;
                  onChange({ selected_msq_options: next });
                }}
              >
                {option.index}. {option.text}
              </Button>
            );
          })}
        </div>
      ) : null}
      {question.question_type === "numerical" ? (
        <Input
          type="number"
          step="any"
          defaultValue={response?.numerical_answer ?? ""}
          onBlur={(event) =>
            onChange({
              numerical_answer:
                event.target.value === "" ? null : Number(event.target.value),
            })
          }
        />
      ) : null}
      {question.question_type === "integer" ? (
        <Input
          type="number"
          step={1}
          defaultValue={response?.integer_answer ?? ""}
          onBlur={(event) =>
            onChange({
              integer_answer:
                event.target.value === "" ? null : Number(event.target.value),
            })
          }
        />
      ) : null}
    </div>
  );
}
