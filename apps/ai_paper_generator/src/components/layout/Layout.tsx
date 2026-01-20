import React, { useState, useMemo } from "react";
import { Header } from "../header/Header";
import { ActivitySidebar } from "../activity-sidebar/ActivitySidebar";
import { MainArea } from "./MainArea";
import { useLayoutScale } from "./useLayoutScale";

export const Layout: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  const { isDesktop } = useLayoutScale(1760, 1024);


  const containerStyle: React.CSSProperties = useMemo(() => ({
    width: "var(--app-width, 100%)",
    height: "var(--app-height, 100vh)",
    transform: isDesktop ? "scale(var(--app-scale, 1))" : "none",
    transformOrigin: "top left",
    willChange: isDesktop ? "transform" : "auto",
    backfaceVisibility: "hidden", 
    WebkitFontSmoothing: "antialiased", 
  }), [isDesktop]);

  return (
    <div className="fixed inset-0 overflow-hidden bg-background">
      <div style={containerStyle} className="flex flex-col bg-background">
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
    </div>
  );
};






