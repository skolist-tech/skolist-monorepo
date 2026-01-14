import { useState } from "react";
import { formatQuestionType } from "../../../utils/formatters";
import {
  Button,
  Input,
  Textarea,
  Badge,
  Label,
  Checkbox,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@skolist/ui";
import {
  ArrowRight,
  ArrowLeft,
  Edit2,
  Check,
  X,
  Trash2,
  ChevronUp,
  ChevronDown,
  RefreshCw,
  MessageSquarePlus,
  Send,
  Info,
} from "lucide-react";
import type { GeneratedQuestion, HardnessLevel } from "@skolist/db";
import { type GeneratedQuestionWithConcepts } from "../../../services/questionService";
import { QuestionMarks } from "./QuestionMarks";
import { QuestionTags } from "./QuestionTags";
import { QuestionText } from "./QuestionText";
import { QuestionOptions } from "./QuestionOptions";
import { QuestionImages } from "./QuestionImages";
import { LatexRenderer } from "../LatexRenderer";

interface GeneratedQuestionCardProps {
  question: GeneratedQuestionWithConcepts;
  onMoveToDraft: (id: string) => void;
  onRemoveFromDraft?: (id: string) => void;
  onUpdate?: (updatedQuestion: GeneratedQuestionWithConcepts) => void;
  onDelete?: (id: string) => Promise<void>;
  onDirectRegenerate?: () => void;
  onRegenerate?: (prompt: string, image?: File) => void;
  index?: number; // Kept for reference if needed, but won't be displayed as rank
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  showReorder?: boolean;
  isSelected?: boolean;
  onSelect?: (selected: boolean) => void;
}

export function GeneratedQuestionCard({
  question,
  onMoveToDraft,
  onRemoveFromDraft,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  onDirectRegenerate,
  onRegenerate,
  showReorder = false,
  isSelected = false,
  onSelect,
}: GeneratedQuestionCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedQuestion, setEditedQuestion] =
    useState<GeneratedQuestionWithConcepts>(question);
  // Replaced modal state with popover state (controlled if needed, or just for inputs)
  const [prompt, setPrompt] = useState("");
  const [isRegenerateOpen, setIsRegenerateOpen] = useState(false);

  const handleSave = () => {
    if (onUpdate) {
      onUpdate(editedQuestion);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedQuestion(question);
    setIsEditing(false);
  };

  const handleRegenerateSubmit = () => {
    if (onRegenerate && prompt.trim()) {
      onRegenerate(prompt);
      setPrompt("");
      setIsRegenerateOpen(false);
    }
  };

  const updateField = <K extends keyof GeneratedQuestion>(
    field: K,
    value: GeneratedQuestion[K]
  ) => {
    setEditedQuestion((prev) => ({ ...prev, [field]: value }));
  };

  const isMcqOrMsq = ["mcq4", "msq4"].includes(question.question_type);

  if (isEditing) {
    return (
      <div className="relative rounded-lg border bg-background p-4 shadow-sm">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold capitalize text-muted-foreground">
              Editing {question.question_type.replace(/_/g, " ")}
            </span>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave}>
                <Check className="mr-1 h-3 w-3" />
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancel}>
                <X className="mr-1 h-3 w-3" />
                Cancel
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Question Text</Label>
            <Textarea
              value={editedQuestion.question_text || ""}
              onChange={(e) => updateField("question_text", e.target.value)}
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
                  onChange={(e) => updateField("option1", e.target.value)}
                />
                <Input
                  placeholder="Option B"
                  value={editedQuestion.option2 || ""}
                  onChange={(e) => updateField("option2", e.target.value)}
                />
                <Input
                  placeholder="Option C"
                  value={editedQuestion.option3 || ""}
                  onChange={(e) => updateField("option3", e.target.value)}
                />
                <Input
                  placeholder="Option D"
                  value={editedQuestion.option4 || ""}
                  onChange={(e) => updateField("option4", e.target.value)}
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
                      updateField(
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
                onChange={(e) => updateField("answer_text", e.target.value)}
                placeholder="Enter the answer here..."
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Explanation</Label>
            <Textarea
              value={editedQuestion.explanation || ""}
              onChange={(e) => updateField("explanation", e.target.value)}
              placeholder="Explanation..."
              className="min-h-[60px]"
            />
          </div>

          <div className="flex gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Marks</Label>
              <Input
                type="number"
                value={editedQuestion.marks}
                onChange={(e) => updateField("marks", parseInt(e.target.value))}
                className="w-20"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Hardness</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={editedQuestion.hardness_level}
                onChange={(e) =>
                  updateField("hardness_level", e.target.value as HardnessLevel)
                }
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`group relative rounded-lg border bg-background p-4 shadow-sm transition-all hover:shadow-md ${
        isSelected ? "border-primary ring-2 ring-primary" : ""
      }`}
    >
      {/* Selection Checkbox */}
      {onSelect && (
        <div className="absolute left-3 top-3.5 z-10">
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onSelect(checked === true)}
            aria-label="Select question"
          />
        </div>
      )}
      {/* Header Actions */}
      <div className="absolute right-2 top-2 flex items-center rounded-md bg-background/80 p-1 backdrop-blur-sm">
        <Button
          size="icon"
          variant="ghost"
          onClick={onDirectRegenerate}
          title="Direct Regenerate"
          disabled={!onDirectRegenerate}
        >
          <RefreshCw className="h-4 w-4 text-muted-foreground hover:text-primary" />
        </Button>

        <Popover open={isRegenerateOpen} onOpenChange={setIsRegenerateOpen}>
          <PopoverTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              title="Regenerate with Prompt"
              disabled={!onRegenerate}
            >
              <MessageSquarePlus className="h-4 w-4 text-muted-foreground hover:text-primary" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-3" align="end">
            <div className="flex w-full items-start gap-2">
              <Textarea
                placeholder="Instructions..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="h-16 resize-none py-2"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleRegenerateSubmit();
                  }
                }}
              />
              <Button
                size="icon"
                className="mt-1 h-8 w-8 shrink-0"
                onClick={handleRegenerateSubmit}
              >
                <Send className="h-3 w-3" />
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        <Button
          size="icon"
          variant="ghost"
          onClick={() => setIsEditing(true)}
          title="Edit Question"
        >
          <Edit2 className="h-4 w-4 text-muted-foreground hover:text-primary" />
        </Button>

        {question.is_in_draft && onRemoveFromDraft ? (
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onRemoveFromDraft(question.id)}
            title="Remove from Draft"
          >
            <ArrowLeft className="h-4 w-4 text-red-500 hover:text-red-700" />
          </Button>
        ) : (
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onMoveToDraft(question.id)}
            title="Move to Draft"
          >
            <ArrowRight
              className="h-4 w-4 text-orange-500 hover:text-orange-700"
              strokeWidth={3}
            />
          </Button>
        )}

        {onDelete && (
          <Button
            size="icon"
            variant="ghost"
            onClick={() => {
              if (
                window.confirm(
                  "Are you sure you want to delete this question? This cannot be undone."
                )
              ) {
                onDelete(question.id);
              }
            }}
            title="Delete Question"
          >
            <Trash2 className="h-4 w-4 text-red-500 hover:text-red-700" />
          </Button>
        )}
      </div>

      <div className={`mb-2 space-y-3 pr-16 ${onSelect ? "pl-6" : ""}`}>
        {/* Meta info (Type, Marks, Hardness) */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline" className="capitalize">
            {formatQuestionType(question.question_type)}
          </Badge>
          <span>•</span>
          <QuestionMarks marks={question.marks} />
          <span>•</span>
          <QuestionTags hardness={question.hardness_level} concepts={[]} />
        </div>

        {/* Reorder Buttons */}
        {showReorder && (
          <div className="absolute -left-3 top-1/2 flex -translate-y-1/2 transform flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 rounded-full border bg-background shadow-sm hover:bg-muted"
              onClick={(e) => {
                e.stopPropagation();
                onMoveUp?.();
              }}
              title="Move Up"
            >
              <ChevronUp className="h-3 w-3" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 rounded-full border bg-background shadow-sm hover:bg-muted"
              onClick={(e) => {
                e.stopPropagation();
                onMoveDown?.();
              }}
              title="Move Down"
            >
              <ChevronDown className="h-3 w-3" />
            </Button>
          </div>
        )}

        {/* Question Text */}
        <div className="font-medium">
          <QuestionText text={question.question_text || ""} />
        </div>

        {/* Question Images */}
        {question.images && question.images.length > 0 && (
          <QuestionImages images={question.images} className="my-3" />
        )}

        {/* Options / Answer */}
        {isMcqOrMsq ? (
          <QuestionOptions question={question} showCorrect={true} />
        ) : (
          question.answer_text && (
            <div className="mt-2 rounded-md bg-muted/50 p-3 text-sm">
              <span className="font-semibold text-primary">Answer: </span>
              <LatexRenderer content={question.answer_text} />
            </div>
          )
        )}

        {/* Explanation */}
        {question.explanation && (
          <div className="mt-2 text-sm text-muted-foreground">
            <span className="font-semibold">Explanation: </span>
            <LatexRenderer content={question.explanation} />
          </div>
        )}
      </div>

      <div className="absolute bottom-2 right-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              title="View Concepts"
              className="h-9 w-9 text-muted-foreground hover:text-primary"
            >
              <Info className="!h-6 !w-6" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3" align="end">
            <h4 className="mb-2 text-sm font-medium leading-none">
              Related Concepts
            </h4>
            <div className="flex flex-wrap gap-1">
              {question.concepts && question.concepts.length > 0 ? (
                question.concepts.map((concept) => (
                  <Badge
                    key={concept.id}
                    variant="secondary"
                    className="text-xs"
                  >
                    {concept.name}
                  </Badge>
                ))
              ) : (
                <span className="text-xs text-muted-foreground">
                  No concepts linked
                </span>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
