import type { QuestionItemData } from "../types";
import { LatexHtmlRenderer } from "../../shared/LatexRenderer";

export const AnswerItem = ({
  question,
  index,
}: {
  question: QuestionItemData;
  index: number;
}) => {
  return (
    <div className="mb-4 break-inside-avoid">
      <div className="flex gap-2">
        <span className="font-semibold">{index + 1}.</span>
        <div className="flex-1">
          <div className="flex gap-2">
            <span className="text-sm font-bold">Ans:</span>
            <LatexHtmlRenderer
              content={question.answer_text || "N/A"}
              className="prose prose-sm max-w-none text-gray-800"
              style={{ fontFamily: '"Times New Roman", Times, serif' }}
            />
          </div>
          {question.explanation && (
            <div className="mt-2 text-sm">
              <span className="font-bold underline">Explanation:</span>
              <LatexHtmlRenderer
                content={question.explanation}
                className="prose prose-sm mt-1 max-w-none text-gray-800"
                style={{ fontFamily: '"Times New Roman", Times, serif' }}
              />
            </div>
          )}
        </div>
        <span className="ml-2 whitespace-nowrap text-sm font-semibold text-gray-500">
          [{question.marks}]
        </span>
      </div>
    </div>
  );
};