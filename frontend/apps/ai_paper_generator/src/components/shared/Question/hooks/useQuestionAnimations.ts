import { useState, useRef, useEffect, useMemo } from "react";
import { type GeneratedQuestionWithConcepts } from "../../../../services/questionService";

interface UseQuestionAnimationsProps {
  question: GeneratedQuestionWithConcepts;
  isAnimatingProp?: boolean; // External trigger (e.g. bulk move)
  isDeletingProp?: boolean; // External trigger for delete animation (e.g. bulk delete)
}

export function useQuestionAnimations({
  question,
  isAnimatingProp = false,
  isDeletingProp = false,
}: UseQuestionAnimationsProps) {
  // -- Slide Animation --
  const [slideDirection, setSlideDirection] = useState<"left" | "right" | null>(
    null
  );

  useEffect(() => {
    if (isAnimatingProp && !slideDirection) {
      setSlideDirection("right");
    }
  }, [isAnimatingProp, slideDirection]);

  // -- Delete / Disintegrate Animation --
  const [isDisintegrating, setIsDisintegrating] = useState(false);

  // Trigger disintegrate animation when isDeletingProp becomes true
  useEffect(() => {
    if (isDeletingProp && !isDisintegrating) {
      setIsDisintegrating(true);
    }
  }, [isDeletingProp, isDisintegrating]);

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

  // -- Auto Correct Animation --
  const [isAutoCorrecting, setIsAutoCorrecting] = useState(false);
  const [isReturning, setIsReturning] = useState(false);
  const [sparkleOrigin, setSparkleOrigin] = useState({ top: 12, right: 12 });
  const autoCorrectBtnRef = useRef<HTMLButtonElement>(null);

  // -- Regenerate Animation --
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isRegenerateReturning, setIsRegenerateReturning] = useState(false);
  const [regenerateOrigin, setRegenerateOrigin] = useState({
    top: 12,
    right: 12,
  });
  const regenerateBtnRef = useRef<HTMLButtonElement>(null);

  // -- Chat Prompt Animation --
  const [isChatPromptAnimating, setIsChatPromptAnimating] = useState(false);
  // Store question text at start of animation to detect changes
  const questionTextAtAnimationStart = useRef<string | null>(null);

  // Stop chat animation when text updates
  useEffect(() => {
    if (
      isChatPromptAnimating &&
      questionTextAtAnimationStart.current !== null &&
      question.question_text !== questionTextAtAnimationStart.current
    ) {
      const timer = setTimeout(() => {
        setIsChatPromptAnimating(false);
        questionTextAtAnimationStart.current = null;
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [question.question_text, isChatPromptAnimating]);

  // -- Camera Capture Animation --
  const [isCameraCapturing, setIsCameraCapturing] = useState(false);
  const [isCameraReturning, setIsCameraReturning] = useState(false);
  const [cameraOrigin, setCameraOrigin] = useState({ top: 12, right: 12 });
  const cameraBtnRef = useRef<HTMLButtonElement>(null);

  return {
    slideDirection,
    setSlideDirection,

    isDisintegrating,
    setIsDisintegrating,
    particleData,

    isAutoCorrecting,
    setIsAutoCorrecting,
    isReturning,
    setIsReturning,
    sparkleOrigin,
    setSparkleOrigin,
    autoCorrectBtnRef,

    isRegenerating,
    setIsRegenerating,
    isRegenerateReturning,
    setIsRegenerateReturning,
    regenerateOrigin,
    setRegenerateOrigin,
    regenerateBtnRef,

    isChatPromptAnimating,
    setIsChatPromptAnimating,
    questionTextAtAnimationStart,

    // Camera capture animation
    isCameraCapturing,
    setIsCameraCapturing,
    isCameraReturning,
    setIsCameraReturning,
    cameraOrigin,
    setCameraOrigin,
    cameraBtnRef,
  };
}
