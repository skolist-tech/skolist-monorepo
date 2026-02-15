import type { ReactNode } from "react";

interface QuestionActionsWrapperProps {
  children: ReactNode;
}

export function QuestionActionsWrapper({
  children,
}: QuestionActionsWrapperProps) {
  return (
    <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
      {children}
    </div>
  );
}
