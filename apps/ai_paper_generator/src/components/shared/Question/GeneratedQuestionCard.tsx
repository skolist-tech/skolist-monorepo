import { useState, useRef, useEffect, useMemo } from "react";
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
  onAutoCorrect?: (questionId: string) => Promise<void>; // Optional override for auto-correct (useful for Storybook)
  onRegenerateWithPrompt?: (questionId: string, prompt: string, files: File[]) => Promise<void>; // Optional override for regenerate with prompt (useful for Storybook)
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
  onAutoCorrect,
  onRegenerateWithPrompt,
}: GeneratedQuestionCardProps) {
  // Refs for animation positioning
  const cardRef = useRef<HTMLDivElement>(null);
  const autoCorrectBtnRef = useRef<HTMLButtonElement>(null);
  const regenerateBtnRef = useRef<HTMLButtonElement>(null);

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
  const [isAutoCorrecting, setIsAutoCorrecting] = useState(false);
  const [isReturning, setIsReturning] = useState(false);
  // State to store the calculated origin point for the sparkle
  const [sparkleOrigin, setSparkleOrigin] = useState({ top: 12, right: 12 });

  // Regenerate animation states
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isRegenerateReturning, setIsRegenerateReturning] = useState(false);
  const [regenerateOrigin, setRegenerateOrigin] = useState({ top: 12, right: 12 });

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
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);

  // Disintegration animation state for delete
  const [isDisintegrating, setIsDisintegrating] = useState(false);

  // Pre-generate random particle data for disintegration animation
  const particleData = useMemo(() => 
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
  []);

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

  const handleAutoCorrect = async () => {
    // Calculate the position of the button relative to the card before starting animation
    if (cardRef.current && autoCorrectBtnRef.current) {
      const cardRect = cardRef.current.getBoundingClientRect();
      const btnRect = autoCorrectBtnRef.current.getBoundingClientRect();

      // Calculate relative top and right positions
      // Adding a small offset to center it better over the icon itself
      const relativeTop = btnRect.top - cardRect.top + 6;
      const relativeRight = cardRect.right - btnRect.right + 6;

      setSparkleOrigin({ top: relativeTop, right: relativeRight });
    }

    try {
      setIsAutoCorrecting(true);
      setIsReturning(false);
      if (onAutoCorrect) {
        await onAutoCorrect(question.id);
      } else {
        await fastApiService.autoCorrectQuestion(question.id);
      }
      // Trigger return animation
      setIsReturning(true);
      // Wait for return animation to complete before hiding
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
    setSlideDirection('right');
    // Wait for animation to complete
    await new Promise((resolve) => setTimeout(resolve, 400));
    onMoveToDraft(question.id);
    // Don't reset slideDirection - let the component stay hidden until parent removes it
  };

  const handleRemoveFromDraft = async () => {
    if (!onRemoveFromDraft) return;
    setSlideDirection('left');
    // Wait for animation to complete
    await new Promise((resolve) => setTimeout(resolve, 400));
    onRemoveFromDraft(question.id);
    // Don't reset slideDirection - let the component stay hidden until parent removes it
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
      ref={cardRef}
      className={`group relative rounded-lg border bg-background p-4 shadow-sm transition-all hover:shadow-md ${
        isSelected ? "border-primary ring-2 ring-primary" : ""
      } ${slideDirection ? 'pointer-events-none' : ''} ${isDisintegrating ? 'pointer-events-none' : ''}`}
      style={{
        animation: slideDirection === 'right' 
          ? 'slideOutRight 0.4s ease-in forwards' 
          : slideDirection === 'left' 
            ? 'slideOutLeft 0.4s ease-in forwards' 
            : isDisintegrating
              ? 'disintegrate 1.5s ease-out forwards'
              : 'none',
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
      `}</style>

      {/* Disintegration Particle Animation Overlay */}
      {isDisintegrating && (
        <div className="absolute inset-0 z-50 rounded-lg overflow-visible pointer-events-none">
          {/* Generate multiple particles */}
          {particleData.map((particle, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: `${particle.size}px`,
                height: `${particle.size}px`,
                left: `${particle.left}%`,
                top: `${particle.top}%`,
                backgroundColor: `hsl(${Math.random() * 30 + 10}, 10%, ${50 + Math.random() * 30}%)`,
                opacity: 0,
                '--x-offset': `${particle.xOffset}px`,
                '--y-offset': `${particle.yOffset}px`,
                '--rotation': `${particle.rotation}deg`,
                animation: `particle-float-${i % 4} ${particle.duration}s ease-out ${particle.delay}s forwards`,
              } as React.CSSProperties}
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
          className="absolute inset-0 z-50 rounded-lg overflow-hidden"
          style={{
            '--origin-top': `${sparkleOrigin.top}px`,
            '--origin-right': `${sparkleOrigin.right}px`,
          } as React.CSSProperties}
        >
          {/* Glassy blur overlay with pulsing animation */}
          <div 
            className="absolute inset-0 bg-background/60"
            style={{
              animation: isReturning 
                ? 'blurFadeOut 0.8s ease-out forwards' 
                : 'blurPulse 2s ease-in-out infinite',
              animationDelay: isReturning ? '0s' : '0.8s',
            }}
          />
          {/* Sparkle with parabolic trajectory */}
          <div 
            className="absolute z-10"
            style={{
              top: `${sparkleOrigin.top}px`,
              right: `${sparkleOrigin.right}px`,
              animation: isReturning 
                ? 'sparkleReturn 0.8s ease-in forwards' 
                : 'sparkleTrajectory 0.8s ease-out forwards',
            }}
          >
            <div
              style={{
                animation: isReturning 
                  ? 'none' 
                  : 'sparklePulse 1.5s ease-in-out infinite',
                animationDelay: '0.8s',
              }}
            >
              <Sparkles 
                className="text-yellow-400 drop-shadow-lg" 
                style={{
                  width: isReturning ? '64px' : '20px',
                  height: isReturning ? '64px' : '20px',
                  filter: 'drop-shadow(0 0 10px rgba(250, 204, 21, 0.5))',
                  animation: isReturning 
                    ? 'sparkleShrink 0.8s ease-in forwards' 
                    : 'sparkleGrow 0.8s ease-out forwards',
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
          className="absolute inset-0 z-50 rounded-lg overflow-hidden"
          style={{
            '--regen-origin-top': `${regenerateOrigin.top}px`,
            '--regen-origin-right': `${regenerateOrigin.right}px`,
          } as React.CSSProperties}
        >
          {/* Glassy blur overlay with pulsing animation */}
          <div 
            className="absolute inset-0 bg-background/60"
            style={{
              animation: isRegenerateReturning 
                ? 'regenBlurFadeOut 0.8s ease-out forwards' 
                : 'regenBlurPulse 2s ease-in-out infinite',
              animationDelay: isRegenerateReturning ? '0s' : '0.8s',
            }}
          />
          {/* RefreshCw with parabolic trajectory and rotation */}
          <div 
            className="absolute z-10"
            style={{
              top: `${regenerateOrigin.top}px`,
              right: `${regenerateOrigin.right}px`,
              animation: isRegenerateReturning 
                ? 'regenReturn 0.8s ease-in forwards' 
                : 'regenTrajectory 0.8s ease-out forwards',
            }}
          >
            <div
              style={{
                animation: isRegenerateReturning 
                  ? 'none' 
                  : 'regenSpin 1s linear infinite',
                animationDelay: '0.8s',
              }}
            >
              <RefreshCw 
                className="text-primary drop-shadow-lg" 
                style={{
                  width: isRegenerateReturning ? '64px' : '16px',
                  height: isRegenerateReturning ? '64px' : '16px',
                  filter: 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.5))',
                  animation: isRegenerateReturning 
                    ? 'regenShrink 0.8s ease-in forwards' 
                    : 'regenGrow 0.8s ease-out forwards',
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
        <div className="absolute inset-0 z-50 rounded-lg overflow-hidden">
          {/* Glassy blur overlay with pulsing animation */}
          <div 
            className="absolute inset-0 bg-background/60 backdrop-blur-sm"
            style={{
              animation: 'chatBlurPulse 2s ease-in-out infinite',
            }}
          />
          {/* Lottie animation centered */}
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div 
              className="w-24 h-24"
              style={{
                animation: 'lottieScaleIn 0.3s ease-out forwards',
              }}
            >
              <Lottie
                animationData={chatAnimationData}
                loop={true}
                autoplay={true}
                style={{ width: '100%', height: '100%' }}
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
      <div className="absolute right-2 top-2 flex items-center rounded-md bg-background/80 p-1 backdrop-blur-sm">
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleImageUpload}
        />
        <Button
          ref={autoCorrectBtnRef}
          size="icon"
          variant="ghost"
          onClick={handleAutoCorrect}
          title="Auto-Correct Question"
          disabled={isAutoCorrecting}
        >
          <Sparkles className={`h-5 w-5 text-yellow-400 ${isAutoCorrecting ? 'opacity-50' : ''}`} />
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
          ref={regenerateBtnRef}
          size="icon"
          variant="ghost"
          onClick={handleDirectRegenerate}
          title="Regenerate Question"
          disabled={isRegenerating}
        >
          <RefreshCw className={`h-4 w-4 text-muted-foreground hover:text-primary ${isRegenerating ? 'opacity-50' : ''}`} />
        </Button>

        <Popover open={isRegenerateOpen} onOpenChange={setIsRegenerateOpen}>
          <PopoverTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              title="Regenerate with Prompt"
              disabled={!onRegenerate || isChatPromptAnimating}
            >
              <MessageSquare className={`h-4 w-4 text-muted-foreground hover:text-primary ${isChatPromptAnimating ? 'opacity-50' : ''}`} style={{ transform: 'scaleX(-1)' }} />
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
            onClick={handleRemoveFromDraft}
            title="Remove from Draft"
            disabled={slideDirection !== null}
          >
            <ArrowLeft className={`h-4 w-4 text-red-500 hover:text-red-700 ${slideDirection ? 'opacity-50' : ''}`} />
          </Button>
        ) : (
          <Button
            size="icon"
            variant="ghost"
            onClick={handleMoveToDraft}
            title="Move to Draft"
            disabled={slideDirection !== null}
          >
            <ArrowRight
              className={`h-4 w-4 text-orange-500 hover:text-orange-700 ${slideDirection ? 'opacity-50' : ''}`}
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
        onConfirm={handleDeleteWithAnimation}
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
