import { usePaneContext } from "../../context/PaneContext";
import { useActivityContext } from "../../context/ActivityContext";
import { GenerationPane } from "../generation-pane/GenerationPane";
import { DraftProvider } from "../../context/DraftContext";
import { DraftPane } from "../draft-pane/DraftPane";
import { EmptyState } from "../shared/EmptyState";
import { FileText } from "lucide-react";
import { Button } from "@skolist/ui";

export function MainArea() {
  const { activePane } = usePaneContext();
  const { currentActivity, createActivity, activities } = useActivityContext();

  if (!currentActivity) {
    return (
      <div className="flex-1 overflow-hidden">
        <EmptyState
          icon={FileText}
          title="No Activity Selected"
          description="Select an activity from the sidebar to start working, or create a new one to begin generating question papers."
          action={
            <Button
              onClick={() =>
                createActivity({ name: `Activity ${activities.length + 1}` })
              }
            >
              Create New Activity
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <DraftProvider>
      <div className="relative flex-1 overflow-hidden">
        <div
          className={activePane === "generation" ? "h-full w-full" : "hidden"}
        >
          <GenerationPane />
        </div>
        <div className={activePane === "draft" ? "h-full w-full" : "hidden"}>
          <DraftPane />
        </div>
        {activePane === "analysis" && (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            Analysis Pane (Coming Soon)
          </div>
        )}
      </div>
    </DraftProvider>
  );
}
