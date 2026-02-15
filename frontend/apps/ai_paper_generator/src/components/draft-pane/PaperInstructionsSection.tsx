import { useState } from "react";
import { Plus } from "lucide-react";
import { Button, Label, Switch, Textarea } from "@skolist/ui";
import { useDraftContext } from "../../context/DraftContext";
import { InstructionItem } from "./structure/InstructionItem";
import type { QgenDraft } from "@skolist/db";

interface PaperInstructionsSectionProps {
  draft: QgenDraft;
}

export function PaperInstructionsSection({
  draft,
}: PaperInstructionsSectionProps) {
  const {
    instructions,
    addInstruction,
    showInstructions,
    setShowInstructions,
    showExplanation,
    setShowExplanation,
  } = useDraftContext();
  const [newInstructionText, setNewInstructionText] = useState("");
  const [isAddingInstruction, setIsAddingInstruction] = useState(false);

  const handleAddInstruction = async () => {
    if (!newInstructionText.trim() || !draft.id) return;
    try {
      await addInstruction(newInstructionText);
      setNewInstructionText("");
      setIsAddingInstruction(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-2 border-t pt-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold uppercase text-muted-foreground">
          General Instructions
        </Label>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="h-6 gap-1 text-xs"
            onClick={() => setIsAddingInstruction(true)}
          >
            <Plus className="h-3 w-3" />
            Add
          </Button>
          <Switch
            checked={showInstructions}
            onCheckedChange={setShowInstructions}
            title={showInstructions ? "Hide on Paper" : "Show on Paper"}
          />
        </div>
      </div>

      {isAddingInstruction && (
        <div className="space-y-2 rounded-md border bg-muted/20 p-2">
          <Textarea
            placeholder="Type instruction..."
            className="min-h-[60px] text-xs"
            value={newInstructionText}
            onChange={(e) => setNewInstructionText(e.target.value)}
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 text-xs"
              onClick={() => setIsAddingInstruction(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="h-6 text-xs"
              onClick={handleAddInstruction}
            >
              Add
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-1">
        {instructions.map((inst) => (
          <InstructionItem key={inst.id} item={inst} />
        ))}
        {instructions.length === 0 && !isAddingInstruction && (
          <div className="py-4 text-center text-xs italic text-muted-foreground">
            No instructions added yet.
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t pt-2">
        <Label className="text-xs font-semibold uppercase text-muted-foreground">
          Show Explanation on Answer Key
        </Label>
        <Switch
          checked={showExplanation}
          onCheckedChange={setShowExplanation}
          title={showExplanation ? "Hide Explanations" : "Show Explanations"}
        />
      </div>
    </div>
  );
}
