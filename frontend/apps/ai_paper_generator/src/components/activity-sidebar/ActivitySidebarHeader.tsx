import { Button } from "@skolist/ui";
import { ChevronLeft } from "lucide-react";
import { cn } from "@skolist/utils";

interface ActivitySidebarHeaderProps {
  isCollapsed: boolean;
  onToggle: () => void;
  title?: string;
}

export function ActivitySidebarHeader({
  isCollapsed,
  onToggle,
  title = "Activities",
}: ActivitySidebarHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-center p-4 pb-2",
        isCollapsed ? "justify-center" : "justify-between"
      )}
    >
      {!isCollapsed && (
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
      )}
      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8 text-muted-foreground"
        onClick={onToggle}
        title={isCollapsed ? "Expand" : "Collapse"}
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <ChevronLeft
          className={cn(
            "h-5 w-5 transition-transform",
            isCollapsed && "rotate-180"
          )}
        />
      </Button>
    </div>
  );
}
