import { useState, useRef, useEffect } from "react";
import { Input, Badge } from "@skolist/ui";
import type { GeneratedQuestion } from "@skolist/db";

interface QuestionMarksProps {
  marks: GeneratedQuestion["marks"];
  onUpdate?: (newMarks: number) => Promise<void>;
  editable?: boolean;
}

export function QuestionMarks({
  marks,
  onUpdate,
  editable = false,
}: QuestionMarksProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedMarks, setEditedMarks] = useState(marks?.toString() ?? "1");
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync with prop changes
  useEffect(() => {
    setEditedMarks(marks?.toString() ?? "1");
  }, [marks]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = async () => {
    const newMarks = parseInt(editedMarks, 10);

    // Validate: min 1, max 20
    if (isNaN(newMarks) || newMarks < 1 || newMarks > 20) {
      setEditedMarks(marks?.toString() ?? "1");
      setIsEditing(false);
      return;
    }

    // Only update if value changed
    if (newMarks !== marks && onUpdate) {
      try {
        setIsSaving(true);
        await onUpdate(newMarks);
      } catch (error) {
        console.error("Failed to update marks:", error);
        setEditedMarks(marks?.toString() ?? "1");
      } finally {
        setIsSaving(false);
      }
    }

    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedMarks(marks?.toString() ?? "1");
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    }
    if (e.key === "Escape") {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="inline-flex items-center gap-1">
        <Input
          ref={inputRef}
          type="number"
          min="1"
          max="20"
          value={editedMarks}
          onChange={(e) => setEditedMarks(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          className="h-6 w-14 px-2 text-xs font-bold"
          disabled={isSaving}
        />
        <span className="pl-2 text-xs">marks</span>
      </div>
    );
  }

  return (
    <Badge
      variant="secondary"
      className={`text-xs ${
        editable && onUpdate
          ? "cursor-pointer transition-colors hover:bg-secondary/80"
          : ""
      }`}
      onClick={() => {
        if (editable && onUpdate) {
          setIsEditing(true);
        }
      }}
    >
      {marks ?? 0} marks
    </Badge>
  );
}
