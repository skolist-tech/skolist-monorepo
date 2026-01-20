import { useState, useLayoutEffect } from "react";

export function useLayoutScale(targetWidth = 1760, breakpoint = 1024) {
  // Indicates whether layout should behave as desktop
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > breakpoint);

  useLayoutEffect(() => {
    let frameId: number;

       // Calculates scale and updates CSS variables
    const updateScale = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      if (width > breakpoint) {
        const scale = width / targetWidth;
        
         // Desktop: scale UI to fixed design width
        frameId = requestAnimationFrame(() => {
          setIsDesktop(true);
          const root = document.documentElement;
          root.style.setProperty("--app-scale", scale.toString());
          root.style.setProperty("--app-width", `${targetWidth}px`);
          root.style.setProperty("--app-height", `${height / scale}px`);
        });
      } else {
        setIsDesktop(false);
        const root = document.documentElement;
        root.style.setProperty("--app-scale", "1");
        root.style.setProperty("--app-width", "100%");
        root.style.setProperty("--app-height", "100%");
      }
    };

     // Observes size changes and recalculates scale
    const observer = new ResizeObserver(updateScale);
    observer.observe(document.body);
    
    updateScale(); // Initial calculation

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frameId);
    };
  }, [targetWidth, breakpoint]);

  return { isDesktop };
}