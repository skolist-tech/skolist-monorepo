import { Spinner } from "@skolist/ui";
import { cn } from "@skolist/utils";
import type { Activity } from "@skolist/db";
import { ActivityListItem } from "./ActivityListItem";
import { getActivityIcon } from "./activity-utils";

interface ActivityListProps {
  isLoading: boolean;
  activities: Activity[];
  currentActivityId?: string;
  isCollapsed: boolean;
  onSelect: (id: string) => void;
  onRename: (id: string, name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  searchQuery: string;
}

export function ActivityList({
  isLoading,
  activities,
  currentActivityId,
  isCollapsed,
  onSelect,
  onRename,
  onDelete,
  searchQuery,
}: ActivityListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
        <div className="space-y-1">
          {!isCollapsed && (
            <p className="text-sm text-muted-foreground">
              {searchQuery ? "No matching activities" : "No activities yet"}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {activities.map((activity) =>
        !isCollapsed ? (
          <ActivityListItem
            key={activity.id}
            activity={activity}
            isSelected={currentActivityId === activity.id}
            onSelect={() => onSelect(activity.id)}
            onRename={(newName) => onRename(activity.id, newName)}
            onDelete={() => onDelete(activity.id)}
          />
        ) : (
          <div
            key={activity.id}
            className={cn(
              "mx-auto flex h-10 w-10 cursor-pointer items-center justify-center rounded-md border text-sm transition-all",
              currentActivityId === activity.id
                ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
            onClick={() => onSelect(activity.id)}
            title={activity.name}
          >
            {(() => {
              const Icon = getActivityIcon(activity.name);
              return <Icon className="h-5 w-5" />;
            })()}
          </div>
        )
      )}
    </div>
  );
}
