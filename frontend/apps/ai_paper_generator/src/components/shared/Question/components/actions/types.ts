import type React from "react";

/**
 * Shared props interface for action button components
 */
export interface ActionButtonProps {
  mode: "icon" | "menu";
}

/**
 * Common styling classes for action buttons
 */
export const getButtonClasses = (mode: "icon" | "menu") => ({
  btnClass:
    mode === "menu"
      ? "flex w-full cursor-pointer items-center justify-start gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted"
      : "",
  iconSizeClass: "h-4 w-4",
});

/**
 * Common click handler that stops propagation in menu mode
 */
export const handleMenuClick = (
  e: React.MouseEvent,
  mode: "icon" | "menu",
  handler: () => void
) => {
  if (mode === "menu") e.stopPropagation();
  handler();
};
