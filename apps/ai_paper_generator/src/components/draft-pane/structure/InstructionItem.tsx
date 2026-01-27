import type { QgenDraftInstructionAndQgenDraft } from "@skolist/db";
import { useState, useEffect } from "react";
import { Button, Textarea } from "@skolist/ui";
import { Pencil, Trash2 } from "lucide-react";
import { useDraftContext } from "../../../context/DraftContext";

export const InstructionItem = ({
  item,
}: {
  item: QgenDraftInstructionAndQgenDraft;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(item.instruction_text || "");
  const { removeInstruction, editInstruction } = useDraftContext();
  const handleDeleteInstruction = async (id: string) => {
    try {
      await removeInstruction(id);
    } catch (err) {
      console.error(err);
    }
  };

  /* Fix: Sync state with props changes (only when not editing) */
  useEffect(() => {
    if (!isEditing) {
      setText(item.instruction_text || "");
    }
  }, [item.instruction_text, isEditing]);

  const handleUpdateInstruction = async (id: string, text: string) => {
    try {
      await editInstruction(id, text);
    } catch (err) {
      console.error(err);
    }
  };

  const save = () => {
    if (text !== item.instruction_text) {
      handleUpdateInstruction(item.id, text);
    }
    setIsEditing(false);
  };

  const cancel = () => {
    setText(item.instruction_text || "");
    setIsEditing(false);
  };

  return (
    <div className="group flex items-start justify-between gap-2 rounded border border-transparent p-2 hover:border-border hover:bg-muted/10">
      {isEditing ? (
        <div className="flex-1 space-y-2">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[60px] text-xs"
            autoFocus
          />
          <div className="flex gap-2">
            <Button size="sm" className="h-6 text-xs" onClick={save}>
              Save
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 text-xs"
              onClick={cancel}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <>
          <p className="flex-1 whitespace-pre-wrap text-xs text-muted-foreground">
            {item.instruction_text}
          </p>
          <div className="flex">
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={() => setIsEditing(true)}
            >
              <Pencil className="h-3 w-3" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 text-destructive"
              onClick={() => handleDeleteInstruction(item.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
};
