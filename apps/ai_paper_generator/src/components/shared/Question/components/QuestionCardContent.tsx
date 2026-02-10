import { Badge } from "@skolist/ui";
import { Lightbulb, Dumbbell } from "lucide-react";
import type { GeneratedQuestionWithConcepts } from "../../../../services/questionService";
import type { HardnessLevel } from "@skolist/db";
import { formatQuestionType } from "../../../../utils/formatters";
import { QuestionMarks } from "../QuestionMarks";
import { QuestionTags } from "../QuestionTags";
import { QuestionText } from "../QuestionText";
import { QuestionOptions } from "../QuestionOptions";
import { QuestionMatchTheFollowing } from "../QuestionMatchTheFollowing";
import { QuestionImages } from "../QuestionImages";
import { ExplanationToggle } from "../ExplanationToggle";
import { AnswerToggle } from "../AnswerToggle";
import type { useQuestionCardState } from "../hooks/useQuestionCardState";

interface QuestionCardContentProps {
  question: GeneratedQuestionWithConcepts;
  state: ReturnType<typeof useQuestionCardState>;
  isReadOnly: boolean;
  onSelect?: (selected: boolean) => void;
  onMarksUpdate: (newMarks: number) => Promise<void>;
  onHardnessUpdate: (newHardness: HardnessLevel) => Promise<void>;
}

export function QuestionCardContent({
  question,
  state,
  isReadOnly,
  onSelect,
  onMarksUpdate,
  onHardnessUpdate,
}: QuestionCardContentProps) {
  const isMcqOrMsq = ["mcq4", "msq4"].includes(question.question_type);

  return (
    <div className={`mb-2 space-y-3 pr-16 ${onSelect ? "pl-6" : ""}`}>
      {/* Meta info (Type, Marks, Hardness) */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {question.is_solved_example && (
          <div className="hidden items-center gap-2 md:flex">
            <Badge
              variant="secondary"
              className="gap-1 bg-amber-100 text-amber-800 hover:bg-amber-100"
            >
              <Lightbulb className="h-3 w-3" />
              Solved Example
            </Badge>
            <span>•</span>
          </div>
        )}
        {question.is_exercise_question && (
          <div className="hidden items-center gap-2 md:flex">
            <Badge
              variant="secondary"
              className="gap-1 bg-blue-100 text-blue-800 hover:bg-blue-100"
            >
              <Dumbbell className="h-3 w-3" />
              Exercise
            </Badge>
            <span>•</span>
          </div>
        )}
        <Badge variant="outline" className="capitalize">
          {question.question_type === "match_the_following" ? (
            <>
              <span className="inline md:hidden">Match</span>
              <span className="hidden md:inline">
                {formatQuestionType(question.question_type)}
              </span>
            </>
          ) : (
            formatQuestionType(question.question_type)
          )}
        </Badge>
        <span>•</span>
        <QuestionMarks
          marks={question.marks}
          editable={!isReadOnly}
          onUpdate={onMarksUpdate}
        />
        <span>•</span>
        <QuestionTags
          hardness={question.hardness_level}
          concepts={[]}
          editable={!isReadOnly}
          onHardnessUpdate={onHardnessUpdate}
        />
      </div>

      {/* Question Text */}
      <div className="flex gap-2 font-medium">
        {question.is_in_draft &&
          typeof question.position_in_draft === "number" && (
            <span className="font-semibold">{question.position_in_draft}.</span>
          )}
        <div className="flex-1">
          <QuestionText text={question.question_text || ""} />
        </div>
      </div>

      {/* Question Images */}
      {state.editedQuestion.images &&
        state.editedQuestion.images.length > 0 && (
          <QuestionImages
            images={state.editedQuestion.images}
            className="my-3"
            onDelete={state.handleDeleteImage}
            onEdit={state.handleEditSvg}
          />
        )}

      {/* Options / Answer */}
      {isMcqOrMsq ? (
        <QuestionOptions question={question} showCorrect={true} />
      ) : question.question_type === "match_the_following" ? (
        <QuestionMatchTheFollowing question={question} />
      ) : (
        question.answer_text && <AnswerToggle answer={question.answer_text} />
      )}

      {/* Explanation - Read More Style */}
      {question.explanation && (
        <ExplanationToggle explanation={question.explanation} />
      )}
    </div>
  );
}
