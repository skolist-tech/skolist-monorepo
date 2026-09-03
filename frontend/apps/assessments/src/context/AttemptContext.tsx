import {
  createContext,
  useContext,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { StudentResponse } from "@/types/assessment";

type AttemptContextValue = {
  currentQuestionId: string | null;
  setCurrentQuestionId: Dispatch<SetStateAction<string | null>>;
  responsesByQuestion: Record<string, StudentResponse>;
  setResponsesByQuestion: Dispatch<
    SetStateAction<Record<string, StudentResponse>>
  >;
};

export const AttemptContext = createContext<AttemptContextValue | null>(null);

export function useAttemptContext() {
  const value = useContext(AttemptContext);
  if (!value) {
    throw new Error(
      "useAttemptContext must be used within AttemptContext.Provider"
    );
  }
  return value;
}
