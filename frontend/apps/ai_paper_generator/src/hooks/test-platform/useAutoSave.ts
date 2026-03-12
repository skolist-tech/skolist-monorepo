/**
 * useAutoSave
 * Custom hook for automatically saving test answers
 */

import { useEffect, useRef, useCallback } from "react";
import { useTestContext } from "../../context/TestContext";
import { testAttemptService } from "../../services/testAttemptService";

interface UseAutoSaveOptions {
  saveInterval?: number; // in milliseconds
  onSaveSuccess?: () => void;
  onSaveError?: (error: Error) => void;
  maxRetries?: number;
}

export function useAutoSave(options: UseAutoSaveOptions = {}) {
  const { state } = useTestContext();
  const saveTimeoutRef = useRef<number | null>(null);
  const saveInProgressRef = useRef(false);
  const retryCountRef = useRef(0);

  const {
    saveInterval = 30000, // Default: save every 30 seconds
    onSaveSuccess,
    onSaveError,
    maxRetries = 3,
  } = options;

  // Track unsaved changes
  const hasUnsavedChanges = useRef(false);

  // Mark as having unsaved changes when answers change
  useEffect(() => {
    hasUnsavedChanges.current = true;
  }, [state.answers]);

  const saveAnswers = useCallback(async () => {
    if (
      !hasUnsavedChanges.current ||
      saveInProgressRef.current ||
      !state.currentAttempt?.id
    ) {
      return;
    }

    saveInProgressRef.current = true;

    try {
      const serializableAnswers: Record<string, string | string[]> = {};

      Object.entries(state.answers).forEach(([questionId, answer]) => {
        if (typeof answer === "string" || Array.isArray(answer)) {
          serializableAnswers[questionId] = answer;
        }
      });

      // Pass state.questions to map answers to options/indices correctly
      await testAttemptService.saveTestAnswers(
        state.currentAttempt.id,
        serializableAnswers,
        state.questions
      );

      hasUnsavedChanges.current = false;
      retryCountRef.current = 0;
      onSaveSuccess?.();
    } catch (error) {
      retryCountRef.current++;

      if (retryCountRef.current < maxRetries) {
        // Retry after exponential backoff
        const retryDelay = Math.pow(2, retryCountRef.current) * 1000;
        setTimeout(() => {
          saveInProgressRef.current = false;
          saveAnswers();
        }, retryDelay);
      } else {
        onSaveError?.(error as Error);
        retryCountRef.current = 0;
      }
    } finally {
      if (retryCountRef.current === 0) {
        saveInProgressRef.current = false;
      }
    }
  }, [
    state.answers,
    state.currentAttempt?.id,
    maxRetries,
    onSaveSuccess,
    onSaveError,
  ]);

  // Auto-save interval
  useEffect(() => {
    if (state.isTestStarted && !state.isTestCompleted) {
      const intervalId = setInterval(() => {
        saveAnswers();
      }, saveInterval);

      return () => clearInterval(intervalId);
    }
  }, [state.isTestStarted, state.isTestCompleted, saveInterval, saveAnswers]);

  // Save on page visibility change (user switching tabs/minimizing)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden" && hasUnsavedChanges.current) {
        saveAnswers();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [saveAnswers]);

  // Save before page unload
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasUnsavedChanges.current) {
        // Attempt synchronous save (limited by browser)
        navigator.sendBeacon?.(
          "/api/save-answers",
          JSON.stringify({
            attemptId: state.currentAttempt?.id,
            answers: state.answers,
          })
        );

        // Show confirmation dialog
        event.preventDefault();
        event.returnValue = "";
        return "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [state.currentAttempt?.id, state.answers]);

  // Manual save function
  const forceSave = useCallback(async () => {
    if (saveInProgressRef.current) {
      return false;
    }

    await saveAnswers();
    return !hasUnsavedChanges.current;
  }, [saveAnswers]);

  // Clear pending saves on cleanup
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    hasUnsavedChanges: hasUnsavedChanges.current,
    isSaving: saveInProgressRef.current,
    retryCount: retryCountRef.current,
    forceSave,
    saveAnswers,
  };
}
