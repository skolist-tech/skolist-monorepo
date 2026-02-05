import { Button } from "@skolist/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@skolist/ui";
import { GeneratedQuestionCard } from "../shared/Question/GeneratedQuestionCard";
import { GeneratedQuestionWithConcepts } from "../../services/questionService";

interface ActionReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  title: string;
  originalData: GeneratedQuestionWithConcepts;
  newData: GeneratedQuestionWithConcepts;
}

export const ActionReviewModal = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  title,
  originalData,
  newData,
}: ActionReviewModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex h-[90vh] max-w-[95vw] flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>{title} - Review Changes</DialogTitle>
          <DialogDescription>
            Review the changes before applying them. Left is original, Right is
            new.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-1 gap-4 overflow-y-auto rounded-md border bg-muted/20 p-4">
          {/* Original View */}
          <div className="flex flex-1 flex-col gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Original
            </h3>
            <div className="pointer-events-none origin-top scale-[0.98] opacity-80">
              {/* Reuse Card but disable actions if possible or just show purely as display */}
              <GeneratedQuestionCard
                question={originalData}
                onMoveToDraft={() => {}}
                onDelete={async () => {}}
                onRegenerate={() => {}}
                onAutoCorrect={async () => {}}
                onUpdate={() => {}}
                isReadOnly={true}
              />
            </div>
          </div>

          {/* New View */}
          <div className="flex flex-1 flex-col gap-2 border-l pl-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-primary">
                New Version
              </h3>
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-600">
                Proposed Change
              </span>
            </div>

            <div className="rounded-lg border-2 border-green-500/20 bg-green-50/10 p-1">
              <GeneratedQuestionCard
                question={newData}
                onMoveToDraft={() => {}}
                onDelete={async () => {}}
                onRegenerate={() => {}}
                onAutoCorrect={async () => {}}
                onUpdate={() => {}}
                // We allow interaction here if user wants to see dropdowns etc,
                // but usually read-only for review.
                // If we want manual tweaks on top of auto-correct, we might enable edit.
                // For now, let's keep it read-only for simplicity as per "Preview" flow.
                isReadOnly={true}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isLoading}>
            {isLoading ? "Saving..." : "Accept & Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
