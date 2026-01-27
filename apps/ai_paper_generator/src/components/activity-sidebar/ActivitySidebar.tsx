/**
 * ActivitySidebar
 * Sidebar component displaying user activities with CRUD operations
 */

import { useActivityContext } from "../../context/ActivityContext";
import { Button, Separator } from "@skolist/ui";
import { cn } from "@skolist/utils";
import { X } from "lucide-react";
import { ActivitySidebarHeader } from "./ActivitySidebarHeader";
import { ActivitySidebarActions } from "./ActivitySidebarActions";
import { ActivityList } from "./ActivityList";
import { useFilteredActivities } from "./use-filtered-activities";

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

  const {
    searchQuery,
    setSearchQuery,
    sortOrder,
    toggleSort,
    filteredActivities,
  } = useFilteredActivities(activities);

  const sidebarContent = (
    <>
      <ActivitySidebarHeader isCollapsed={isCollapsed} onToggle={onToggle} />

      <ActivitySidebarActions
        isCollapsed={isCollapsed}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortOrder={sortOrder}
        onToggleSort={toggleSort}
        onCreateActivity={createActivity}
      />

      <Separator />

      <div className="flex-1 overflow-y-auto bg-gray-50/50 p-4">
        <ActivityList
          isLoading={isLoading}
          activities={filteredActivities}
          currentActivityId={currentActivity?.id}
          isCollapsed={isCollapsed}
          onSelect={selectActivity}
          onRename={renameActivity}
          onDelete={deleteActivity}
          searchQuery={searchQuery}
        />
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
