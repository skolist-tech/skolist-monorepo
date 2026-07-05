import { useState, useLayoutEffect, useRef } from "react";

export function useLayoutScale(
  desktopTargetWidth = 1908,
  mobileTargetWidth = 600,
  breakpoint = 1024
) {
  const [isDesktop, setIsDesktop] = useState(
    () => window.innerWidth > breakpoint
  );

  const stableHeightRef = useRef<number | null>(null);
  const lastOrientationRef = useRef<"portrait" | "landscape">(
    window.innerWidth > window.innerHeight ? "landscape" : "portrait"
  );

  // Prevent unnecessary DOM updates
  const lastValuesRef = useRef({
    scale: -1,
    width: -1,
    height: -1,
    isDesktop: window.innerWidth > breakpoint,
  });

  useLayoutEffect(() => {
    let frameId = 0;

    const updateScale = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      const currentOrientation = width > height ? "landscape" : "portrait";

      const desktop = width > breakpoint;
      const targetWidth = desktop ? desktopTargetWidth : mobileTargetWidth;

      const scale = width / targetWidth;

      // Stable height for mobile keyboard
      if (!desktop) {
        if (
          stableHeightRef.current === null ||
          currentOrientation !== lastOrientationRef.current
        ) {
          stableHeightRef.current = height;
          lastOrientationRef.current = currentOrientation;
        }
      } else {
        stableHeightRef.current = height;
      }

      const stableHeight = stableHeightRef.current ?? height;

      // Skip if nothing changed
      const last = lastValuesRef.current;

      if (
        last.scale === scale &&
        last.width === targetWidth &&
        last.height === stableHeight &&
        last.isDesktop === desktop
      ) {
        return;
      }

      lastValuesRef.current = {
        scale,
        width: targetWidth,
        height: stableHeight,
        isDesktop: desktop,
      };

      cancelAnimationFrame(frameId);

      frameId = requestAnimationFrame(() => {
        setIsDesktop((prev) => (prev === desktop ? prev : desktop));

        const root = document.documentElement;

        root.style.setProperty("--app-scale", scale.toString());
        root.style.setProperty("--app-width", `${targetWidth}px`);
        root.style.setProperty("--app-height", `${stableHeight / scale}px`);
      });
    };

    updateScale();

    // Desktop resize
    window.addEventListener("resize", updateScale, { passive: true });

    // Mobile keyboard / viewport resize
    window.visualViewport?.addEventListener("resize", updateScale);

    // Orientation change
    window.addEventListener("orientationchange", updateScale);

    return () => {
      cancelAnimationFrame(frameId);

      window.removeEventListener("resize", updateScale);
      window.visualViewport?.removeEventListener("resize", updateScale);
      window.removeEventListener("orientationchange", updateScale);
    };
  }, [desktopTargetWidth, mobileTargetWidth, breakpoint]);

  return { isDesktop };
}
