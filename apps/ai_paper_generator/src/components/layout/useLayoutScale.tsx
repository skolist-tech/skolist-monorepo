import { useState, useLayoutEffect, useRef } from "react";

export function useLayoutScale(
  desktopTargetWidth = 1908,
  mobileTargetWidth = 600,
  breakpoint = 1024
) {
  // Indicates whether layout should behave as desktop
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > breakpoint);
  // Store initial height to prevent virtual keyboard from affecting layout
  const stableHeightRef = useRef<number | null>(null);
  const lastOrientationRef = useRef<"portrait" | "landscape">(
    window.innerWidth > window.innerHeight ? "landscape" : "portrait"
  );

  useLayoutEffect(() => {
    let frameId: number;

    // Calculates scale and updates CSS variables
    const updateScale = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const currentOrientation = width > height ? "landscape" : "portrait";

      const isDesktopWidth = width > breakpoint;
      const targetWidth = isDesktopWidth
        ? desktopTargetWidth
        : mobileTargetWidth;
      const scale = width / targetWidth;

      // On mobile, lock the height to prevent virtual keyboard from affecting layout
      // Only update height on initial load or orientation change
      if (!isDesktopWidth) {
        if (
          stableHeightRef.current === null ||
          currentOrientation !== lastOrientationRef.current
        ) {
          // Use the maximum of current height and stored height to get the full viewport
          // On initial load or orientation change, capture the full height
          stableHeightRef.current = height;
          lastOrientationRef.current = currentOrientation;
        }
      } else {
        // On desktop, always use current height
        stableHeightRef.current = height;
      }

      const stableHeight = stableHeightRef.current ?? height;

      frameId = requestAnimationFrame(() => {
        setIsDesktop(isDesktopWidth);
        const root = document.documentElement;
        root.style.setProperty("--app-scale", scale.toString());
        root.style.setProperty("--app-width", `${targetWidth}px`);
        root.style.setProperty("--app-height", `${stableHeight / scale}px`);
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
