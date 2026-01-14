import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import { Printer } from "lucide-react";
import { Button } from "@skolist/ui";
import { useDraftContext } from "../../context/DraftContext";
import { useQuestionsContext } from "../../context/QuestionsContext";
import type { GeneratedQuestionWithConcepts } from "../../services/questionService";
import {
  type QgenDraftSection,
  type QgenDraft,
} from "../../services/draftService";

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

// -- Types --
type PaperItemType = "header" | "section" | "question";

interface PaperItem {
  id: string;
  type: PaperItemType;
  data: any;
  isPageBreakBelow?: boolean;
}

interface PageData {
  pageNumber: number;
  items: PaperItem[];
}

// -- Components --

// 1. Render Components (Shared between Measure and Display)
const PaperHeader = ({ draft }: { draft: QgenDraft }) => (
  <div className="mb-6 border-b pb-4 text-center">
    <h1 className="text-2xl font-bold uppercase tracking-wide">
      {draft.institute_name || "Institute Name"}
    </h1>
    <h2 className="mt-2 text-xl font-semibold">
      {draft.paper_title || "Examination Paper"}
    </h2>
    <div className="mt-2 flex justify-between text-sm font-medium text-gray-600">
      <span>Time: {draft.paper_duration || "60 mins"}</span>
      <span>Max Marks: {draft.maximum_marks || "100"}</span>
    </div>
  </div>
);

const SectionHeader = ({ section }: { section: QgenDraftSection }) => (
  <div className="mb-4 mt-6">
    <h3 className="text-lg font-bold uppercase text-primary">
      {section.section_name}
    </h3>
    <div className="mt-1 h-0.5 w-full bg-primary/20" />
  </div>
);

const QuestionItem = ({
  question,
  index,
}: {
  question: GeneratedQuestionWithConcepts;
  index: number;
}) => (
  <div className="mb-4 break-inside-avoid">
    <div className="flex gap-2">
      <span className="font-semibold">{index + 1}.</span>
      <div className="flex-1">
        <div
          className="prose prose-sm max-w-none text-gray-800"
          dangerouslySetInnerHTML={{ __html: question.question_text || "" }}
        />
        {/* Render Options if MCQ/MSQ */}
        {(["mcq4", "msq4"] as string[]).includes(question.question_type) && (
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2">
            {[
              question.option1,
              question.option2,
              question.option3,
              question.option4,
            ].map((opt, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span className="font-medium text-gray-500">
                  {String.fromCharCode(97 + i)})
                </span>
                <span>{opt}</span>
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

export function PaperPreview() {
  const { draft, sections } = useDraftContext();
  const { questions } = useQuestionsContext();
  const [pages, setPages] = useState<PageData[]>([]);

  const measureRef = useRef<HTMLDivElement>(null);
  const printRef = useRef<HTMLDivElement>(null);

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

    // Sections and Questions
    let globalQIndex = 0;
    sections.forEach((section) => {
      // Section Header
      result.push({
        id: `section-${section.id}`,
        type: "section",
        data: section,
      });

      // Questions in Section
      const sectionQuestions = questions
        .filter((q) => q.is_in_draft && q.qgen_draft_section_id === section.id)
        .sort(
          (a, b) => (a.position_in_section || 0) - (b.position_in_section || 0)
        );

      sectionQuestions.forEach((q) => {
        result.push({
          id: `question-${q.id}`,
          type: "question",
          data: { ...q, displayIndex: globalQIndex },
          isPageBreakBelow: q.is_page_break_below,
        });
        globalQIndex++;
      });
    });

    return result;
  }, [draft, sections, questions]);

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

  // Trigger measurement when items change
  useLayoutEffect(() => {
    // Timeout to allow DOM to render the hidden items
    const timer = setTimeout(() => {
      calculatePages();
    }, 100);
    return () => clearTimeout(timer);
  }, [items, calculatePages]);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: draft?.paper_title || "Paper",
  });

  if (!draft) return null;

  return (
    <div className="flex h-full flex-col bg-gray-100">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-600">
          Print Preview ({pages.length} Pages)
        </h2>
        <Button onClick={() => handlePrint()} size="sm" className="gap-2">
          <Printer className="h-4 w-4" />
          Print / Save PDF
        </Button>
      </div>

      {/* Preview Area */}
      <div className="flex-1 overflow-auto p-8">
        <div className="mx-auto flex w-fit flex-col gap-8">
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
                    <div key={item.id} className="w-full overflow-hidden p-0.5">
                      {item.type === "header" && (
                        <PaperHeader draft={item.data} />
                      )}
                      {item.type === "section" && (
                        <SectionHeader section={item.data} />
                      )}
                      {item.type === "question" && (
                        <QuestionItem
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
                  Page {page.pageNumber} of {pages.length}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hidden Measure Layer - Outside print area */}
      <div
        id="measure-layer"
        ref={measureRef}
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "-9999px",
          top: 0,
          width: `${CONTENT_WIDTH_PX}px`,
          visibility: "hidden",
          pointerEvents: "none",
        }}
      >
        {items.map((item) => (
          <div
            key={item.id}
            data-item-id={item.id}
            className="w-full overflow-hidden p-0.5"
          >
            {item.type === "header" && <PaperHeader draft={item.data} />}
            {item.type === "section" && <SectionHeader section={item.data} />}
            {item.type === "question" && (
              <QuestionItem
                question={item.data}
                index={item.data.displayIndex}
              />
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
