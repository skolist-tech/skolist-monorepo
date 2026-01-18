import { usePaneContext } from "../../context/PaneContext";
import { useActivityContext } from "../../context/ActivityContext";
import { GenerationPane } from "../generation-pane/GenerationPane";
import { DraftProvider } from "../../context/DraftContext";
import { DraftPane } from "../draft-pane/DraftPane";
import { EmptyState } from "../shared/EmptyState";
import { FileText } from "lucide-react";
import { Button } from "@skolist/ui";
import { AnalysisPane } from "../analysis-pane/AnalysisPane";

export function MainArea() {
  const { activePane } = usePaneContext();
  const { currentActivity, createActivity } = useActivityContext();

  if (!currentActivity) {
    return (
      <div className="flex-1 overflow-hidden">
        <EmptyState
          icon={FileText}
          title="No Activity Selected"
          description="Select an activity from the sidebar to start working, or create a new one to begin generating question papers."
          action={
            <Button onClick={() => createActivity()}>
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
          <div className="h-full w-full">
            <AnalysisPane />
          </div>
        )}
      </div>
    </DraftProvider>
  );
}
