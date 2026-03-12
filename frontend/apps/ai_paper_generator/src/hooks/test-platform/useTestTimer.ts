/**
 * useTestTimer
 * Custom hook for managing test timer functionality
 */

import { useEffect, useRef, useCallback } from "react";
import { useTestContext } from "../../context/TestContext";

interface UseTestTimerOptions {
  onTimeUp?: () => void;
  warningThresholds?: number[]; // in seconds, e.g., [300, 60] for 5min and 1min warnings
  onWarning?: (timeRemaining: number) => void;
}

export function useTestTimer(options: UseTestTimerOptions = {}) {
  const { state, dispatch } = useTestContext();
  const intervalRef = useRef<number | null>(null);
  const warningsShownRef = useRef<Set<number>>(new Set());

  const {
    onTimeUp,
    warningThresholds = [300, 60], // Default 5min and 1min warnings
    onWarning,
  } = options;

  const startTimer = useCallback(() => {
    dispatch({ type: "START_TIMER" });
  }, [dispatch]);

  const stopTimer = useCallback(() => {
    dispatch({ type: "STOP_TIMER" });
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [dispatch]);

  const resetTimer = useCallback(
    (timeInSeconds: number) => {
      dispatch({ type: "SET_TIME_REMAINING", payload: timeInSeconds });
      warningsShownRef.current.clear();
    },
    [dispatch]
  );

  // Format time for display
  const formatTime = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }

    return `${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }, []);

  // Get timer color based on remaining time
  const getTimerColor = useCallback((seconds: number): string => {
    if (seconds <= 60) return "text-red-600"; // Last minute - red
    if (seconds <= 300) return "text-orange-500"; // Last 5 minutes - orange
    return "text-gray-900"; // Normal - dark
  }, []);

  // Check if timer is in warning state
  const isInWarningState = useCallback((seconds: number): boolean => {
    return seconds <= 300; // Last 5 minutes
  }, []);

  // Main timer effect
  useEffect(() => {
    if (state.isTimerActive && state.timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        dispatch({
          type: "SET_TIME_REMAINING",
          payload: state.timeRemaining - 1,
        });
      }, 1000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [state.isTimerActive, state.timeRemaining, dispatch]);

  // Handle time up
  useEffect(() => {
    if (state.timeRemaining <= 0 && state.isTimerActive) {
      stopTimer();
      onTimeUp?.();
    }
  }, [state.timeRemaining, state.isTimerActive, stopTimer, onTimeUp]);

  // Handle warnings
  useEffect(() => {
    if (state.timeRemaining > 0 && onWarning) {
      for (const threshold of warningThresholds) {
        if (
          state.timeRemaining <= threshold &&
          !warningsShownRef.current.has(threshold)
        ) {
          warningsShownRef.current.add(threshold);
          onWarning(state.timeRemaining);
          break; // Only show one warning at a time
        }
      }
    }
  }, [state.timeRemaining, warningThresholds, onWarning]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    timeRemaining: state.timeRemaining,
    isActive: state.isTimerActive,
    formattedTime: formatTime(state.timeRemaining),
    timerColor: getTimerColor(state.timeRemaining),
    isInWarning: isInWarningState(state.timeRemaining),
    startTimer,
    stopTimer,
    resetTimer,
  };
}
