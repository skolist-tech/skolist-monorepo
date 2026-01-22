import { useState, useLayoutEffect } from "react";

export function useLayoutScale(
  desktopTargetWidth = 1908,
  mobileTargetWidth = 600,
  breakpoint = 1024
) {
  // Indicates whether layout should behave as desktop
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > breakpoint);

  useLayoutEffect(() => {
    let frameId: number;

    // Calculates scale and updates CSS variables
    const updateScale = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      const isDesktopWidth = width > breakpoint;
      const targetWidth = isDesktopWidth
        ? desktopTargetWidth
        : mobileTargetWidth;
      const scale = width / targetWidth;

      frameId = requestAnimationFrame(() => {
        setIsDesktop(isDesktopWidth);
        const root = document.documentElement;
        root.style.setProperty("--app-scale", scale.toString());
        root.style.setProperty("--app-width", `${targetWidth}px`);
        root.style.setProperty("--app-height", `${height / scale}px`);
      });
    };

    // Observes size changes and recalculates scale
    const observer = new ResizeObserver(updateScale);
    observer.observe(document.body);

    updateScale(); // Initial calculation

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frameId);
    };
  }, [desktopTargetWidth, mobileTargetWidth, breakpoint]);

  return { isDesktop };
}
