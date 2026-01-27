import { useCallback, useLayoutEffect, useState, type RefObject } from "react";
import type { PaperItem } from "./usePaperItems";

// Constants (sync with PaperPreview or pass as config later if needed)
const A4_WIDTH_MM = 210;
const MARGIN_MM = 20;

// 1mm approx 3.78px at 96 DPI.
// Assuming 794px width (standard for A4 at 96 DPI) for the preview.
export const PAGE_WIDTH_PX = 794;
export const PAGE_HEIGHT_PX = 1123;
export const PADDING_PX = (PAGE_WIDTH_PX * MARGIN_MM) / A4_WIDTH_MM; // approx 75px
export const CONTENT_WIDTH_PX = PAGE_WIDTH_PX - PADDING_PX * 2;
export const FOOTER_HEIGHT_PX = 30; // Reserve space for page footer
export const CONTENT_HEIGHT_PX =
  PAGE_HEIGHT_PX - PADDING_PX * 2 - FOOTER_HEIGHT_PX;

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
        currentHeight + height > CONTENT_HEIGHT_PX &&
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
