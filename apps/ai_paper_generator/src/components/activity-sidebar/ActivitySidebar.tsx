/**
 * ActivitySidebar
 * Sidebar component displaying user activities with CRUD operations
 */

import { useState } from "react";
import { useActivityContext } from "../../context/ActivityContext";
import { ActivityListItem } from "./ActivityListItem";
import { Button, Separator, Spinner, Input } from "@skolist/ui";
import { cn } from "@skolist/utils";
import {
  Plus,
  ChevronLeft,
  Search,
  ArrowDownAZ,
  ArrowUpAZ,
  FileQuestion,
  X,
} from "lucide-react";
import { subjectIcons } from "./thumbnail";

interface ActivitySidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function ActivitySidebar({
  isCollapsed,
  onToggle,
  isMobileOpen = false,
  onMobileClose,
}: ActivitySidebarProps) {
  const {
    activities,
    currentActivity,
    isLoading,
    createActivity,
    selectActivity,
    deleteActivity,
    renameActivity,
  } = useActivityContext();

  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const handleCreateActivity = async () => {
    let name = "New Activity";
    let counter = 2;

    // Check if "New Activity" exists
    const baseExists = activities.some((a) => a.name === name);

    if (baseExists) {
      while (activities.some((a) => a.name === `New Activity (${counter})`)) {
        counter++;
      }
      name = `New Activity (${counter})`;
    }

    await createActivity({ name });
  };

  const filteredActivities = activities
    .filter((activity) =>
      activity.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      return sortOrder === "asc"
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    });

  const toggleSort = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  const getActivityIcon = (name: string) => {
    const lowerName = name.toLowerCase();
    for (const [key, Icon] of Object.entries(subjectIcons)) {
      if (lowerName.includes(key)) {
        return Icon;
      }
    }
    return FileQuestion;
  };

  // Sidebar content to render (shared between mobile and desktop)
  const sidebarContent = (
    <>
      {/* Header */}
      <div
        className={cn(
          "flex items-center p-4 pb-2",
          isCollapsed ? "justify-center" : "justify-between"
        )}
      >
        {!isCollapsed && (
          <h2 className="text-lg font-bold text-foreground">Activities</h2>
        )}
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-muted-foreground"
          onClick={onToggle}
          title={isCollapsed ? "Expand" : "Collapse"}
        >
          <ChevronLeft
            className={cn(
              "h-5 w-5 transition-transform",
              isCollapsed && "rotate-180"
            )}
          />
        </Button>
      </div>

      <div className={cn("space-y-4 px-4 pb-4", isCollapsed && "px-2")}>
        {/* New Activity Button */}
        <Button
          className={cn(
            "bg-blue-600 text-white hover:bg-blue-700",
            isCollapsed ? "w-full p-0" : "w-full"
          )}
          onClick={handleCreateActivity}
          title="New Activity"
        >
          <Plus className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
          {!isCollapsed && "New Activity"}
        </Button>

        {!isCollapsed && (
          <>
            <Separator />

            {/* Search and Sort */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search activities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-background pl-9"
                />
              </div>

              <button
                onClick={toggleSort}
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

      <Separator />

      {/* Activity List */}
      <div className="flex-1 overflow-y-auto bg-gray-50/50 p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner className="h-6 w-6" />
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
            <div className="space-y-1">
              {!isCollapsed && (
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? "No matching activities" : "No activities yet"}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredActivities.map((activity) =>
              !isCollapsed ? (
                <ActivityListItem
                  key={activity.id}
                  activity={activity}
                  isSelected={currentActivity?.id === activity.id}
                  onSelect={() => selectActivity(activity.id)}
                  onRename={(newName) => renameActivity(activity.id, newName)}
                  onDelete={() => deleteActivity(activity.id)}
                />
              ) : (
                // Collapsed View Item
                <div
                  key={activity.id}
                  className={cn(
                    "mx-auto flex h-10 w-10 cursor-pointer items-center justify-center rounded-md border text-sm transition-all",
                    currentActivity?.id === activity.id
                      ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                      : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                  onClick={() => selectActivity(activity.id)}
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
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Mobile backdrop overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Mobile sidebar drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r bg-card shadow-xl transition-transform duration-300 md:hidden",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Mobile header with close button */}
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-lg font-bold text-foreground">Activities</h2>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={onMobileClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex flex-1 flex-col overflow-hidden">
          {sidebarContent}
        </div>
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden h-full flex-col border-r bg-card transition-all duration-300 md:flex",
          isCollapsed ? "w-[60px]" : "w-[260px]"
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
