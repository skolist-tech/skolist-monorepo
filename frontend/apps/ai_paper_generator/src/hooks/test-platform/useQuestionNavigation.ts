/**
 * useQuestionNavigation
 * Custom hook for handling question navigation in test platform
 */

import { useCallback } from "react";
import { useTestContext } from "../../context/TestContext";

export function useQuestionNavigation() {
  const { state, dispatch } = useTestContext();

  const goToQuestion = useCallback(
    (questionId: string) => {
      const questionIndex = state.questions.findIndex(
        (q) => q.id === questionId
      );
      if (questionIndex !== -1) {
        dispatch({ type: "SET_CURRENT_QUESTION", payload: questionIndex });
      }
    },
    [dispatch, state.questions]
  );

  const goToNext = useCallback(() => {
    const currentIndex = state.currentQuestionIndex;

    if (currentIndex < state.questions.length - 1) {
      const nextIndex = currentIndex + 1;
      dispatch({ type: "SET_CURRENT_QUESTION", payload: nextIndex });
      return true;
    }
    return false;
  }, [state.questions.length, state.currentQuestionIndex, dispatch]);

  const goToPrevious = useCallback(() => {
    const currentIndex = state.currentQuestionIndex;

    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      dispatch({ type: "SET_CURRENT_QUESTION", payload: prevIndex });
      return true;
    }
    return false;
  }, [state.currentQuestionIndex, dispatch]);

  const goToFirstUnanswered = useCallback(() => {
    const firstUnanswered = state.questions.find(
      (question) =>
        !state.answers[question.id] ||
        (Array.isArray(state.answers[question.id]) &&
          (state.answers[question.id] as string[]).length === 0)
    );

    if (firstUnanswered) {
      goToQuestion(firstUnanswered.id);
      return true;
    }
    return false;
  }, [state.questions, state.answers, goToQuestion]);

  const goToFirstMarkedForReview = useCallback(() => {
    const firstMarked = state.questions.find(
      (question) => state.markedForReview[question.id]
    );

    if (firstMarked) {
      goToQuestion(firstMarked.id);
      return true;
    }
    return false;
  }, [state.questions, state.markedForReview, goToQuestion]);

  // Navigation helpers
  const getCurrentQuestionIndex = useCallback(() => {
    return state.currentQuestionIndex;
  }, [state.currentQuestionIndex]);

  const isFirstQuestion = useCallback(() => {
    return getCurrentQuestionIndex() === 0;
  }, [getCurrentQuestionIndex]);

  const isLastQuestion = useCallback(() => {
    return getCurrentQuestionIndex() === state.questions.length - 1;
  }, [getCurrentQuestionIndex, state.questions.length]);

  // Question status helpers
  const getQuestionStatus = useCallback(
    (questionId: string) => {
      const answer = state.answers[questionId];
      const hasAnswer =
        answer !== undefined &&
        answer !== null &&
        answer !== "" &&
        !(Array.isArray(answer) && answer.length === 0);

      const isMarked = state.markedForReview[questionId];
      const isVisited = state.visitedQuestions.has(questionId);

      if (hasAnswer && isMarked) return "answered-marked";
      if (hasAnswer) return "answered";
      if (isMarked) return "marked";
      if (isVisited) return "visited";
      return "not-visited";
    },
    [state.answers, state.markedForReview, state.visitedQuestions]
  );

  // Get questions by status
  const getQuestionsByStatus = useCallback(() => {
    const answered: string[] = [];
    const notAnswered: string[] = [];
    const markedForReview: string[] = [];
    const notVisited: string[] = [];

    state.questions.forEach((question) => {
      const status = getQuestionStatus(question.id);

      switch (status) {
        case "answered":
        case "answered-marked":
          answered.push(question.id);
          if (status === "answered-marked") {
            markedForReview.push(question.id);
          }
          break;
        case "marked":
          markedForReview.push(question.id);
          notAnswered.push(question.id);
          break;
        case "visited":
          notAnswered.push(question.id);
          break;
        case "not-visited":
          notVisited.push(question.id);
          notAnswered.push(question.id);
          break;
      }
    });

    return {
      answered,
      notAnswered,
      markedForReview,
      notVisited,
      total: state.questions.length,
    };
  }, [state.questions, getQuestionStatus]);

  // Section navigation (if questions are grouped by sections)
  const goToSection = useCallback((_sectionName: string) => {
    // Since TestQuestion doesn't have section property, this will always return false
    // In future, if sections are needed, update TestQuestion interface
    return false;
  }, []);

  const getSections = useCallback(() => {
    // Since questions don't have section property, return single section
    const section = {
      name: "General",
      questions: state.questions.map((q) => q.id),
      answered: 0,
      total: state.questions.length,
    };

    // Count answered questions
    state.questions.forEach((question) => {
      const answer = state.answers[question.id];
      const hasAnswer =
        answer !== undefined &&
        answer !== null &&
        answer !== "" &&
        !(Array.isArray(answer) && answer.length === 0);

      if (hasAnswer) {
        section.answered++;
      }
    });

    return [section];
  }, [state.questions, state.answers]);

  return {
    // Basic navigation
    goToQuestion,
    goToNext,
    goToPrevious,
    goToFirstUnanswered,
    goToFirstMarkedForReview,

    // Position helpers
    getCurrentQuestionIndex,
    isFirstQuestion,
    isLastQuestion,

    // Status helpers
    getQuestionStatus,
    getQuestionsByStatus,

    // Section navigation
    goToSection,
    getSections,

    // Current state
    currentQuestionId: state.currentQuestionId,
    totalQuestions: state.questions.length,
  };
}
