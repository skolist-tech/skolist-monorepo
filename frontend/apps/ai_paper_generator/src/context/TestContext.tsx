/**
 * Test Context
 * Manages test state across the test platform components
 */

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  ReactNode,
} from "react";
import {
  OnlineTest,
  TestAttempt,
  TestQuestion,
  TestAnswer,
} from "../services/testAttemptService";

// Types
export interface QuestionStatus {
  answered: boolean;
  markedForReview: boolean;
  visited: boolean;
}

export interface TestState {
  // Test data
  test: OnlineTest | null;
  attempt: TestAttempt | null;
  currentAttempt: TestAttempt | null;
  questions: TestQuestion[];
  answers: Record<string, TestAnswer | string | string[]>;

  // UI state
  currentQuestionIndex: number;
  currentQuestionId: string | null;
  questionStatuses: Record<string, QuestionStatus>;
  visitedQuestions: Set<string>;
  markedForReview: Record<string, boolean>;

  // Timer state
  timeRemaining: number; // seconds
  isTimerActive: boolean;

  // Flags
  isLoading: boolean;
  error: string | null;
  hasStarted: boolean;
  isSubmitted: boolean;
  isTestStarted: boolean;
  isTestCompleted: boolean;
}

// Action types
type TestAction =
  | { type: "LOAD_TEST_DATA"; payload: OnlineTest }
  | { type: "START_TEST_ATTEMPT"; payload: TestAttempt }
  | { type: "COMPLETE_TEST" }
  | { type: "LOAD_QUESTIONS"; payload: TestQuestion[] }
  | { type: "SET_TEST"; payload: OnlineTest }
  | { type: "SET_ATTEMPT"; payload: TestAttempt }
  | { type: "SET_QUESTIONS"; payload: TestQuestion[] }
  | { type: "SET_ANSWERS"; payload: TestAnswer[] }
  | {
      type: "UPDATE_ANSWER";
      payload: { questionId: string; answer: TestAnswer };
    }
  | {
      type: "SET_ANSWER";
      payload: { questionId: string; answer: string | string[] };
    }
  | { type: "SET_CURRENT_QUESTION"; payload: number }
  | { type: "MARK_QUESTION_VISITED"; payload: string }
  | { type: "TOGGLE_MARK_FOR_REVIEW"; payload: string }
  | { type: "SET_TIME_REMAINING"; payload: number }
  | { type: "START_TIMER" }
  | { type: "STOP_TIMER" }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "START_TEST" }
  | { type: "SUBMIT_TEST" }
  | { type: "RESET_STATE" };

const initialState: TestState = {
  test: null,
  attempt: null,
  currentAttempt: null,
  questions: [],
  answers: {},
  currentQuestionIndex: 0,
  currentQuestionId: null,
  questionStatuses: {},
  visitedQuestions: new Set(),
  markedForReview: {},
  timeRemaining: 0,
  isTimerActive: false,
  isLoading: false,
  error: null,
  hasStarted: false,
  isSubmitted: false,
  isTestStarted: false,
  isTestCompleted: false,
};

const defaultQuestionStatus: QuestionStatus = {
  answered: false,
  markedForReview: false,
  visited: false,
};

function isStoredTestAnswer(value: unknown): value is TestAnswer {
  return Boolean(
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    "gen_question_id" in value &&
    "question_position" in value
  );
}

