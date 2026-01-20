import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useReactToPrint } from "react-to-print";

import {
  Printer,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  FileText,
  CheckSquare,
  FileDown,
  ChevronDown,
  Download,
} from "lucide-react";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  useToast,
} from "@skolist/ui";
import { cn } from "@skolist/utils";

import { useDraftContext } from "../../context/DraftContext";
import { useQuestionsContext } from "../../context/QuestionsContext";
import type { GeneratedQuestionWithConcepts } from "../../services/questionService";
import type { QgenDraft, QgenDraftSection } from "@skolist/db";
import type { QgenInstruction } from "../../services/draftService";
import { LatexHtmlRenderer, LatexRenderer } from "../shared/LatexRenderer";

// -- Constants --
const A4_WIDTH_MM = 210;
const MARGIN_MM = 20;

// We'll use pixels for measurement. 1mm approx 3.78px at 96 DPI.
// Let's assume 794px width (standard for A4 at 96 DPI) for the preview.
const PAGE_WIDTH_PX = 794;
const PAGE_HEIGHT_PX = 1123;
const PADDING_PX = (PAGE_WIDTH_PX * MARGIN_MM) / A4_WIDTH_MM; // approx 75px
const CONTENT_WIDTH_PX = PAGE_WIDTH_PX - PADDING_PX * 2;
const FOOTER_HEIGHT_PX = 30; // Reserve space for page footer
const CONTENT_HEIGHT_PX = PAGE_HEIGHT_PX - PADDING_PX * 2 - FOOTER_HEIGHT_PX;
const MIN_SCALE = 0.5;
const MAX_SCALE = 2.0;

// -- Types --
interface HeaderItem {
  id: string;
  type: "header";
  data: QgenDraft;
  isPageBreakBelow?: boolean;
}

interface InstructionsItem {
  id: string;
  type: "instructions";
  data: QgenInstruction[];
  isPageBreakBelow?: boolean;
}

interface SectionItem {
  id: string;
  type: "section";
  data: QgenDraftSection;
  isPageBreakBelow?: boolean;
  totalMarks?: number;
}

interface QuestionItemData extends GeneratedQuestionWithConcepts {
  displayIndex: number;
}

interface QuestionPaperItem {
  id: string;
  type: "question";
  data: QuestionItemData;
  isPageBreakBelow?: boolean;
}

interface AnswerPaperItem {
  id: string;
  type: "answer";
  data: QuestionItemData;
  isPageBreakBelow?: boolean;
}

type PaperItem =
  | HeaderItem
  | InstructionsItem
  | SectionItem
  | QuestionPaperItem
  | AnswerPaperItem;

interface PageData {
  pageNumber: number;
  items: PaperItem[];
}

// -- Components --

// 1. Render Components (Shared between Measure and Display)
const formatTime = (timeStr?: string | null) => {
  if (!timeStr) return "60 mins";
  // If it's already "X mins" style, use it
  if (timeStr.toLowerCase().includes("min")) return timeStr;

  // Try parsing HH:MM:SS or HH:MM
  const parts = timeStr.split(":").map(Number);
  if (parts.length >= 2) {
    const [h, m] = parts;
    const totalMinutes = (h || 0) * 60 + (m || 0);
    return totalMinutes > 0 ? `${totalMinutes} Mins` : timeStr;
  }
  return timeStr;
};

