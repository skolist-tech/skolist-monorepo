import { usePaneContext } from "../../context/PaneContext";
import { Button } from "@skolist/ui";
import type { PaneType } from "../../types/pane";
import { Sparkles, FileEdit, BarChart3 } from "lucide-react";
import { cn } from "@skolist/utils";
import { useUserCredits } from "../../hooks/useUserCredits";

export function PaneNavigationButtons() {
  const { activePane, setActivePane } = usePaneContext();
  const { credits } = useUserCredits();

  const panes: { type: PaneType; label: string; icon: React.ReactNode }[] = [
    {
      type: "generation",
      label: "Generate",
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
    <div className="flex items-center gap-6">
      <div className="flex items-center gap-2">
        {panes.map((pane) => (
          <Button
            key={pane.type}
            variant={activePane === pane.type ? "default" : "ghost"}
            size="sm"
            onClick={() => setActivePane(pane.type)}
            className={cn("gap-2", activePane === pane.type && "shadow-sm")}
          >
            {pane.icon}
            {pane.label}
          </Button>
        ))}
      </div>
      {credits !== null && (
        <div className="flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
          <span>Credits: {credits}</span>
        </div>
      )}
    </div>
  );
}