function testReducer(state: TestState, action: TestAction): TestState {
  switch (action.type) {
    case "LOAD_TEST_DATA":
      return {
        ...state,
        test: action.payload,
        timeRemaining: action.payload.duration_minutes * 60,
      };

    case "START_TEST_ATTEMPT":
      return {
        ...state,
        currentAttempt: action.payload,
        attempt: action.payload,
        isTestStarted: true,
        hasStarted: true,
      };

    case "COMPLETE_TEST":
      return {
        ...state,
        isTestCompleted: true,
        isSubmitted: true,
        isTimerActive: false,
      };

    case "LOAD_QUESTIONS": {
      const questions = action.payload;
      const questionStatuses: Record<string, QuestionStatus> = {};

      questions.forEach((q) => {
        questionStatuses[q.id] = {
          answered: false,
          markedForReview: false,
          visited: false,
        };
      });

      return {
        ...state,
        questions,
        questionStatuses,
        currentQuestionId: questions.at(0)?.id ?? null,
      };
    }

    case "SET_TEST":
      return {
        ...state,
        test: action.payload,
        timeRemaining: action.payload.duration_minutes * 60,
      };

    case "SET_ATTEMPT":
      return { ...state, attempt: action.payload };

    case "SET_QUESTIONS": {
      const questions = action.payload;
      const questionStatuses: Record<string, QuestionStatus> = {};

      questions.forEach((q) => {
        questionStatuses[q.id] = {
          answered: false,
          markedForReview: false,
          visited: false,
        };
      });

      return {
        ...state,
        questions,
        questionStatuses,
      };
    }

    case "SET_ANSWERS": {
      const answers: Record<string, TestAnswer> = {};
      const updatedStatuses = { ...state.questionStatuses };

      action.payload.forEach((answer) => {
        answers[answer.gen_question_id] = answer;
        updatedStatuses[answer.gen_question_id] = {
          ...(updatedStatuses[answer.gen_question_id] ?? defaultQuestionStatus),
          answered: true,
        };
      });

      return {
        ...state,
        answers,
        questionStatuses: updatedStatuses,
      };
    }

    case "UPDATE_ANSWER": {
      const { questionId, answer } = action.payload;
      const previousStatus =
        state.questionStatuses[questionId] ?? defaultQuestionStatus;
      return {
        ...state,
        answers: {
          ...state.answers,
          [questionId]: answer,
        },
        questionStatuses: {
          ...state.questionStatuses,
          [questionId]: {
            ...previousStatus,
            answered: true,
          },
        },
      };
    }

    case "SET_CURRENT_QUESTION": {
      const newIndex = action.payload;
      const currentQuestion = state.questions[newIndex];

      if (!currentQuestion) return state;

      const newVisitedQuestions = new Set(state.visitedQuestions);
      newVisitedQuestions.add(currentQuestion.id);

      return {
        ...state,
        currentQuestionIndex: newIndex,
        currentQuestionId: currentQuestion.id,
        visitedQuestions: newVisitedQuestions,
        questionStatuses: {
          ...state.questionStatuses,
          [currentQuestion.id]: {
            ...(state.questionStatuses[currentQuestion.id] ??
              defaultQuestionStatus),
            visited: true,
          },
        },
      };
    }

    case "SET_ANSWER": {
      const { questionId, answer } = action.payload;
      const previousStatus =
        state.questionStatuses[questionId] ?? defaultQuestionStatus;
      return {
        ...state,
        answers: {
          ...state.answers,
          [questionId]: answer,
        },
        questionStatuses: {
          ...state.questionStatuses,
          [questionId]: {
            ...previousStatus,
            answered: true,
          },
        },
      };
    }

    case "MARK_QUESTION_VISITED": {
      const questionId = action.payload;
      const previousStatus =
        state.questionStatuses[questionId] ?? defaultQuestionStatus;
      return {
        ...state,
        questionStatuses: {
          ...state.questionStatuses,
          [questionId]: {
            ...previousStatus,
            visited: true,
          },
        },
      };
    }

    case "TOGGLE_MARK_FOR_REVIEW": {
      const questionId = action.payload;
      const currentStatus =
        state.questionStatuses[questionId]?.markedForReview || false;
      const newMarkedStatus = !currentStatus;

      return {
        ...state,
        markedForReview: {
          ...state.markedForReview,
          [questionId]: newMarkedStatus,
        },
        questionStatuses: {
          ...state.questionStatuses,
          [questionId]: {
            ...(state.questionStatuses[questionId] ?? defaultQuestionStatus),
            markedForReview: newMarkedStatus,
          },
        },
      };
    }

    case "SET_TIME_REMAINING":
      return { ...state, timeRemaining: action.payload };

    case "START_TIMER":
      return { ...state, isTimerActive: true };

    case "STOP_TIMER":
      return { ...state, isTimerActive: false };

    case "SET_LOADING":
      return { ...state, isLoading: action.payload };

    case "SET_ERROR":
      return { ...state, error: action.payload };

    case "START_TEST":
      return { ...state, hasStarted: true, isTimerActive: true };

    case "SUBMIT_TEST":
      return { ...state, isSubmitted: true, isTimerActive: false };

    case "RESET_STATE":
      return initialState;

    default:
      return state;
  }
}

