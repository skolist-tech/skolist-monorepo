import { useState, useRef } from "react";
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
  Paperclip,
  Loader2,
  Sparkles,
  Undo2,
  Redo2,
} from "lucide-react";
import type { GeneratedQuestion, HardnessLevel } from "@skolist/db";
import {
  uploadQuestionImage,
  deleteQuestionImage,
  type GeneratedQuestionWithConcepts,
} from "../../../services/questionService";
import { fastApiService } from "../../../services/fastApiService";
import { QuestionMarks } from "./QuestionMarks";
import { QuestionTags } from "./QuestionTags";
import { QuestionText } from "./QuestionText";
import { QuestionOptions } from "./QuestionOptions";
import { QuestionImages } from "./QuestionImages";
import { LatexRenderer } from "../LatexRenderer";
import { ConfirmDialog } from "../ConfirmDialog";

interface GeneratedQuestionCardProps {
  question: GeneratedQuestionWithConcepts;
  onMoveToDraft: (id: string) => void;
  onRemoveFromDraft?: (id: string) => void;
  onUpdate?: (updatedQuestion: GeneratedQuestionWithConcepts) => void;
  onDelete?: (id: string) => Promise<void>;
  onDirectRegenerate?: () => void;
  onRegenerate?: (prompt: string, files: File[]) => void;
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
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New state for attachments
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [isAttaching, setIsAttaching] = useState(false);
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

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
    if (onRegenerate && (prompt.trim() || attachedFiles.length > 0)) {
      onRegenerate(prompt, attachedFiles);
      setPrompt("");
      setAttachedFiles([]);
      setIsRegenerateOpen(false);
    }
  };

  const handleAttachmentSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsAttaching(true);
    // Simulate upload delay
    setTimeout(() => {
      setAttachedFiles((prev) => [...prev, ...files]);
      setIsAttaching(false);
      // Reset input
      if (attachmentInputRef.current) {
        attachmentInputRef.current.value = "";
      }
    }, 1500);
  };

  const handleRemoveAttachment = (indexToRemove: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== indexToRemove));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const { imgUrl } = await uploadQuestionImage(file, question.id);

      // Construct a new image object (optimistic or from result)
      // Since the API doesn't return the full DB object, we mock strictly what's needed for display
      const newImage = {
        id: crypto.randomUUID(), // Temporary ID for React key
        gen_question_id: question.id,
        img_url: imgUrl,
        position: (question.images?.length || 0) + 1,
        created_at: new Date().toISOString(),
        svg_string: null,
      } as any;

      const updatedQuestion = {
        ...question,
        images: [...(question.images || []), newImage],
      };

      // update local state
      setEditedQuestion(updatedQuestion);

      // notify parent
      if (onUpdate) {
        onUpdate(updatedQuestion);
      }
    } catch (error) {
      console.error("Upload failed", error);
      alert("Failed to upload image");
    } finally {
      setIsUploading(false);
      // clear input so same file can be selected again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleBeautify = async () => {
    try {
      await fastApiService.beautifyQuestion(question.id);
    } catch (error) {
      console.error("Failed to auto-correct question", error);
      alert("Failed to auto-correct question");
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    try {
      if (!window.confirm("Are you sure you want to delete this image?")) {
        return;
      }

      await deleteQuestionImage(imageId);

      const updatedQuestion = {
        ...question,
        images: (question.images || []).filter((img) => img.id !== imageId),
      };

      // update local state
      setEditedQuestion(updatedQuestion);

      // notify parent
      if (onUpdate) {
        onUpdate(updatedQuestion);
      }
    } catch (error) {
      console.error("Failed to delete image", error);
      alert("Failed to delete image");
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

          <div className="flex items-end gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Marks</Label>
              <Input
                type="number"
                value={editedQuestion.marks}
                onChange={(e) => updateField("marks", parseInt(e.target.value))}
                className="h-9 w-20"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Hardness</Label>
              <select
                className="flex h-9 w-auto min-w-[100px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
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

            {/* hidden input for edit mode upload */}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleImageUpload}
              // Note: We reuse the same ref and handler as the view mode
              // ensuring checking isUploading works correctly
            />

            <Button
              size="sm"
              className="h-9 gap-2 px-3"
              onClick={() => fileInputRef.current?.click()}
              title="Attach Image"
              disabled={isUploading}
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Paperclip className="h-4 w-4" />
              )}
              <span>Upload Image</span>
            </Button>
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
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleImageUpload}
        />
        <Button
          size="icon"
          variant="ghost"
          onClick={handleBeautify}
          title="Auto-Correct Question"
        >
          <Sparkles className="h-5 w-5 text-yellow-400" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => fileInputRef.current?.click()}
          title="Attach Image"
          disabled={isUploading}
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <Paperclip className="h-4 w-4 text-muted-foreground hover:text-primary" />
          )}
        </Button>
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
          <PopoverContent className="w-96 p-3" align="end">
            <div className="flex w-full items-start gap-3">
              <div className="flex flex-1 flex-col gap-2">
                <Textarea
                  placeholder="Ask AI to improve, modify, or extract this question from an image…"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="h-16 resize-none py-2 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleRegenerateSubmit();
                    }
                  }}
                />

                {/* File Chips */}
                {attachedFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {attachedFiles.map((file, i) => (
                      <div
                        key={i}
                        className="flex max-w-[150px] items-center gap-1 rounded-full border bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
                        title={file.name}
                      >
                        <span className="truncate">{file.name}</span>
                        <button
                          className="ml-1 rounded-full p-0.5 hover:bg-black/10"
                          onClick={() => handleRemoveAttachment(i)}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={handleRegenerateSubmit}
                  title="Send"
                >
                  <Send className="h-4 w-4" />
                </Button>

                <input
                  type="file"
                  multiple
                  ref={attachmentInputRef}
                  className="hidden"
                  onChange={handleAttachmentSelect}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 shrink-0 border"
                  title="Attach file"
                  disabled={isAttaching}
                  onClick={() => attachmentInputRef.current?.click()}
                >
                  {isAttaching ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : (
                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
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
            onClick={() => setIsDeleteModalOpen(true)}
            title="Delete Question"
          >
            <Trash2 className="h-4 w-4 text-red-500 hover:text-red-700" />
          </Button>
        )}
      </div>

      <ConfirmDialog
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        title="Delete Question"
        description="Are you sure you want to delete this question? This action cannot be undone."
        onConfirm={() => onDelete && onDelete(question.id)}
        variant="destructive"
        confirmLabel="Delete"
      />

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
          <span>•</span>

          <div className="mr-1 flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 text-muted-foreground hover:text-primary"
              title="Undo"
              disabled
            >
              <Undo2 className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 text-muted-foreground hover:text-primary"
              title="Redo"
              disabled
            >
              <Redo2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Reorder Buttons */}
        {showReorder && (
          <div className="absolute -right-3 top-1/2 flex -translate-y-1/2 transform flex-col gap-1">
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
        <div className="flex gap-2 font-medium">
          {question.is_in_draft &&
            typeof question.position_in_draft === "number" && (
              <span className="font-semibold">
                {question.position_in_draft}.
              </span>
            )}
          <div className="flex-1">
            <QuestionText text={question.question_text || ""} />
          </div>
        </div>

        {/* Question Images */}
        {question.images && question.images.length > 0 && (
          <QuestionImages
            images={question.images}
            className="my-3"
            onDelete={handleDeleteImage}
          />
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
