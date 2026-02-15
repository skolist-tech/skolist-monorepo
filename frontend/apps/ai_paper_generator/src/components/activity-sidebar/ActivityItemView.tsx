import { Button } from "@skolist/ui";
import { Pencil, Trash2 } from "lucide-react";
import type { Activity } from "@skolist/db";
import { cn } from "@skolist/utils";

interface ActivityItemViewProps {
  activity: Activity;
  isSelected: boolean;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}

export function ActivityItemView({
  activity,
  isSelected,
  onEdit,
  onDelete,
  isDeleting,
}: ActivityItemViewProps) {
  return (
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
            onEdit();
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
            onDelete();
          }}
          disabled={isDeleting}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
