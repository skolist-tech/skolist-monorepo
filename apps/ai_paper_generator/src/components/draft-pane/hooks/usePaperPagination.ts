import { useCallback, useLayoutEffect, useState, type RefObject } from "react";
import type { PaperItem } from "./usePaperItems";

// ============================================================================
// PAGE LAYOUT CONSTANTS
// These values work with CSS variables defined in index.css
// To change page margins/spacing, edit :root { --paper-margin-*-mm } in DevTools
// ============================================================================

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;

// Helper to read CSS variable values at runtime
function getCssVariable(name: string, fallback: number): number {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return value ? parseFloat(value) : fallback;
}

// Default values (used for SSR and initial render)
const DEFAULT_MARGIN_TOP_MM = 20;
const DEFAULT_MARGIN_RIGHT_MM = 20;
const DEFAULT_MARGIN_BOTTOM_MM = 20;
const DEFAULT_MARGIN_LEFT_MM = 20;
const DEFAULT_FOOTER_HEIGHT_PX = 30;

// Fixed A4 dimensions at 96 DPI
export const PAGE_WIDTH_PX = 794;
export const PAGE_HEIGHT_PX = 1123;

// Helper to convert mm to px for A4
function mmToPxHorizontal(mm: number): number {
  return (PAGE_WIDTH_PX * mm) / A4_WIDTH_MM;
}

function mmToPxVertical(mm: number): number {
  return (PAGE_HEIGHT_PX * mm) / A4_HEIGHT_MM;
}

// Dynamic getters that read from CSS variables
export function getMarginTopPx(): number {
  const mm = getCssVariable("--paper-margin-top-mm", DEFAULT_MARGIN_TOP_MM);
  return mmToPxVertical(mm);
}

export function getMarginRightPx(): number {
  const mm = getCssVariable("--paper-margin-right-mm", DEFAULT_MARGIN_RIGHT_MM);
  return mmToPxHorizontal(mm);
}

export function getMarginBottomPx(): number {
  const mm = getCssVariable(
    "--paper-margin-bottom-mm",
    DEFAULT_MARGIN_BOTTOM_MM
  );
  return mmToPxVertical(mm);
}

export function getMarginLeftPx(): number {
  const mm = getCssVariable("--paper-margin-left-mm", DEFAULT_MARGIN_LEFT_MM);
  return mmToPxHorizontal(mm);
}

// Legacy function for backward compatibility (uses average of horizontal margins)
export function getPaddingPx(): number {
  return (getMarginLeftPx() + getMarginRightPx()) / 2;
}

export function getFooterHeightPx(): number {
  const cssValue = getCssVariable(
    "--paper-footer-height",
    DEFAULT_FOOTER_HEIGHT_PX
  );
  return cssValue;
}

export function getContentWidthPx(): number {
  return PAGE_WIDTH_PX - getMarginLeftPx() - getMarginRightPx();
}

export function getContentHeightPx(): number {
  return (
    PAGE_HEIGHT_PX -
    getMarginTopPx() -
    getMarginBottomPx() -
    getFooterHeightPx()
  );
}

// Static exports for components that need initial values
const defaultPaddingHorizontal = mmToPxHorizontal(DEFAULT_MARGIN_LEFT_MM);
const defaultPaddingVertical = mmToPxVertical(DEFAULT_MARGIN_TOP_MM);
export const PADDING_PX = defaultPaddingHorizontal; // Legacy
export const CONTENT_WIDTH_PX = PAGE_WIDTH_PX - defaultPaddingHorizontal * 2;
export const FOOTER_HEIGHT_PX = DEFAULT_FOOTER_HEIGHT_PX;
export const CONTENT_HEIGHT_PX =
  PAGE_HEIGHT_PX - defaultPaddingVertical * 2 - FOOTER_HEIGHT_PX;

export interface PageData {
  pageNumber: number;
  items: PaperItem[];
}

export function usePaperPagination(
  items: PaperItem[],
  measureRef: RefObject<HTMLElement>
) {
  const [pages, setPages] = useState<PageData[]>([]);

  // Measure Function
  const calculatePages = useCallback(() => {
    if (!measureRef.current) return;

    // Read dynamic values from CSS variables
    const contentHeightPx = getContentHeightPx();

    const container = measureRef.current;
    const itemNodes = container.querySelectorAll("[data-item-id]");
    const calculatedPages: PageData[] = [];
    let currentPageItems: PaperItem[] = [];
    let currentHeight = 0;
    let pageNumber = 1;

    itemNodes.forEach((node) => {
      const itemId = node.getAttribute("data-item-id");
      const item = items.find((i) => i.id === itemId);
      if (!item) return;

      const height = (node as HTMLElement).offsetHeight;

      // Check overflow
      if (
        currentHeight + height > contentHeightPx &&
        currentPageItems.length > 0
      ) {
        // Push old page
        calculatedPages.push({
          pageNumber,
          items: [...currentPageItems],
        });
        // Start new page
        pageNumber++;
        currentPageItems = [item];
        currentHeight = height;
      } else {
        // Add to current
        currentPageItems.push(item);
        currentHeight += height;
      }

      // Check forced break
      if (item.isPageBreakBelow) {
        calculatedPages.push({
          pageNumber,
          items: [...currentPageItems],
        });
        pageNumber++;
        currentPageItems = [];
        currentHeight = 0;
      }
    });

    // Push last page
    if (currentPageItems.length > 0) {
      calculatedPages.push({
        pageNumber,
        items: [...currentPageItems],
      });
    }

    setPages(calculatedPages);
  }, [items, measureRef]);

  // Trigger measurement when items change or content resizes
  useLayoutEffect(() => {
    let debounceTimer: ReturnType<typeof setTimeout>;

    const debouncedCalculatePages = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        calculatePages();
      }, 50);
    };

    // Initial measurement after DOM renders
    debouncedCalculatePages();

    // Use ResizeObserver to detect when content finishes rendering (images load, fonts apply, etc.)
    const resizeObserver = new ResizeObserver(() => {
      debouncedCalculatePages();
    });

    // Observe the measure container for size changes
    if (measureRef.current) {
      resizeObserver.observe(measureRef.current);
      // Also observe each item for individual size changes
      const itemNodes = measureRef.current.querySelectorAll("[data-item-id]");
      itemNodes.forEach((node) => resizeObserver.observe(node));
    }

    return () => {
      clearTimeout(debounceTimer);
      resizeObserver.disconnect();
    };
  }, [items, calculatePages, measureRef]);

  return { pages };
}
