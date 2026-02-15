import { CARD_ACTIONS_CONFIG } from "../../card-actions-config";
import { UndoButton } from "./UndoButton";
import { RedoButton } from "./RedoButton";

interface MobileBottomActionsProps {
  canUndo: boolean;
  canRedo: boolean;
  isUndoing: boolean;
  isRedoing: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

export function MobileBottomActions({
  canUndo,
  canRedo,
  isUndoing,
  isRedoing,
  onUndo,
  onRedo,
}: MobileBottomActionsProps) {
  const mobileBottomActions = [...CARD_ACTIONS_CONFIG]
    .filter(
      (a) =>
        a.mobile.visible &&
        a.mobile.location === "bottom" &&
        (a.id === "undo" || a.id === "redo")
    )
    .sort((a, b) => a.mobile.order - b.mobile.order);

  if (mobileBottomActions.length === 0) return null;

  return (
    <div className="mt-3 flex justify-center md:hidden">
      <div className="flex items-center gap-1 rounded-md bg-background/80 p-1 backdrop-blur-sm">
        {mobileBottomActions.map((action) => {
          if (action.id === "undo") {
            return (
              <UndoButton
                key={action.id}
                mode="icon"
                canUndo={canUndo}
                isUndoing={isUndoing}
                onUndo={onUndo}
              />
            );
          }
          if (action.id === "redo") {
            return (
              <RedoButton
                key={action.id}
                mode="icon"
                canRedo={canRedo}
                isRedoing={isRedoing}
                onRedo={onRedo}
              />
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}
