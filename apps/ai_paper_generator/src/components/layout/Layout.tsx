import { useState } from "react";
import { Header } from "../header/Header";
import { ActivitySidebar } from "../activity-sidebar/ActivitySidebar";
import { MainArea } from "./MainArea";

export function Layout() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="flex h-screen flex-col bg-background">
      <Header onMenuClick={() => setIsMobileOpen(true)} />
      <div className="flex flex-1 overflow-hidden">
        <ActivitySidebar
          isCollapsed={isCollapsed}
          onToggle={() => setIsCollapsed(!isCollapsed)}
          isMobileOpen={isMobileOpen}
          onMobileClose={() => setIsMobileOpen(false)}
        />
        <MainArea />
      </div>
    </div>
  );
}
