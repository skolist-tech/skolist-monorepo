/**
 * ActivityListItem
 * Individual activity item in the sidebar with select, rename, and delete actions
 */

import { useState, useRef, useEffect } from "react";
import { Button, Input } from "@skolist/ui";
import { Trash2, Pencil, Check, X } from "lucide-react";
import type { Activity } from "@skolist/db";
import { cn } from "@skolist/utils";
import { ConfirmDialog } from "../shared/ConfirmDialog";

interface ActivityListItemProps {
  activity: Activity;
  isSelected: boolean;
  onSelect: () => void;
  onRename: (newName: string) => Promise<void>;
  onDelete: () => Promise<void>;
}

export function ActivityListItem({
  activity,
  isSelected,
  onSelect,
  onRename,
  onDelete,
}: ActivityListItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(activity.name);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = async () => {
    const trimmedName = editName.trim();
    if (trimmedName && trimmedName !== activity.name) {
      await onRename(trimmedName);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditName(activity.name);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  const handleDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await onDelete();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className={cn(
        "group relative flex cursor-pointer flex-col rounded-lg border bg-card p-3 text-sm transition-all",
        isSelected
          ? "border-blue-500 bg-blue-50/50 shadow-sm ring-1 ring-blue-500/20"
          : "border-border shadow-sm hover:border-blue-300"
      )}
      onClick={() => !isEditing && onSelect()}
    >
      {isEditing ? (
        <div className="flex items-center gap-1">
          <Input
            ref={inputRef}
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            className="h-7 text-sm"
            onClick={(e) => e.stopPropagation()}
          />
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              handleSave();
            }}
          >
            <Check className="h-3 w-3" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              handleCancel();
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <div className="flex items-start justify-between gap-2">
          <span
            className={cn(
              "truncate font-medium",
              isSelected ? "text-blue-700" : "text-foreground"
            )}
          >
            {activity.name}
          </span>

          <div className="absolute right-2 top-2 flex rounded-md border border-border bg-white/80 opacity-0 shadow-sm backdrop-blur-sm transition-opacity group-hover:opacity-100">
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 hover:text-blue-600"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
            >
              <Pencil className="h-3 w-3" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 text-muted-foreground hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                setIsDeleteModalOpen(true);
              }}
              disabled={isDeleting}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        title="Delete Activity"
        description={`Are you sure you want to delete "${activity.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        variant="destructive"
        confirmLabel="Delete"
      />

      {!isEditing && (
        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          {/* Placeholder for question count/status if needed later */}
          {/* For now keeping it empty or maybe showing date? User said "only UI", so just matching the look */}
        </div>
      )}
    </div>
  );
}
