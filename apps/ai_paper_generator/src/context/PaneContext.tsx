import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import type { PaneType } from "../types/pane";

interface PaneContextValue {
  activePane: PaneType;
  setActivePane: (pane: PaneType) => void;
}

const PaneContext = createContext<PaneContextValue | undefined>(undefined);

export function PaneProvider({ children }: { children: ReactNode }) {
  const [activePane, setActivePane] = useState<PaneType>("generation");

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