const PaperHeader = ({
  draft,
  titleSuffix,
}: {
  draft: QgenDraft;
  titleSuffix?: string;
}) => {
  const [logoSignedUrl, setLogoSignedUrl] = useState<string | null>(null);
  const { logoVersion } = useDraftContext();

  useEffect(() => {
    let isMounted = true;
    async function fetchLogo() {
      if (draft.logo_url && draft.logo_url.startsWith("http")) {
        // Legacy support if URL is stored
        if (isMounted) setLogoSignedUrl(draft.logo_url);
        return;
      }
      if (draft.logo_url) {
        const { getSignedLogoUrl } =
          await import("../../services/draftService");
        const url = await getSignedLogoUrl(draft.logo_url);
        if (isMounted) setLogoSignedUrl(url);
      } else {
        if (isMounted) setLogoSignedUrl(null);
      }
    }
    fetchLogo();
    return () => {
      isMounted = false;
    };
  }, [draft.logo_url, logoVersion]);

  return (
    <div className="mb-6 text-center">
      {logoSignedUrl && (
        <div className="mb-2 flex justify-center">
          <img
            src={logoSignedUrl}
            alt="Logo"
            className="h-16 w-auto object-contain"
            onError={(e) => {
              // Hide the image if it fails to load
              e.currentTarget.style.display = "none";
              // Also maybe nullify state to avoid taking up space
              setLogoSignedUrl(null);
            }}
          />
        </div>
      )}
      <h1 className="text-2xl font-bold uppercase tracking-wide text-black">
        {draft.institute_name || "Institute Name"}
      </h1>
      <h2 className="mt-1 text-xl font-bold text-black">
        {draft.paper_title || "Examination Paper"} {titleSuffix}
      </h2>
      <div className="mt-4 border-y-2 border-black py-2">
        <div className="flex justify-between px-2 text-sm font-bold text-black">
          <div className="flex flex-col items-start gap-1">
            <span>Subject: {draft.subject_name || "..................."}</span>
            <span>
              Class: {draft.school_class_name || "..................."}
            </span>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span>Max. Marks: {draft.maximum_marks || "..."}</span>
            <span>Duration: {formatTime(draft.paper_duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const PaperInstructions = ({
  instructions,
}: {
  instructions: QgenInstruction[];
}) => {
  if (!instructions || instructions.length === 0) return null;
  return (
    <div className="mb-2 border-b-2 border-black pb-4">
      <h3 className="mb-1 text-sm font-bold text-black">
        General Instructions:
      </h3>
      <ol className="list-outside list-decimal space-y-1 pl-5 text-sm font-medium text-black">
        {instructions.map((inst) => (
          <li key={inst.id} className="pl-1">
            {inst.instruction_text}
          </li>
        ))}
      </ol>
    </div>
  );
};

const SectionHeader = ({
  section,
  totalMarks,
}: {
  section: QgenDraftSection;
  totalMarks?: number;
}) => (
  <div className="mb-4 mt-6 flex items-baseline justify-between">
    <h3 className="text-lg font-bold uppercase underline">
      {section.section_name}
    </h3>
    {totalMarks !== undefined && totalMarks > 0 && (
      <span className="whitespace-nowrap text-sm font-bold text-black">
        [{totalMarks} marks]
      </span>
    )}
    {/* <div className="mt-1 h-0.5 w-full bg-primary/20" /> */}
  </div>
);

const QuestionItem = ({
  question,
  index,
}: {
  question: GeneratedQuestionWithConcepts;
  index: number;
}) => {
  // Filter and sort images by position
  const validImages = (question.images || [])
    .filter((img) => img.svg_string || img.img_url)
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  return (
    <div className="mb-4 break-inside-avoid">
      <div className="flex gap-2">
        <span className="font-semibold">{index + 1}.</span>
        <div className="flex-1">
          <LatexHtmlRenderer
            content={question.question_text || ""}
            className="prose prose-sm max-w-none text-gray-800"
            style={{ fontFamily: '"Times New Roman", Times, serif' }}
          />
          {/* Render Question Images */}
          {validImages.length > 0 && (
            <div className="my-2 flex flex-wrap gap-2">
              {validImages.map((image) => {
                if (image.svg_string) {
                  return (
                    <div
                      key={image.id}
                      className="question-image-svg max-w-full overflow-hidden"
                      dangerouslySetInnerHTML={{ __html: image.svg_string }}
                    />
                  );
                }
                if (image.img_url) {
                  return (
                    <img
                      key={image.id}
                      src={image.img_url}
                      alt={`Question image ${image.position ?? image.id}`}
                      className="max-h-24 max-w-full object-contain"
                    />
                  );
                }
                return null;
              })}
            </div>
          )}
          {/* Render Options if MCQ/MSQ */}
          {(["mcq4", "msq4"] as string[]).includes(question.question_type) && (
            <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2">
              {[
                question.option1,
                question.option2,
                question.option3,
                question.option4,
              ].map((opt, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 text-sm"
                  style={{ fontFamily: '"Times New Roman", Times, serif' }}
                >
                  <span className="font-medium text-gray-500">
                    {String.fromCharCode(97 + i)})
                  </span>
                  <LatexRenderer content={opt || ""} />
                </div>
              ))}
            </div>
          )}
        </div>
        <span className="ml-2 whitespace-nowrap text-sm font-semibold text-gray-500">
          [{question.marks} marks]
        </span>
      </div>
    </div>
  );
};

const AnswerItem = ({
  question,
  index,
}: {
  question: QuestionItemData;
  index: number;
}) => {
  return (
    <div className="mb-4 break-inside-avoid">
      <div className="flex gap-2">
        <span className="font-semibold">{index + 1}.</span>
        <div className="flex-1">
          <div className="flex gap-2">
            <span className="text-sm font-bold">Ans:</span>
            <LatexHtmlRenderer
              content={question.answer_text || "N/A"}
              className="prose prose-sm max-w-none text-gray-800"
              style={{ fontFamily: '"Times New Roman", Times, serif' }}
            />
          </div>
          {question.explanation && (
            <div className="mt-2 text-sm">
              <span className="font-bold underline">Explanation:</span>
              <LatexHtmlRenderer
                content={question.explanation}
                className="prose prose-sm mt-1 max-w-none text-gray-800"
                style={{ fontFamily: '"Times New Roman", Times, serif' }}
              />
            </div>
          )}
        </div>
        <span className="ml-2 whitespace-nowrap text-sm font-semibold text-gray-500">
          [{question.marks} marks]
        </span>
      </div>
    </div>
  );
};

export function PaperPreview() {
  const { draft, sections, instructions } = useDraftContext();
  const { questions } = useQuestionsContext();
  const { toast } = useToast();
  // Default 70% on mobile (<768px), 90% on desktop
  const getInitialScale = () =>
    typeof window !== "undefined" && window.innerWidth < 768 ? 0.7 : 0.9;
  const [scale, setScale] = useState<number>(getInitialScale);
  const [previewMode, setPreviewMode] = useState<"paper" | "answer">("paper");
  const [pages, setPages] = useState<PageData[]>([]);

  const measureRef = useRef<HTMLDivElement>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  const scaleRef = useRef(scale);

  // Helper to center the scrollbar
  const centerScroll = useCallback(() => {
    if (previewContainerRef.current) {
      const { scrollWidth, clientWidth } = previewContainerRef.current;
      if (scrollWidth > clientWidth) {
        previewContainerRef.current.scrollTo({
          left: (scrollWidth - clientWidth) / 2,
          behavior: "smooth",
        });
      }
    }
  }, []);

  const centeredOnce = useRef(false);

  // Reset centeredOnce when draft or previewMode changes
  useEffect(() => {
    centeredOnce.current = false;
  }, [draft, previewMode]);

  // Center on initial load or validity change
  useEffect(() => {
    const container = previewContainerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        // If hidden/zero width, reset centered state so we center again when visible
        if (entry.contentRect.width === 0) {
          centeredOnce.current = false;
        } else if (!centeredOnce.current && pages.length > 0) {
          // If visible and needs centering
          const { scrollWidth, clientWidth } = container;
          if (scrollWidth > clientWidth) {
            centerScroll();
            centeredOnce.current = true;
          }
        }
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [pages, centerScroll]);

  // Update scaleRef whenever scale changes
  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  // Handle zoom interactions
  useEffect(() => {
    const container = previewContainerRef.current;
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
  }, [draft]); // Re-bind when draft loads (component might render null initially)

  // 1. Flatten Data Structure
  const items: PaperItem[] = useMemo(() => {
    if (!draft) return [];

    const result: PaperItem[] = [];

    // Header
    result.push({
      id: "header",
      type: "header",
      data: draft,
    });

    // Instructions - Only for Paper mode
    if (previewMode === "paper" && instructions.length > 0) {
      result.push({
        id: "instructions",
        type: "instructions",
        data: instructions,
      });
    }

    // Sections and Questions
    let globalQIndex = 0;
    sections.forEach((section) => {
      // Questions in Section
      const sectionQuestions = questions
        .filter((q) => q.is_in_draft && q.qgen_draft_section_id === section.id)
        .sort(
          (a, b) => (a.position_in_draft || 0) - (b.position_in_draft || 0)
        );

      const totalMarks = sectionQuestions.reduce(
        (sum, q) => sum + Number(q.marks || 0),
        0
      );

      // Section Header
      result.push({
        id: `section-${section.id}`,
        type: "section",
        data: section,
        totalMarks: totalMarks,
      });

      // Questions by Section
      sectionQuestions.forEach((q) => {
        result.push({
          id: `${previewMode}-${q.id}`, // Distinct IDs to force re-measure on mode switch
          type: previewMode === "paper" ? "question" : "answer",
          data: { ...q, displayIndex: globalQIndex },
          isPageBreakBelow: q.is_page_break_below,
        });
        globalQIndex++;
      });
    });

    return result;
  }, [draft, sections, questions, instructions, previewMode]);

  // 2. Measure Function
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
  }, [items]);

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
  }, [items, calculatePages]);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: draft
      ? `${draft.paper_title || "Paper"} - ${previewMode === "paper" ? "Questions" : "Answers"}`
      : "Print",
    onBeforePrint: () => new Promise((resolve) => setTimeout(resolve, 500)),
  });

  if (!draft) return null;

  return (
    <div className="flex h-full flex-col bg-gray-100">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-white p-2 shadow-sm md:gap-4 md:p-4">
        <div className="flex flex-wrap items-center gap-2 md:gap-4">
          {/* Mode Switcher */}
          <div className="flex items-center gap-1 md:gap-2">
            <Button
              variant={previewMode === "paper" ? "default" : "ghost"}
              size="sm"
              onClick={() => setPreviewMode("paper")}
              className={cn(
                "gap-1 px-2 md:gap-2 md:px-3",
                previewMode === "paper" && "shadow-sm"
              )}
            >
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Paper</span>
            </Button>
            <Button
              variant={previewMode === "answer" ? "default" : "ghost"}
              size="sm"
              onClick={() => setPreviewMode("answer")}
              className={cn(
                "gap-1 px-2 md:gap-2 md:px-3",
                previewMode === "answer" && "shadow-sm"
              )}
            >
              <CheckSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Answers</span>
            </Button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-1 rounded-md border bg-gray-50 px-1 py-1 md:gap-2 md:px-2">
            <button
              onClick={() => setScale((s) => Math.max(MIN_SCALE, s - 0.1))}
              className="p-1 hover:text-primary"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            {/* Hide slider on mobile, show only on sm+ */}
            <input
              type="range"
              min={MIN_SCALE}
              max={MAX_SCALE}
              step={0.1}
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              className="hidden w-16 accent-primary sm:block md:w-24"
            />
            <button
              onClick={() => setScale((s) => Math.min(MAX_SCALE, s + 0.1))}
              className="p-1 hover:text-primary"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <span className="w-8 text-center text-xs font-medium md:w-10">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={() => {
                setScale(getInitialScale());
                setTimeout(centerScroll, 100);
              }}
              className="ml-1 border-l p-1 text-gray-400 hover:text-gray-600"
            >
              <RotateCcw className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Print Button */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="gap-1 px-2 md:gap-2 md:px-3">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Download</span>
              <ChevronDown className="h-3 w-3 md:h-4 md:w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                toast({
                  title: "Feature Coming Soon",
                  description: "Download as Word file will be available soon!",
                });
              }}
              className="gap-2"
            >
              <FileDown className="h-4 w-4" />
              Download Word File
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handlePrint()} className="gap-2">
              <Printer className="h-4 w-4" />
              Print PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Preview Area */}
      <div
        ref={previewContainerRef}
        className="flex-1 overflow-auto p-4 md:p-8"
      >
        <div className="mx-auto flex w-fit flex-col gap-8">
          <div
            style={{
              transform: `scale(${scale})`,
              transformOrigin: "top center",
              transition: "transform 0.1s",
            }}
          >
            <div
              className="zoom-wrapper"
              style={{
                transform: `scale(${scale})`,
                transformOrigin: "top center",
                transition: "transform 0.1s",
              }}
            >
              {/* Printable Container */}
              <div
                id="paper-preview-content"
                ref={printRef}
                className="print-container"
              >
                {pages.map((page, pageIndex) => (
                  <div
                    key={page.pageNumber}
                    className="print-page bg-white shadow-xl"
                    style={{
                      width: `${PAGE_WIDTH_PX}px`,
                      height: `${PAGE_HEIGHT_PX}px`,
                      padding: `${PADDING_PX}px`,
                      marginBottom: pageIndex < pages.length - 1 ? "32px" : "0",
                      boxSizing: "border-box",
                      position: "relative",
                      fontFamily: '"Times New Roman", Times, serif',
                    }}
                  >
                    {/* Content area */}
                    <div
                      style={{
                        height: `${CONTENT_HEIGHT_PX}px`,
                        overflow: "hidden",
                      }}
                    >
                      {page.items.map((item) => (
                        <div
                          key={item.id}
                          className="w-full overflow-hidden p-0.5"
                        >
                          {item.type === "header" && (
                            <PaperHeader
                              draft={item.data}
                              titleSuffix={
                                previewMode === "answer" ? "- Answer Key" : ""
                              }
                            />
                          )}
                          {item.type === "instructions" && (
                            <PaperInstructions instructions={item.data} />
                          )}
                          {item.type === "section" && (
                            <SectionHeader
                              section={item.data}
                              totalMarks={item.totalMarks}
                            />
                          )}
                          {item.type === "question" && (
                            <QuestionItem
                              question={item.data}
                              index={item.data.displayIndex}
                            />
                          )}
                          {item.type === "answer" && (
                            <AnswerItem
                              question={item.data}
                              index={item.data.displayIndex}
                            />
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Page Footer - Absolutely positioned at bottom */}
                    <div
                      className="page-footer text-right text-xs text-gray-400"
                      style={{
                        position: "absolute",
                        bottom: `${PADDING_PX}px`,
                        right: `${PADDING_PX}px`,
                        left: `${PADDING_PX}px`,
                      }}
                    >
                      <div className="mt-4 border-t-2 border-black py-2">
                        <span className="font-bold">#PTO</span>
                        <span className="ml-4">
                          Page {page.pageNumber} of {pages.length}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden Measure Layer - Outside print area */}
      <div
        id="measure-layer"
        ref={measureRef}
        aria-hidden="true"
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          width: `${CONTENT_WIDTH_PX}px`,
          opacity: 0,
          pointerEvents: "none",
          zIndex: -1,
          fontFamily: '"Times New Roman", Times, serif',
        }}
      >
        {items.map((item) => (
          <div
            key={item.id}
            data-item-id={item.id}
            className="w-full overflow-hidden p-0.5"
          >
            {item.type === "header" && (
              <PaperHeader
                draft={item.data}
                titleSuffix={previewMode === "answer" ? "- Answer Key" : ""}
              />
            )}
            {item.type === "instructions" && (
              <PaperInstructions instructions={item.data} />
            )}
            {item.type === "section" && (
              <SectionHeader section={item.data} totalMarks={item.totalMarks} />
            )}
            {item.type === "question" && (
              <QuestionItem
                question={item.data}
                index={item.data.displayIndex}
              />
            )}
            {item.type === "answer" && (
              <AnswerItem question={item.data} index={item.data.displayIndex} />
            )}
          </div>
        ))}
      </div>

      {/* Global Print Styles */}
      <style>{`
        @media print {
          /* Hide measure layer completely */
          #measure-layer {
            display: none !important;
            visibility: hidden !important;
          }
          
          @page {
            size: A4;
            margin: 0;
          }
          .zoom-wrapper {
            transform: scale(1) !important;
            transition: none !important;
          }
          #paper-preview-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          
          .print-container {
            display: block !important;
          }
          
          .print-page {
            width: 210mm !important;
            height: 297mm !important;
            min-height: 297mm !important;
            max-height: 297mm !important;
            margin: 0 !important;
            padding: 20mm !important;
            box-shadow: none !important;
            page-break-after: always;
            break-after: page;
            box-sizing: border-box !important;
            position: relative !important;
            overflow: hidden !important;
          }
          
          .print-page:last-child {
            page-break-after: auto;
            break-after: auto;
          }
          
          .page-footer {
            position: absolute !important;
            bottom: 20mm !important;
            right: 20mm !important;
            left: 20mm !important;
          }
        }
      `}</style>
    </div>
  );
}
