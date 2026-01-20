import { useState, useRef, useEffect, useMemo } from "react";
import { toBlob } from "html-to-image";
import Lottie from "lottie-react";
import chatAnimationData from "../../../../public/Chat.json";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  useToast,
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
  MessageSquare,
  Send,
  Info,
  Paperclip,
  Loader2,
  Sparkles,
  Undo2,
  Redo2,
  MoreVertical,
} from "lucide-react";
import type { GeneratedQuestion, HardnessLevel } from "@skolist/db";
import {
  uploadQuestionImage,
  deleteQuestionImage,
  type GeneratedQuestionWithConcepts,
} from "../../../services/questionService";
import { CARD_ACTIONS_CONFIG, type ActionId } from "./card-actions-config";
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
  isAnimating?: boolean; // External trigger for slide animation (used for bulk moves)
  onAutoCorrect?: (questionId: string) => Promise<void>; // Optional override for auto-correct (useful for Storybook)
  onRegenerateWithPrompt?: (
    questionId: string,
    prompt: string,
    files: File[]
  ) => Promise<void>; // Optional override for regenerate with prompt (useful for Storybook)
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
  isAnimating = false,
  onAutoCorrect,
  onRegenerateWithPrompt,
}: GeneratedQuestionCardProps) {
  // Refs for animation positioning
  const cardRef = useRef<HTMLDivElement>(null);
  const autoCorrectBtnRef = useRef<HTMLButtonElement>(null);
  const regenerateBtnRef = useRef<HTMLButtonElement>(null);
  const { toast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [editedQuestion, setEditedQuestion] =
    useState<GeneratedQuestionWithConcepts>(question);

  // Sync images from question prop when they change (via realtime subscription)
  // This keeps uploaded/deleted images in sync without overwriting other local edits
  useEffect(() => {
    setEditedQuestion((prev) => ({
      ...prev,
      images: question.images,
    }));
  }, [question.images]);
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
  const [isDeleteImageModalOpen, setIsDeleteImageModalOpen] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);
  const [isAutoCorrecting, setIsAutoCorrecting] = useState(false);
  const [isReturning, setIsReturning] = useState(false);
  // State to store the calculated origin point for the sparkle
  const [sparkleOrigin, setSparkleOrigin] = useState({ top: 12, right: 12 });

  // Regenerate animation states
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isRegenerateReturning, setIsRegenerateReturning] = useState(false);
  const [regenerateOrigin, setRegenerateOrigin] = useState({
    top: 12,
    right: 12,
  });

  // Chat prompt animation states
  const [isChatPromptAnimating, setIsChatPromptAnimating] = useState(false);
  // Store the question text when animation starts to detect actual changes
  const questionTextAtAnimationStart = useRef<string | null>(null);

  // Watch for question changes while chat prompt animation is running
  // Stop animation 1 second after data actually updates
  useEffect(() => {
    // Only trigger if animation is running AND question has actually changed from when animation started
    if (
      isChatPromptAnimating &&
      questionTextAtAnimationStart.current !== null &&
      question.question_text !== questionTextAtAnimationStart.current
    ) {
      const timer = setTimeout(() => {
        setIsChatPromptAnimating(false);
        setPrompt("");
        setAttachedFiles([]);
        questionTextAtAnimationStart.current = null;
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [question.question_text, isChatPromptAnimating]);

  // Slide animation states
  const [slideDirection, setSlideDirection] = useState<"left" | "right" | null>(
    null
  );

  // Watch for external animation trigger (bulk moves)
  useEffect(() => {
    if (isAnimating && !slideDirection) {
      setSlideDirection("right");
    }
  }, [isAnimating, slideDirection]);

  // Disintegration animation state for delete
  const [isDisintegrating, setIsDisintegrating] = useState(false);

  // Pre-generate random particle data for disintegration animation
  const particleData = useMemo(
    () =>
      Array.from({ length: 60 }).map(() => ({
        size: Math.random() * 6 + 2,
        left: Math.random() * 100,
        top: Math.random() * 100,
        duration: 0.8 + Math.random() * 0.7,
        delay: Math.random() * 0.5,
        xOffset: (Math.random() > 0.5 ? 1 : -1) * (20 + Math.random() * 60),
        yOffset: -(60 + Math.random() * 120),
        rotation: Math.random() * 360,
      })),
    []
  );

  const handleDeleteWithAnimation = async () => {
    setIsDeleteModalOpen(false);
    setIsDisintegrating(true);
    // Wait for disintegration animation to complete
    await new Promise((resolve) => setTimeout(resolve, 1500));
    if (onDelete) {
      await onDelete(question.id);
    }
  };

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

  const handleRegenerateSubmit = async () => {
    if (onRegenerate && (prompt.trim() || attachedFiles.length > 0)) {
      // Close the popover first
      setIsRegenerateOpen(false);

      try {
        // Store current question text to detect when it changes
        questionTextAtAnimationStart.current = question.question_text;
        setIsChatPromptAnimating(true);

        // If there's an override for regenerate with prompt (Storybook), call it
        if (onRegenerateWithPrompt) {
          await onRegenerateWithPrompt(question.id, prompt, attachedFiles);
          // For Storybook, wait 1 second then stop animation manually since question won't change
          await new Promise((resolve) => setTimeout(resolve, 1000));
          setIsChatPromptAnimating(false);
          setPrompt("");
          setAttachedFiles([]);
          questionTextAtAnimationStart.current = null;
        } else {
          // Call the actual regenerate function
          // Animation will stop via useEffect when question prop changes
          onRegenerate(prompt, attachedFiles);
        }
      } catch (error) {
        console.error("Failed during regenerate with prompt", error);
        setIsChatPromptAnimating(false);
        setPrompt("");
        setAttachedFiles([]);
        questionTextAtAnimationStart.current = null;
      }
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
      await uploadQuestionImage(file, question.id);

      // Don't create optimistic update with temporary UUID
      // Realtime subscription INSERT event will add the image with real database UUID
      // This ensures deletions work correctly (no temp UUIDs sent to API)

      // Keep isUploading true briefly so user sees the loading state
      // The image will appear once the realtime subscription fires
      await new Promise((resolve) => setTimeout(resolve, 500));
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
  const handleAutoCorrect = async () => {
    // 1. Calculate animation origin
    if (cardRef.current && autoCorrectBtnRef.current) {
      const cardRect = cardRef.current.getBoundingClientRect();
      const btnRect = autoCorrectBtnRef.current.getBoundingClientRect();
      setSparkleOrigin({
        top: btnRect.top - cardRect.top + 6,
        right: cardRect.right - btnRect.right + 6,
      });
    }

    try {
      // 2. Start Animation
      setIsAutoCorrecting(true);
      setIsReturning(false);

      // 3. Tiny yield to let the browser paint the "start" of the animation
      await new Promise((resolve) => setTimeout(resolve, 50));

      // 4. Capture Image using html-to-image (Faster & Lighter)
      let imageBlob: Blob | undefined;
      if (cardRef.current) {
        try {
          // html-to-image is much faster because it uses SVG foreignObject
          imageBlob =
            (await toBlob(cardRef.current, {
              cacheBust: true,
              skipAutoScale: true,
              backgroundColor: "#ffffff", // Ensure white bg if transparent
              filter: (node) => {
                // Exclude elements with the ignore class
                return !node.hasAttribute?.("data-html2canvas-ignore");
              },
            })) ?? undefined; // Handle potential null return
        } catch (error) {
          console.warn("Failed to capture screenshot:", error);
        }
      }

      // 5. API Call
      if (onAutoCorrect) {
        await onAutoCorrect(question.id);
      } else {
        await fastApiService.autoCorrectQuestion(question.id, imageBlob);
      }

      // 6. Finish Animation
      setIsReturning(true);
      await new Promise((resolve) => setTimeout(resolve, 800));
    } catch (error) {
      console.error("Failed to auto-correct question", error);
      alert("Failed to auto-correct question");
    } finally {
      setIsAutoCorrecting(false);
      setIsReturning(false);
    }
  };

  const handleDirectRegenerate = async () => {
    // Calculate the position of the button relative to the card before starting animation
    if (cardRef.current && regenerateBtnRef.current) {
      const cardRect = cardRef.current.getBoundingClientRect();
      const btnRect = regenerateBtnRef.current.getBoundingClientRect();

      const relativeTop = btnRect.top - cardRect.top + 6;
      const relativeRight = cardRect.right - btnRect.right + 6;

      setRegenerateOrigin({ top: relativeTop, right: relativeRight });
    }

    try {
      setIsRegenerating(true);
      setIsRegenerateReturning(false);

      // Call the regenerate API or use the optional override
      if (onDirectRegenerate) {
        await Promise.resolve(onDirectRegenerate());
      } else {
        await fastApiService.regenerateQuestion(question.id);
      }

      // Trigger return animation
      setIsRegenerateReturning(true);
      // Wait for return animation to complete before hiding
      await new Promise((resolve) => setTimeout(resolve, 800));
    } catch (error) {
      console.error("Failed to regenerate question", error);
      alert("Failed to regenerate question");
    } finally {
      setIsRegenerating(false);
      setIsRegenerateReturning(false);
    }
  };

  const handleMoveToDraft = async () => {
    setSlideDirection("right");
    // Wait for animation to complete
    await new Promise((resolve) => setTimeout(resolve, 400));
    onMoveToDraft(question.id);

    // Show success toast
    toast({
      title: "Moved to Draft",
      description: "1 question moved to draft successfully.",
      className: "bg-green-500 text-white border-green-600",
    });
    // Don't reset slideDirection - let the component stay hidden until parent removes it
  };

  const handleRemoveFromDraft = async () => {
    if (!onRemoveFromDraft) return;
    setSlideDirection("left");
    // Wait for animation to complete
    await new Promise((resolve) => setTimeout(resolve, 400));
    onRemoveFromDraft(question.id);
    // Don't reset slideDirection - let the component stay hidden until parent removes it
  };

  const handleDeleteImage = (imageId: string) => {
    setImageToDelete(imageId);
    setIsDeleteImageModalOpen(true);
  };

  const confirmDeleteImage = async () => {
    if (!imageToDelete) return;

    try {
      // Optimistically remove from local state for immediate UI feedback
      const updatedQuestion = {
        ...editedQuestion,
        images: (editedQuestion.images || []).filter(
          (img) => img.id !== imageToDelete
        ),
      };
      setEditedQuestion(updatedQuestion);

      // Delete from database
      await deleteQuestionImage(imageToDelete);

      // IMPORTANT: Manually update context because Supabase DELETE events
      // don't include gen_question_id in payload.old, so realtime subscription cannot update
      if (onUpdate) {
        onUpdate(updatedQuestion);
      }
    } catch (error) {
      console.error("[DELETE IMAGE] Failed to delete image:", error);
      // Revert optimistic update on error
      setEditedQuestion(question);
      toast({
        title: "Error",
        description: "Failed to delete image",
        variant: "destructive",
      });
    } finally {
      setIsDeleteImageModalOpen(false);
      setImageToDelete(null);
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

            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    className="gap-2"
                    onClick={() => fileInputRef.current?.click()}
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

  return (
    <div
      ref={cardRef}
      className={`group relative rounded-lg border bg-background p-4 shadow-sm transition-all hover:shadow-md ${
        isSelected ? "border-primary ring-2 ring-primary" : ""
      } ${slideDirection ? "pointer-events-none" : ""} ${isDisintegrating ? "pointer-events-none" : ""}`}
      style={{
        animation:
          slideDirection === "right"
            ? "slideOutRight 0.4s ease-in forwards"
            : slideDirection === "left"
              ? "slideOutLeft 0.4s ease-in forwards"
              : isDisintegrating
                ? "disintegrate 1.5s ease-out forwards"
                : "none",
      }}
    >
      {/* Slide Animation Styles */}
      <style>{`
        @keyframes slideOutRight {
          0% {
            transform: translateX(0);
            opacity: 1;
          }
          100% {
            transform: translateX(100%);
            opacity: 0;
          }
        }
        @keyframes slideOutLeft {
          0% {
            transform: translateX(0);
            opacity: 1;
          }
          100% {
            transform: translateX(-100%);
            opacity: 0;
          }
        }
        @keyframes disintegrate {
          0% {
            opacity: 1;
            filter: blur(0px);
            transform: scale(1);
          }
          30% {
            opacity: 0.8;
            filter: blur(1px);
            transform: scale(1.02);
          }
          100% {
            opacity: 0;
            filter: blur(8px);
            transform: scale(0.95) translateY(-20px);
          }
        }
        @keyframes delayedFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes dots {
          0% { content: ''; }
          25% { content: '.'; }
          50% { content: '..'; }
          75% { content: '...'; }
        }
      `}</style>

      {/* Disintegration Particle Animation Overlay */}
      {isDisintegrating && (
        <div className="pointer-events-none absolute inset-0 z-50 overflow-visible rounded-lg">
          {/* Generate multiple particles */}
          {particleData.map((particle, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={
                {
                  width: `${particle.size}px`,
                  height: `${particle.size}px`,
                  left: `${particle.left}%`,
                  top: `${particle.top}%`,
                  backgroundColor: `hsl(${Math.random() * 30 + 10}, 10%, ${50 + Math.random() * 30}%)`,
                  opacity: 0,
                  "--x-offset": `${particle.xOffset}px`,
                  "--y-offset": `${particle.yOffset}px`,
                  "--rotation": `${particle.rotation}deg`,
                  animation: `particle-float-${i % 4} ${particle.duration}s ease-out ${particle.delay}s forwards`,
                } as React.CSSProperties
              }
            />
          ))}
          <style>{`
            @keyframes particle-float-0 {
              0% {
                opacity: 0.9;
                transform: translate(0, 0) scale(1) rotate(0deg);
              }
              100% {
                opacity: 0;
                transform: translate(var(--x-offset), var(--y-offset)) scale(0.2) rotate(180deg);
              }
            }
            @keyframes particle-float-1 {
              0% {
                opacity: 0.85;
                transform: translate(0, 0) scale(1) rotate(0deg);
              }
              50% {
                opacity: 0.5;
              }
              100% {
                opacity: 0;
                transform: translate(var(--x-offset), var(--y-offset)) scale(0.1) rotate(-180deg);
              }
            }
            @keyframes particle-float-2 {
              0% {
                opacity: 0.9;
                transform: translate(0, 0) scale(1);
              }
              30% {
                opacity: 0.7;
                transform: translate(calc(var(--x-offset) * 0.3), calc(var(--y-offset) * 0.2)) scale(0.8);
              }
              100% {
                opacity: 0;
                transform: translate(var(--x-offset), var(--y-offset)) scale(0);
              }
            }
            @keyframes particle-float-3 {
              0% {
                opacity: 0.8;
                transform: translate(0, 0) scale(1) rotate(0deg);
              }
              60% {
                opacity: 0.4;
              }
              100% {
                opacity: 0;
                transform: translate(var(--x-offset), var(--y-offset)) scale(0.15) rotate(270deg);
              }
            }
          `}</style>
        </div>
      )}

      {/* Auto-Correct Animation Overlay */}
      {isAutoCorrecting && (
        <div
          data-html2canvas-ignore
          className="absolute inset-0 z-50 overflow-hidden rounded-lg"
          style={
            {
              "--origin-top": `${sparkleOrigin.top}px`,
              "--origin-right": `${sparkleOrigin.right}px`,
            } as React.CSSProperties
          }
        >
          {/* Text Below Icon */}
          {!isReturning && (
            <div
              className="absolute left-1/2 z-20 -translate-x-1/2 text-center"
              style={{
                top: "calc(50% + 40px)",
                animation: "delayedFadeIn 0.3s ease-out 0.8s forwards",
                opacity: 0,
              }}
            >
              <span className="text-lg font-bold text-foreground">
                We Are correcting
              </span>
              <span className="text-lg font-bold text-foreground after:inline-block after:min-w-[1.5em] after:animate-[dots_2s_infinite_steps(1)] after:text-left after:content-['']" />
            </div>
          )}
          {/* Glassy blur overlay with pulsing animation */}
          <div
            className="absolute inset-0 bg-background/60"
            style={{
              animation: isReturning
                ? "blurFadeOut 0.8s ease-out forwards"
                : "blurPulse 2s ease-in-out infinite",
              animationDelay: isReturning ? "0s" : "0.8s",
            }}
          />
          {/* Sparkle with parabolic trajectory */}
          <div
            className="absolute z-10"
            style={{
              top: `${sparkleOrigin.top}px`,
              right: `${sparkleOrigin.right}px`,
              animation: isReturning
                ? "sparkleReturn 0.8s ease-in forwards"
                : "sparkleTrajectory 0.8s ease-out forwards",
            }}
          >
            <div
              style={{
                animation: isReturning
                  ? "none"
                  : "sparklePulse 1.5s ease-in-out infinite",
                animationDelay: "0.8s",
              }}
            >
              <Sparkles
                className="text-yellow-400 drop-shadow-lg"
                style={{
                  width: isReturning ? "64px" : "20px",
                  height: isReturning ? "64px" : "20px",
                  filter: "drop-shadow(0 0 10px rgba(250, 204, 21, 0.5))",
                  animation: isReturning
                    ? "sparkleShrink 0.8s ease-in forwards"
                    : "sparkleGrow 0.8s ease-out forwards",
                }}
              />
            </div>
          </div>
          <style>{`
            @keyframes sparkleTrajectory {
              0% {
                top: var(--origin-top);
                right: var(--origin-right);
                transform: translate(0, 0);
              }
              30% {
                transform: translate(-20%, 50%);
              }
              60% {
                transform: translate(-35%, 70%);
              }
              100% {
                top: 50%;
                right: 50%;
                transform: translate(50%, -50%);
              }
            }
            @keyframes sparkleReturn {
              0% {
                top: 50%;
                right: 50%;
                transform: translate(50%, -50%);
              }
              40% {
                transform: translate(35%, -70%);
              }
              70% {
                transform: translate(20%, -50%);
              }
              100% {
                top: var(--origin-top);
                right: var(--origin-right);
                transform: translate(0, 0);
              }
            }
            @keyframes sparkleGrow {
              0% {
                width: 20px;
                height: 20px;
              }
              100% {
                width: 64px;
                height: 64px;
              }
            }
            @keyframes sparkleShrink {
              0% {
                width: 64px;
                height: 64px;
              }
              100% {
                width: 20px;
                height: 20px;
              }
            }
            @keyframes sparklePulse {
              0%, 100% {
                transform: scale(1);
                opacity: 0.8;
              }
              50% {
                transform: scale(1.25);
                opacity: 1;
                filter: drop-shadow(0 0 20px rgba(250, 204, 21, 0.8));
              }
            }
            @keyframes blurPulse {
              0%, 100% {
                backdrop-filter: blur(2px);
                background-color: rgba(255, 255, 255, 0.4);
              }
              50% {
                backdrop-filter: blur(8px);
                background-color: rgba(255, 255, 255, 0.7);
              }
            }
            @keyframes blurFadeOut {
              0% {
                backdrop-filter: blur(8px);
                background-color: rgba(255, 255, 255, 0.7);
              }
              100% {
                backdrop-filter: blur(0px);
                background-color: rgba(255, 255, 255, 0);
              }
            }
          `}</style>
        </div>
      )}

      {/* Regenerate Animation Overlay */}
      {isRegenerating && (
        <div
          className="absolute inset-0 z-50 overflow-hidden rounded-lg"
          style={
            {
              "--regen-origin-top": `${regenerateOrigin.top}px`,
              "--regen-origin-right": `${regenerateOrigin.right}px`,
            } as React.CSSProperties
          }
        >
          {/* Text Below Icon */}
          {!isRegenerateReturning && (
            <div
              className="absolute left-1/2 z-20 -translate-x-1/2 text-center"
              style={{
                top: "calc(50% + 40px)",
                animation: "delayedFadeIn 0.3s ease-out 0.8s forwards",
                opacity: 0,
              }}
            >
              <span className="text-lg font-bold text-foreground">
                Regenerating
              </span>
              <span className="text-lg font-bold text-foreground after:inline-block after:min-w-[1.5em] after:animate-[dots_2s_infinite_steps(1)] after:text-left after:content-['']" />
            </div>
          )}
          {/* Glassy blur overlay with pulsing animation */}
          <div
            className="absolute inset-0 bg-background/60"
            style={{
              animation: isRegenerateReturning
                ? "regenBlurFadeOut 0.8s ease-out forwards"
                : "regenBlurPulse 2s ease-in-out infinite",
              animationDelay: isRegenerateReturning ? "0s" : "0.8s",
            }}
          />
          {/* RefreshCw with parabolic trajectory and rotation */}
          <div
            className="absolute z-10"
            style={{
              top: `${regenerateOrigin.top}px`,
              right: `${regenerateOrigin.right}px`,
              animation: isRegenerateReturning
                ? "regenReturn 0.8s ease-in forwards"
                : "regenTrajectory 0.8s ease-out forwards",
            }}
          >
            <div
              style={{
                animation: isRegenerateReturning
                  ? "none"
                  : "regenSpin 1s linear infinite",
                animationDelay: "0.8s",
              }}
            >
              <RefreshCw
                className="text-primary drop-shadow-lg"
                style={{
                  width: isRegenerateReturning ? "64px" : "16px",
                  height: isRegenerateReturning ? "64px" : "16px",
                  filter: "drop-shadow(0 0 10px rgba(59, 130, 246, 0.5))",
                  animation: isRegenerateReturning
                    ? "regenShrink 0.8s ease-in forwards"
                    : "regenGrow 0.8s ease-out forwards",
                }}
              />
            </div>
          </div>
          <style>{`
            @keyframes regenTrajectory {
              0% {
                top: var(--regen-origin-top);
                right: var(--regen-origin-right);
                transform: translate(0, 0);
              }
              30% {
                transform: translate(-20%, 50%);
              }
              60% {
                transform: translate(-35%, 70%);
              }
              100% {
                top: 50%;
                right: 50%;
                transform: translate(50%, -50%);
              }
            }
            @keyframes regenReturn {
              0% {
                top: 50%;
                right: 50%;
                transform: translate(50%, -50%);
              }
              40% {
                transform: translate(35%, -70%);
              }
              70% {
                transform: translate(20%, -50%);
              }
              100% {
                top: var(--regen-origin-top);
                right: var(--regen-origin-right);
                transform: translate(0, 0);
              }
            }
            @keyframes regenGrow {
              0% {
                width: 16px;
                height: 16px;
              }
              100% {
                width: 64px;
                height: 64px;
              }
            }
            @keyframes regenShrink {
              0% {
                width: 64px;
                height: 64px;
              }
              100% {
                width: 16px;
                height: 16px;
              }
            }
            @keyframes regenSpin {
              0% {
                transform: rotate(0deg);
              }
              100% {
                transform: rotate(360deg);
              }
            }
            @keyframes regenBlurPulse {
              0%, 100% {
                backdrop-filter: blur(2px);
                background-color: rgba(255, 255, 255, 0.4);
              }
              50% {
                backdrop-filter: blur(8px);
                background-color: rgba(255, 255, 255, 0.7);
              }
            }
            @keyframes regenBlurFadeOut {
              0% {
                backdrop-filter: blur(8px);
                background-color: rgba(255, 255, 255, 0.7);
              }
              100% {
                backdrop-filter: blur(0px);
                background-color: rgba(255, 255, 255, 0);
              }
            }
          `}</style>
        </div>
      )}

      {/* Chat Prompt Animation Overlay with Lottie */}
      {isChatPromptAnimating && (
        <div className="absolute inset-0 z-50 overflow-hidden rounded-lg">
          {/* Text Below Icon */}
          <div
            className="absolute left-1/2 z-20 -translate-x-1/2 text-center"
            style={{
              top: "calc(50% + 40px)",
              animation: "delayedFadeIn 0.3s ease-out 0.5s forwards",
              opacity: 0,
            }}
          >
            <span className="text-lg font-bold text-foreground">
              Regenerating with prompt
            </span>
            <span className="text-lg font-bold text-foreground after:inline-block after:min-w-[1.5em] after:animate-[dots_2s_infinite_steps(1)] after:text-left after:content-['']" />
          </div>

          {/* Glassy blur overlay with pulsing animation */}
          <div
            className="absolute inset-0 bg-background/60 backdrop-blur-sm"
            style={{
              animation: "chatBlurPulse 2s ease-in-out infinite",
            }}
          />
          {/* Lottie animation centered */}
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <div
              className="h-24 w-24"
              style={{
                animation: "lottieScaleIn 0.3s ease-out forwards",
              }}
            >
              <Lottie
                animationData={chatAnimationData}
                loop={true}
                autoplay={true}
                style={{ width: "100%", height: "100%" }}
              />
            </div>
          </div>
          <style>{`
            @keyframes chatBlurPulse {
              0%, 100% {
                backdrop-filter: blur(4px);
                background-color: rgba(255, 255, 255, 0.5);
              }
              50% {
                backdrop-filter: blur(8px);
                background-color: rgba(255, 255, 255, 0.7);
              }
            }
            @keyframes lottieScaleIn {
              0% {
                transform: scale(0.5);
                opacity: 0;
              }
              100% {
                transform: scale(1);
                opacity: 1;
              }
            }
          `}</style>
        </div>
      )}

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
      {/* Dynamic Header Actions */}
      <div className="absolute right-2 top-2 z-10 flex items-center gap-1 rounded-md bg-background/80 p-1 backdrop-blur-sm">
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleImageUpload}
        />
        <input
          type="file"
          multiple
          ref={attachmentInputRef}
          className="hidden"
          onChange={handleAttachmentSelect}
        />

        {/* Helper function content would be here, but we can't define functions inside render. 
            We'll inline the logic or use a render function defined above. 
            Actually, let's map over the config. */}
        {(() => {
          // Sort actions for desktop (filter by visibility)
          const desktopActions = [...CARD_ACTIONS_CONFIG]
            .filter((a) => a.desktop.visible)
            .sort((a, b) => a.desktop.order - b.desktop.order);

          // Sort actions for mobile (filter by visibility and location)
          const mobileCardActions = [...CARD_ACTIONS_CONFIG]
            .filter((a) => a.mobile.visible && a.mobile.location === "card")
            .sort((a, b) => a.mobile.order - b.mobile.order);

          const mobileMenuActions = [...CARD_ACTIONS_CONFIG]
            .filter((a) => a.mobile.visible && a.mobile.location === "menu")
            .sort((a, b) => a.mobile.order - b.mobile.order);

          // Component for rendering a single action
          const ActionButton = ({
            actionId,
            mode,
          }: {
            actionId: ActionId;
            mode: "icon" | "menu";
          }) => {
            const btnClass =
              mode === "menu"
                ? "flex w-full cursor-pointer items-center justify-start gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted"
                : "";
            const iconSizeClass = mode === "menu" ? "h-4 w-4" : "h-4 w-4"; // 16px is standard for both usually

            switch (actionId) {
              case "undo":
                return (
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size={mode === "menu" ? "default" : "icon"}
                          className={
                            mode === "menu"
                              ? btnClass
                              : "h-8 w-8 text-muted-foreground hover:text-primary"
                          }
                          disabled // Currently disabled as per original code
                          onClick={(e) => {
                            if (mode === "menu") e.stopPropagation();
                            // Add handler when available
                          }}
                        >
                          <Undo2 className={iconSizeClass} />
                          {mode === "menu" && <span>Undo</span>}
                        </Button>
                      </TooltipTrigger>
                      {mode === "icon" && (
                        <TooltipContent>
                          <p>Undo</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                );
              case "redo":
                return (
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size={mode === "menu" ? "default" : "icon"}
                          className={
                            mode === "menu"
                              ? btnClass
                              : "h-8 w-8 text-muted-foreground hover:text-primary"
                          }
                          disabled // Currently disabled
                          onClick={(e) => {
                            if (mode === "menu") e.stopPropagation();
                          }}
                        >
                          <Redo2 className={iconSizeClass} />
                          {mode === "menu" && <span>Redo</span>}
                        </Button>
                      </TooltipTrigger>
                      {mode === "icon" && (
                        <TooltipContent>
                          <p>Redo</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                );
              case "auto_correct":
                return (
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          ref={mode === "icon" ? autoCorrectBtnRef : undefined}
                          size={mode === "menu" ? "default" : "icon"}
                          variant="ghost"
                          className={mode === "menu" ? btnClass : undefined}
                          onClick={(e) => {
                            if (mode === "menu") e.stopPropagation();
                            handleAutoCorrect();
                          }}
                          disabled={isAutoCorrecting}
                        >
                          <Sparkles
                            className={`${iconSizeClass} text-yellow-400 ${isAutoCorrecting ? "opacity-50" : ""}`}
                          />
                          {mode === "menu" && <span>Auto-Correct</span>}
                        </Button>
                      </TooltipTrigger>
                      {mode === "icon" && (
                        <TooltipContent>
                          <p>Auto-Correct Question</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                );
              case "attachment":
                return (
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size={mode === "menu" ? "default" : "icon"}
                          variant="ghost"
                          className={mode === "menu" ? btnClass : undefined}
                          onClick={(e) => {
                            if (mode === "menu") e.stopPropagation();
                            fileInputRef.current?.click();
                          }}
                          disabled={isUploading}
                        >
                          {isUploading ? (
                            <Loader2
                              className={`${iconSizeClass} animate-spin text-muted-foreground`}
                            />
                          ) : (
                            <Paperclip
                              className={`${iconSizeClass} text-muted-foreground hover:text-primary`}
                            />
                          )}
                          {mode === "menu" && <span>Attach Image</span>}
                        </Button>
                      </TooltipTrigger>
                      {mode === "icon" && (
                        <TooltipContent>
                          <p>Attach Image</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                );
              case "regenerate":
                return (
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          ref={mode === "icon" ? regenerateBtnRef : undefined}
                          size={mode === "menu" ? "default" : "icon"}
                          variant="ghost"
                          className={mode === "menu" ? btnClass : undefined}
                          onClick={(e) => {
                            if (mode === "menu") e.stopPropagation();
                            handleDirectRegenerate();
                          }}
                          disabled={isRegenerating}
                        >
                          <RefreshCw
                            className={`${iconSizeClass} text-muted-foreground hover:text-primary ${isRegenerating ? "opacity-50" : ""}`}
                          />
                          {mode === "menu" && <span>Regenerate</span>}
                        </Button>
                      </TooltipTrigger>
                      {mode === "icon" && (
                        <TooltipContent>
                          <p>Regenerate Question</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                );
              case "regenerate_with_prompt":
                return (
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size={mode === "menu" ? "default" : "icon"}
                          variant="ghost"
                          className={mode === "menu" ? btnClass : undefined}
                          disabled={!onRegenerate || isChatPromptAnimating}
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsRegenerateOpen(true);
                          }}
                        >
                          <MessageSquare
                            className={`${iconSizeClass} text-muted-foreground hover:text-primary ${isChatPromptAnimating ? "opacity-50" : ""}`}
                            style={{ transform: "scaleX(-1)" }}
                          />
                          {mode === "menu" && (
                            <span>Regenerate with Prompt</span>
                          )}
                        </Button>
                      </TooltipTrigger>
                      {mode === "icon" && (
                        <TooltipContent>
                          <p>Regenerate with Prompt</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                );
              case "edit":
                return (
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size={mode === "menu" ? "default" : "icon"}
                          variant="ghost"
                          className={mode === "menu" ? btnClass : undefined}
                          onClick={(e) => {
                            if (mode === "menu") e.stopPropagation();
                            setIsEditing(true);
                          }}
                        >
                          <Edit2
                            className={`${iconSizeClass} text-muted-foreground hover:text-primary`}
                          />
                          {mode === "menu" && <span>Edit Question</span>}
                        </Button>
                      </TooltipTrigger>
                      {mode === "icon" && (
                        <TooltipContent>
                          <p>Edit Question</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                );
              case "move":
                if (question.is_in_draft && onRemoveFromDraft) {
                  return (
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size={mode === "menu" ? "default" : "icon"}
                            variant="ghost"
                            className={mode === "menu" ? btnClass : undefined}
                            onClick={(e) => {
                              if (mode === "menu") e.stopPropagation();
                              handleRemoveFromDraft();
                            }}
                            disabled={slideDirection !== null}
                          >
                            <ArrowLeft
                              className={`${iconSizeClass} text-red-500 hover:text-red-700 ${slideDirection ? "opacity-50" : ""}`}
                            />
                            {mode === "menu" && <span>Remove from Draft</span>}
                          </Button>
                        </TooltipTrigger>
                        {mode === "icon" && (
                          <TooltipContent>
                            <p>Remove from Draft</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  );
                } else if (!question.is_in_draft) {
                  return (
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size={mode === "menu" ? "default" : "icon"}
                            variant="ghost"
                            className={mode === "menu" ? btnClass : undefined}
                            onClick={(e) => {
                              if (mode === "menu") e.stopPropagation();
                              handleMoveToDraft();
                            }}
                            disabled={slideDirection !== null}
                          >
                            <ArrowRight
                              className={`${iconSizeClass} text-orange-500 hover:text-orange-700 ${slideDirection ? "opacity-50" : ""}`}
                              strokeWidth={3}
                            />
                            {mode === "menu" && <span>Move to Draft</span>}
                          </Button>
                        </TooltipTrigger>
                        {mode === "icon" && (
                          <TooltipContent>
                            <p>Move to Draft</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  );
                }
                return null;
              case "delete":
                if (!onDelete) return null;
                return (
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size={mode === "menu" ? "default" : "icon"}
                          variant="ghost"
                          className={mode === "menu" ? btnClass : undefined}
                          onClick={(e) => {
                            if (mode === "menu") e.stopPropagation();
                            setIsDeleteModalOpen(true);
                          }}
                        >
                          <Trash2
                            className={`${iconSizeClass} text-red-500 hover:text-red-700`}
                          />
                          {mode === "menu" && <span>Delete Question</span>}
                        </Button>
                      </TooltipTrigger>
                      {mode === "icon" && (
                        <TooltipContent>
                          <p>Delete Question</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                );
              default:
                return null;
            }
          };

          return (
            <>
              {/* DESKTOP VIEW: Show all configured actions, sorted by desktop order */}
              <div className="hidden items-center md:flex">
                {desktopActions.map((action) => (
                  <ActionButton
                    key={action.id}
                    actionId={action.id}
                    mode="icon"
                  />
                ))}
              </div>

              {/* MOBILE VIEW: Split between card icons and 3-dot menu */}
              <div className="flex items-center md:hidden">
                {/* 1. Mobile Card Actions (Visible) */}
                {mobileCardActions.map((action) => (
                  <ActionButton
                    key={action.id}
                    actionId={action.id}
                    mode="icon"
                  />
                ))}

                {/* 2. Mobile Menu Actions (Inside 3-dots) */}
                {mobileMenuActions.length > 0 && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-56 bg-background p-2"
                      align="end"
                      portal={false}
                    >
                      <div className="flex flex-col gap-1">
                        {mobileMenuActions.map((action) => (
                          <ActionButton
                            key={action.id}
                            actionId={action.id}
                            mode="menu"
                          />
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </>
          );
        })()}
      </div>

      <ConfirmDialog
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        title="Delete Question"
        description="Are you sure you want to delete this question? This action cannot be undone."
        onConfirm={handleDeleteWithAnimation}
        variant="destructive"
        confirmLabel="Delete"
      />

      <ConfirmDialog
        open={isDeleteImageModalOpen}
        onOpenChange={setIsDeleteImageModalOpen}
        title="Delete Image"
        description="Are you sure you want to delete this image? This action cannot be undone."
        onConfirm={confirmDeleteImage}
        variant="destructive"
        confirmLabel="Delete"
      />

      {/* Regenerate with Prompt Popover - rendered outside ActionButton to prevent re-mount issues */}
      <Popover open={isRegenerateOpen} onOpenChange={setIsRegenerateOpen}>
        <PopoverTrigger asChild>
          <span className="absolute right-2 top-2 h-0 w-0" />
        </PopoverTrigger>
        <PopoverContent
          className="w-96 max-w-[calc(100vw-2rem)] p-3"
          align="end"
          side="bottom"
          collisionPadding={16}
        >
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

              {attachedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {attachedFiles.map((file, i) => (
                    <div
                      key={i}
                      className="flex max-w-[150px] items-center gap-1 rounded-full border bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
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
              >
                <Send className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 shrink-0 border"
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
        </div>

        {/* Reorder Buttons */}
        {showReorder && (
          <div className="absolute -right-3 top-1/2 flex -translate-y-1/2 transform flex-col gap-1">
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 rounded-full border bg-background shadow-sm hover:bg-muted"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveUp?.();
                    }}
                  >
                    <ChevronUp className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Move Up</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 rounded-full border bg-background shadow-sm hover:bg-muted"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveDown?.();
                    }}
                  >
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Move Down</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
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
        {editedQuestion.images && editedQuestion.images.length > 0 && (
          <QuestionImages
            images={editedQuestion.images}
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
            <div>
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9 text-muted-foreground hover:text-primary"
                    >
                      <Info className="!h-6 !w-6" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>View Concepts</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
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
