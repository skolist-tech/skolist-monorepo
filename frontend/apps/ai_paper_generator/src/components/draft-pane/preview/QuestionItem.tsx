import type { GeneratedQuestionWithConcepts } from "../../../services/questionService";
import { LatexHtmlRenderer, LatexRenderer } from "../../shared/LatexRenderer";
import { processSvgLatex } from "../../shared/Question/QuestionImages";

export const QuestionItem = ({
  question,
  index,
}: {
  question: GeneratedQuestionWithConcepts;
  index: number;
}) => {
  // Filter and sort images by position
  const validImages = (question.images || [])
    .filter((img: any) => img.svg_string || img.img_url)
    .sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0));

  return (
    <div
      className="break-inside-avoid"
      style={{ marginBottom: "var(--question-margin-bottom)" }}
    >
      <div className="flex" style={{ gap: "var(--question-flex-gap)" }}>
        <span className="font-semibold">{index + 1}.</span>
        <div className="flex-1">
          <LatexHtmlRenderer
            content={question.question_text || ""}
            className="prose prose-sm max-w-none text-gray-800"
            style={{ fontFamily: '"Times New Roman", Times, serif' }}
          />
          {/* Render Question Images */}
          {validImages.length > 0 && (
            <div
              className="flex flex-wrap"
              style={{
                marginTop: "var(--question-images-margin-y)",
                marginBottom: "var(--question-images-margin-y)",
                gap: "var(--question-images-gap)",
              }}
            >
              {validImages.map((image) => {
                if (image.svg_string) {
                  return (
                    <div
                      key={image.id}
                      className="question-image-svg max-w-full overflow-hidden"
                      dangerouslySetInnerHTML={{
                        __html: processSvgLatex(image.svg_string),
                      }}
                    />
                  );
                }
                if (image.img_url) {
                  return (
                    <img
                      key={image.id}
                      src={image.img_url}
                      alt={`Question image ${image.position ?? image.id}`}
                      className="max-h-24 max-w-full object-contain"
                    />
                  );
                }
                return null;
              })}
            </div>
          )}
          {question.question_type === "match_the_following" && (
            <div
              className="grid grid-cols-2"
              style={{
                marginTop: "var(--match-margin-top)",
                columnGap: "var(--match-gap-x)",
                rowGap: "var(--match-gap-y)",
              }}
            >
              {/* Headers */}
              {Object.keys(
                (question.match_the_following_columns as Record<
                  string,
                  string[]
                >) || {}
              ).map((name, i) => (
                <div key={i} className="text-sm font-bold uppercase underline">
                  {name}
                </div>
              ))}
              {/* Items */}
              {(() => {
                const cols =
                  (question.match_the_following_columns as Record<
                    string,
                    string[]
                  >) || {};
                const colNames = Object.keys(cols);
                if (colNames.length < 2) return null;

                const leftColName = colNames[0] as string;
                const rightColName = colNames[1] as string;

                const leftCol = cols[leftColName] || [];
                const rightCol = cols[rightColName] || [];
                const maxRows = Math.max(leftCol.length, rightCol.length);

                return Array.from({ length: maxRows }).map((_, i) => (
                  <div key={i} className="contents">
                    <div className="flex items-start gap-2 text-sm">
                      <span className="font-semibold">{i + 1}.</span>
                      <LatexRenderer content={leftCol[i] || ""} />
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <span className="font-semibold">
                        {String.fromCharCode(65 + i)}.
                      </span>
                      <LatexRenderer content={rightCol[i] || ""} />
                    </div>
                  </div>
                ));
              })()}
            </div>
          )}
          {/* Render Options if MCQ/MSQ */}
          {(["mcq4", "msq4"] as string[]).includes(question.question_type) && (
            <div
              className="grid grid-cols-2"
              style={{
                marginTop: "var(--options-margin-top)",
                columnGap: "var(--options-gap-x)",
                rowGap: "var(--options-gap-y)",
              }}
            >
              {[
                question.option1,
                question.option2,
                question.option3,
                question.option4,
              ].map((opt, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 text-sm"
                  style={{ fontFamily: '"Times New Roman", Times, serif' }}
                >
                  <span className="font-medium text-gray-500">
                    {String.fromCharCode(97 + i)})
                  </span>
                  <LatexRenderer content={opt || ""} />
                </div>
              ))}
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
