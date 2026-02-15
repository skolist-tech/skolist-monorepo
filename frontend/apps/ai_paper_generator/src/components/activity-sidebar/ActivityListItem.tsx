/**
 * ActivityListItem
 * Individual activity item in the sidebar with select, rename, and delete actions
 */

import type { Activity } from "@skolist/db";
import { cn } from "@skolist/utils";
import { ConfirmDialog } from "../shared/ConfirmDialog";
import { useActivityItemState } from "./use-activity-item-state";
import { ActivityItemView } from "./ActivityItemView";
import { ActivityItemEdit } from "./ActivityItemEdit";

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
  const {
    isEditing,
    setIsEditing,
    editName,
    setEditName,
    isDeleting,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    inputRef,
    handleSave,
    handleCancel,
    handleDelete,
  } = useActivityItemState(activity, onRename, onDelete);

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
        <ActivityItemEdit
          value={editName}
          onChange={setEditName}
          onSave={handleSave}
          onCancel={handleCancel}
          inputRef={inputRef}
        />
      ) : (
        <ActivityItemView
          activity={activity}
          isSelected={isSelected}
          onEdit={() => setIsEditing(true)}
          onDelete={() => setIsDeleteModalOpen(true)}
          isDeleting={isDeleting}
        />
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
          {/* Placeholder for future status/date metadata */}
        </div>
      )}
    </div>
  );
}
