import {
  Button,
  Input,
  Textarea,
  Label,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@skolist/ui";
import { Check, X, Loader2, Paperclip } from "lucide-react";
import type { GeneratedQuestion, HardnessLevel } from "@skolist/db";
import type { GeneratedQuestionWithConcepts } from "../../../../services/questionService";

interface QuestionCardEditFormProps {
  question: GeneratedQuestionWithConcepts; // Original question (for type check)
  editedQuestion: GeneratedQuestionWithConcepts; // Mutable state
  onUpdateField: <K extends keyof GeneratedQuestion>(
    field: K,
    value: GeneratedQuestion[K]
  ) => void;
  onSave: () => void;
  onCancel: () => void;
  isUploading: boolean;
  onUploadClick: () => void;
  // We pass the ref from the parent hook if needed, or handle click via prop
}

export function QuestionCardEditForm({
  question,
  editedQuestion,
  onUpdateField,
  onSave,
  onCancel,
  isUploading,
  onUploadClick,
}: QuestionCardEditFormProps) {
  const isMcqOrMsq = ["mcq4", "msq4"].includes(question.question_type);

  return (
    <div className="relative rounded-lg border bg-background p-4 shadow-sm">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold capitalize text-muted-foreground">
            Editing {question.question_type.replace(/_/g, " ")}
          </span>
          <div className="flex gap-2">
            <Button size="sm" onClick={onSave}>
              <Check className="mr-1 h-3 w-3" />
              Save
            </Button>
            <Button size="sm" variant="outline" onClick={onCancel}>
              <X className="mr-1 h-3 w-3" />
              Cancel
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Question Text</Label>
          <Textarea
            value={editedQuestion.question_text || ""}
            onChange={(e) => onUpdateField("question_text", e.target.value)}
            className="min-h-[80px]"
          />
        </div>

        {isMcqOrMsq && (
          <div className="space-y-2">
            <Label>Options</Label>
            <div className="grid gap-2">
              <Input
                placeholder="Option A"
                value={editedQuestion.option1 || ""}
                onChange={(e) => onUpdateField("option1", e.target.value)}
              />
              <Input
                placeholder="Option B"
                value={editedQuestion.option2 || ""}
                onChange={(e) => onUpdateField("option2", e.target.value)}
              />
              <Input
                placeholder="Option C"
                value={editedQuestion.option3 || ""}
                onChange={(e) => onUpdateField("option3", e.target.value)}
              />
              <Input
                placeholder="Option D"
                value={editedQuestion.option4 || ""}
                onChange={(e) => onUpdateField("option4", e.target.value)}
              />
            </div>

            {question.question_type === "mcq4" && (
              <div className="mt-2">
                <Label className="text-xs">Correct Option (1-4)</Label>
                <Input
                  type="number"
                  min="1"
                  max="4"
                  value={editedQuestion.correct_mcq_option || ""}
                  onChange={(e) =>
                    onUpdateField(
                      "correct_mcq_option",
                      parseInt(e.target.value)
                    )
                  }
                  className="w-20"
                />
              </div>
            )}
          </div>
        )}

        {!isMcqOrMsq && (
          <div className="space-y-2">
            <Label>Answer Text</Label>
            <Textarea
              value={editedQuestion.answer_text || ""}
              onChange={(e) => onUpdateField("answer_text", e.target.value)}
              placeholder="Enter the answer here..."
            />
          </div>
        )}

        <div className="space-y-2">
          <Label>Explanation</Label>
          <Textarea
            value={editedQuestion.explanation || ""}
            onChange={(e) => onUpdateField("explanation", e.target.value)}
            placeholder="Explanation..."
            className="min-h-[60px]"
          />
        </div>

        <div className="flex items-end gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Marks</Label>
            <Input
              type="number"
              value={editedQuestion.marks}
              onChange={(e) => onUpdateField("marks", parseInt(e.target.value))}
              className="h-9 w-20"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Hardness</Label>
            <select
              className="flex h-9 w-auto min-w-[100px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              value={editedQuestion.hardness_level}
              onChange={(e) =>
                onUpdateField("hardness_level", e.target.value as HardnessLevel)
              }
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  className="gap-2"
                  onClick={onUploadClick}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Paperclip className="h-4 w-4" />
                  )}
                  <span>Upload Image</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Attach Image</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
}
