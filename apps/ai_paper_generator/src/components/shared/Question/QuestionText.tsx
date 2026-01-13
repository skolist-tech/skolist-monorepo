import { useState } from "react";
import { Textarea, Button } from "@skolist/ui";
import { Edit2, Check, X } from "lucide-react";
import type { GeneratedQuestion } from "@skolist/db";

interface QuestionTextProps {
  text: NonNullable<GeneratedQuestion["question_text"]>;
  onUpdate?: (newText: NonNullable<GeneratedQuestion["question_text"]>) => void;
  editable?: boolean;
}

export function QuestionText({
  text,
  onUpdate,
  editable = false,
}: QuestionTextProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(text);

  const handleSave = () => {
    if (editedText.trim() && editedText !== text && onUpdate) {
      onUpdate(editedText.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedText(text);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="space-y-2">
        <Textarea
          value={editedText}
          onChange={(e) => setEditedText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") handleCancel();
          }}
          className="min-h-[80px]"
          autoFocus
        />
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSave}>
            <Check className="mr-1 h-3 w-3" />
            Save
          </Button>
          <Button size="sm" variant="outline" onClick={handleCancel}>
            <X className="mr-1 h-3 w-3" />
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative">
      <p className="text-base leading-relaxed">{text}</p>
      {editable && onUpdate && (
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setIsEditing(true)}
          className="absolute -right-2 -top-2 h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
        >
          <Edit2 className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
