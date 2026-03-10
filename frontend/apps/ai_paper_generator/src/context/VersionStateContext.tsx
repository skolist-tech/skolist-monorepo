/**
 * Version State Context
 * Provides batched version state (canUndo/canRedo) for all questions
 * Eliminates N+1 query problem by fetching all states in a single RPC call
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { VersionState } from "../services/versionService";
import { useQuestionsContext } from "./QuestionsContext";

interface VersionStateContextValue {
  getVersionState: (questionId: string) => VersionState;
  refreshVersionState: (questionId: string) => Promise<void>;
  refreshAllVersionStates: () => Promise<void>;
}

const VersionStateContext = createContext<VersionStateContextValue | undefined>(
  undefined
);

export function VersionStateProvider({ children }: { children: ReactNode }) {
  const { questions, batchGetVersionStates } = useQuestionsContext();
  const [versionStates, setVersionStates] = useState<Map<string, VersionState>>(
    new Map()
  );

  // Batch fetch all version states when questions change
  useEffect(() => {
    const fetchAllStates = async () => {
      if (questions.length === 0) return;

      const questionIds = questions.map((q) => q.id);
      const states = await batchGetVersionStates(questionIds);
      setVersionStates(states);
    };

    fetchAllStates();
  }, [questions.length]); // Only re-fetch when question count changes, not on every update

  // Refresh a single question's version state
  const refreshVersionState = useCallback(
    async (questionId: string) => {
      const states = await batchGetVersionStates([questionId]);
      setVersionStates((prev) => {
        const next = new Map(prev);
        const state = states.get(questionId);
        if (state) {
          next.set(questionId, state);
        }
        return next;
      });
    },
    [batchGetVersionStates]
  );

  // Refresh all version states
  const refreshAllVersionStates = useCallback(async () => {
    if (questions.length === 0) return;
    const questionIds = questions.map((q) => q.id);
    const states = await batchGetVersionStates(questionIds);
    setVersionStates(states);
  }, [questions, batchGetVersionStates]);

  // Get version state for a specific question (returns default if not loaded)
  const getVersionState = useCallback(
    (questionId: string): VersionState => {
      return (
        versionStates.get(questionId) ?? { canUndo: false, canRedo: false }
      );
    },
    [versionStates]
  );

  return (
    <VersionStateContext.Provider
      value={{ getVersionState, refreshVersionState, refreshAllVersionStates }}
    >
      {children}
    </VersionStateContext.Provider>
  );
}

export function useVersionStateContext() {
  const context = useContext(VersionStateContext);
  if (!context) {
    throw new Error(
      "useVersionStateContext must be used within VersionStateProvider"
    );
  }
  return context;
}
