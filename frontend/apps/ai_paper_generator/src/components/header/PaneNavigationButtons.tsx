import { usePaneContext } from "../../context/PaneContext";
import { useActivityContext } from "../../context/ActivityContext";
import { Button } from "@skolist/ui";
import type { PaneType } from "../../types/pane";
import { Sparkles, FileEdit, BarChart3 } from "lucide-react";
import { cn } from "@skolist/utils";

interface PaneNavigationButtonsProps {
  onPaneChange?: () => void;
}

export function PaneNavigationButtons({
  onPaneChange,
}: PaneNavigationButtonsProps = {}) {
  const { activePane, setActivePane } = usePaneContext();
  const { currentActivity } = useActivityContext();

  const handlePaneClick = (paneType: PaneType) => {
    setActivePane(paneType);
    onPaneChange?.();
  };

  const panes: { type: PaneType; label: string; icon: React.ReactNode }[] = [
    {
      type: "generation",
      label: "Questions",
      icon: <Sparkles className="h-4 w-4" />,
    },
    { type: "draft", label: "Draft", icon: <FileEdit className="h-4 w-4" /> },
    {
      type: "analysis",
      label: "Analysis",
      icon: <BarChart3 className="h-4 w-4" />,
    },
  ];

  return (
    <div className="flex w-full items-center gap-2 rounded-lg bg-muted/20 p-1 md:w-auto md:rounded-none md:bg-transparent md:p-0">
      {panes.map((pane) => {
        const isHighlighted = !!currentActivity && activePane === pane.type;
        return (
          <Button
            key={pane.type}
            variant={isHighlighted ? "default" : "ghost"}
            onClick={() => handlePaneClick(pane.type)}
            className={cn(
              "h-10 flex-1 gap-2 text-xl font-medium transition-all md:h-9 md:flex-none md:text-base",
              isHighlighted && "shadow-sm"
            )}
          >
            {pane.icon}
            {pane.label}
          </Button>
        );
      })}
    </div>
  );
}
