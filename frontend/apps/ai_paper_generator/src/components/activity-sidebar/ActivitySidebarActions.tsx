import { Button, Input, Separator } from "@skolist/ui";
import { Plus, Search, ArrowDownAZ, ArrowUpAZ } from "lucide-react";
import { cn } from "@skolist/utils";

interface ActivitySidebarActionsProps {
  isCollapsed: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortOrder: "asc" | "desc";
  onToggleSort: () => void;
  onCreateActivity: () => void;
}

export function ActivitySidebarActions({
  isCollapsed,
  searchQuery,
  onSearchChange,
  sortOrder,
  onToggleSort,
  onCreateActivity,
}: ActivitySidebarActionsProps) {
  return (
    <div className={cn("space-y-4 px-4 pb-4", isCollapsed && "px-2")}>
      <Button
        className={cn(
          "bg-blue-600 text-white hover:bg-blue-700",
          isCollapsed ? "w-full p-0" : "w-full"
        )}
        onClick={onCreateActivity}
        title="New Activity"
        aria-label="Create new activity"
      >
        <Plus className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
        {!isCollapsed && "New Activity"}
      </Button>

      {!isCollapsed && (
        <>
          <Separator />
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search activities..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="bg-background pl-9"
              />
            </div>

            <button
              onClick={onToggleSort}
              className="flex items-center text-xs font-medium text-foreground transition-colors hover:text-primary"
            >
              {sortOrder === "asc" ? (
                <ArrowDownAZ className="mr-2 h-4 w-4" />
              ) : (
                <ArrowUpAZ className="mr-2 h-4 w-4" />
              )}
              Sort: {sortOrder === "asc" ? "A-Z" : "Z-A"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
