import type { GeneratedQuestionWithConcepts } from "../../../services/questionService";
import { LatexRenderer } from "../LatexRenderer";

interface QuestionMatchTheFollowingProps {
  question: GeneratedQuestionWithConcepts;
}

export function QuestionMatchTheFollowing({
  question,
}: QuestionMatchTheFollowingProps) {
  const columns = question.match_the_following_columns as Record<
    string,
    string[]
  > | null;

  if (!columns) return null;

  const columnNames = Object.keys(columns);
  if (columnNames.length === 0) return null;

  // Assuming we usually have 2 columns for match the following
  return (
    <div className="ml-4 mt-2 space-y-4">
      <div className="grid grid-cols-2 gap-8">
        {columnNames.map((colName) => (
          <div key={colName} className="space-y-2">
            <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              {colName}
            </h4>
            <div className="space-y-2">
              {columns[colName]?.map((item, index) => (
                <div key={index} className="flex gap-2 text-sm leading-relaxed">
                  <span className="min-w-[20px] font-semibold">
                    {colName === columnNames[0]
                      ? `${index + 1}.`
                      : `${String.fromCharCode(65 + index)}.`}
                  </span>
                  <LatexRenderer content={item} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
