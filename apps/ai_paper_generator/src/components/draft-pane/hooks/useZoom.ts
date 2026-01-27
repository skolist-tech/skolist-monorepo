import { useEffect, useRef, useState, type RefObject } from "react";
import type { QgenDraft } from "@skolist/db";

const MIN_SCALE = 0.5;
const MAX_SCALE = 2.0;

export function useZoom(
  containerRef: RefObject<HTMLElement>,
  draft?: QgenDraft | null
) {
  // Default 70% on mobile (<768px), 90% on desktop
  const getInitialScale = () =>
    typeof window !== "undefined" && window.innerWidth < 768 ? 0.8 : 0.9;

  const [scale, setScale] = useState<number>(getInitialScale);
  const scaleRef = useRef(scale);

  // Update scaleRef whenever scale changes
  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  // Handle zoom interactions
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Wheel Zoom (Trackpad Pinch or Ctrl + Mouse Wheel)
    const handleWheel = (e: WheelEvent) => {
      // Check if it's a pinch gesture (ctrlKey) or mouse wheel with ctrl
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        e.stopPropagation();

        // Normalize delta
        // deltaMode: 0 (pixels), 1 (lines), 2 (pages)
        let delta = e.deltaY;
        if (e.deltaMode === 1) delta *= 33;
        if (e.deltaMode === 2) delta *= 800;

        const sensitivity = 0.005;
        const zoomDelta = -delta * sensitivity;

        setScale((prev) => {
          const newScale = prev + zoomDelta;
          return Math.min(Math.max(newScale, MIN_SCALE), MAX_SCALE);
        });
      }
    };

    // 2. Touch Zoom (Pinch on Touchscreen)
    let initialDistance = 0;
    let initialScale = 1;

    const getDistance = (touches: TouchList) => {
      const touch1 = touches[0];
      const touch2 = touches[1];
      if (!touch1 || !touch2) return 0;
      return Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        initialDistance = getDistance(e.touches);
        initialScale = scaleRef.current;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault(); // Prevent page scroll
        const currentDistance = getDistance(e.touches);
        if (initialDistance > 0) {
          const ratio = currentDistance / initialDistance;
          setScale(() => {
            const newScale = initialScale * ratio;
            return Math.min(Math.max(newScale, MIN_SCALE), MAX_SCALE);
          });
        }
      }
    };

    // 3. Gesture Zoom (Safari specific for Trackpad Pinch if not covered by wheel)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleGestureStart = (e: any) => {
      e.preventDefault();
      initialScale = scaleRef.current;
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleGestureChange = (e: any) => {
      e.preventDefault();
      setScale(() => {
        const newScale = initialScale * e.scale;
        return Math.min(Math.max(newScale, MIN_SCALE), MAX_SCALE);
      });
    };

    // Add Listeners
    container.addEventListener("wheel", handleWheel, { passive: false });
    container.addEventListener("touchstart", handleTouchStart, {
      passive: false,
    });
    container.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });

    // Check for gesture support (Safari)
    if ("ongesturestart" in window) {
      container.addEventListener("gesturestart", handleGestureStart, {
        passive: false,
      });
      container.addEventListener("gesturechange", handleGestureChange, {
        passive: false,
      });
    }

    return () => {
      container.removeEventListener("wheel", handleWheel);
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);

      if ("ongesturestart" in window) {
        container.removeEventListener("gesturestart", handleGestureStart);
        container.removeEventListener("gesturechange", handleGestureChange);
      }
    };
  }, [draft, containerRef]); // Re-bind when draft loads or container changes

  return {
    scale,
    setScale,
    MIN_SCALE,
    MAX_SCALE,
    resetZoom: () => setScale(getInitialScale()),
  };
}
