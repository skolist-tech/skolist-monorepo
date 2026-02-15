import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import type { PaneType } from "../types/pane";

const STORAGE_KEY = "ai_paper_generator_active_pane";
const VALID_PANES: PaneType[] = ["generation", "draft", "analysis"];

function getInitialPane(): PaneType {
  if (typeof window === "undefined") return "generation";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && VALID_PANES.includes(stored as PaneType)) {
    return stored as PaneType;
  }
  return "generation";
}

interface PaneContextValue {
  activePane: PaneType;
  setActivePane: (pane: PaneType) => void;
}

const PaneContext = createContext<PaneContextValue | undefined>(undefined);

export function PaneProvider({ children }: { children: ReactNode }) {
  const [activePane, setActivePane] = useState<PaneType>(getInitialPane);

  // Persist to localStorage whenever activePane changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, activePane);
  }, [activePane]);

  return (
    <PaneContext.Provider value={{ activePane, setActivePane }}>
      {children}
    </PaneContext.Provider>
  );
}

export function usePaneContext() {
  const context = useContext(PaneContext);
  if (context === undefined) {
    throw new Error("usePaneContext must be used within a PaneProvider");
  }
  return context;
}