interface TestContextType {
  state: TestState;
  dispatch: React.Dispatch<TestAction>;

  // Helper functions
  getCurrentQuestion: () => TestQuestion | null;
  getCurrentAnswer: () => TestAnswer | null;
  getQuestionStatus: (questionId: string) => QuestionStatus;
  navigateToQuestion: (index: number) => void;
  navigateNext: () => void;
  navigatePrevious: () => void;
  toggleMarkForReview: () => void;
  updateCurrentAnswer: (answerData: Partial<TestAnswer>) => void;
}

const TestContext = createContext<TestContextType | null>(null);

interface TestProviderProps {
  children: ReactNode;
}

export function TestContextProvider({ children }: TestProviderProps) {
  const [state, dispatch] = useReducer(testReducer, initialState);

  const getCurrentQuestion = useCallback((): TestQuestion | null => {
    return state.questions[state.currentQuestionIndex] || null;
  }, [state.questions, state.currentQuestionIndex]);

  const getCurrentAnswer = useCallback((): TestAnswer | null => {
    const currentQuestion = getCurrentQuestion();
    if (!currentQuestion) return null;

    const value = state.answers[currentQuestion.id];
    return isStoredTestAnswer(value) ? value : null;
  }, [state.answers, getCurrentQuestion]);

  const getQuestionStatus = useCallback(
    (questionId: string): QuestionStatus => {
      return (
        state.questionStatuses[questionId] || {
          answered: false,
          markedForReview: false,
          visited: false,
        }
      );
    },
    [state.questionStatuses]
  );

  const navigateToQuestion = useCallback(
    (index: number) => {
      if (index >= 0 && index < state.questions.length) {
        dispatch({ type: "SET_CURRENT_QUESTION", payload: index });
      }
    },
    [state.questions.length]
  );

  const navigateNext = useCallback(() => {
    if (state.currentQuestionIndex < state.questions.length - 1) {
      dispatch({
        type: "SET_CURRENT_QUESTION",
        payload: state.currentQuestionIndex + 1,
      });
    }
  }, [state.currentQuestionIndex, state.questions.length]);

  const navigatePrevious = useCallback(() => {
    if (state.currentQuestionIndex > 0) {
      dispatch({
        type: "SET_CURRENT_QUESTION",
        payload: state.currentQuestionIndex - 1,
      });
    }
  }, [state.currentQuestionIndex]);

  const toggleMarkForReview = useCallback(() => {
    const currentQuestion = getCurrentQuestion();
    if (currentQuestion) {
      dispatch({ type: "TOGGLE_MARK_FOR_REVIEW", payload: currentQuestion.id });
    }
  }, [getCurrentQuestion]);

  const updateCurrentAnswer = useCallback(
    (answerData: Partial<TestAnswer>) => {
      const currentQuestion = getCurrentQuestion();
      if (currentQuestion) {
        const existingAnswer = getCurrentAnswer();
        const updatedAnswer: TestAnswer = {
          id: existingAnswer?.id || "",
          test_attempt_id: state.attempt?.id || "",
          gen_question_id: currentQuestion.id,
          question_position: currentQuestion.position_in_draft,
          ...existingAnswer,
          ...answerData,
        };

        dispatch({
          type: "UPDATE_ANSWER",
          payload: { questionId: currentQuestion.id, answer: updatedAnswer },
        });
      }
    },
    [getCurrentQuestion, getCurrentAnswer, state.attempt?.id]
  );

  const contextValue: TestContextType = {
    state,
    dispatch,
    getCurrentQuestion,
    getCurrentAnswer,
    getQuestionStatus,
    navigateToQuestion,
    navigateNext,
    navigatePrevious,
    toggleMarkForReview,
    updateCurrentAnswer,
  };

  return (
    <TestContext.Provider value={contextValue}>{children}</TestContext.Provider>
  );
}

export function useTestContext(): TestContextType {
  const context = useContext(TestContext);
  if (!context) {
    throw new Error("useTestContext must be used within a TestContextProvider");
  }
  return context;
}
