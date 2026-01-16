import { Card, Popover, PopoverContent, PopoverTrigger } from "@skolist/ui";
import { formatQuestionType } from "../../utils/formatters";
import { useQuestionsContext } from "../../context/QuestionsContext";

export function DraftProgress() {
  const { questions } = useQuestionsContext();

  const draftCount = questions.filter((q) => q.is_in_draft).length;
  const totalCount = questions.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Card className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm font-medium">
          <span className="text-muted-foreground">Draft Progress:</span>
          <span>
            {draftCount} / {totalCount} in Draft
          </span>
        </Card>
      </PopoverTrigger>
      <PopoverContent>
        <div className="space-y-1">
          <p className="mb-2 text-xs font-semibold">
            Breakdown by Question Type
          </p>
          {Object.values(
            questions.reduce(
              (acc, q) => {
                const type = q.question_type;
                if (!acc[type]) {
                  acc[type] = { type, draft: 0, total: 0 };
                }
                acc[type].total++;
                if (q.is_in_draft) {
                  acc[type].draft++;
                }
                return acc;
              },
              {} as Record<
                string,
                { type: string; draft: number; total: number }
              >
            )
          ).map((stat) => (
            <div key={stat.type} className="flex justify-between gap-4 text-xs">
              <span className="capitalize">
                {formatQuestionType(stat.type)}:
              </span>
              <span>
                {stat.draft} / {stat.total}
              </span>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
