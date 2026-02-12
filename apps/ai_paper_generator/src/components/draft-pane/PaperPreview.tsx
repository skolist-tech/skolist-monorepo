import { useRef, useState, useEffect, useCallback } from "react";
import { useReactToPrint } from "react-to-print";
import { useToast } from "@skolist/ui";

import { useDraftContext } from "../../context/DraftContext";
import { useQuestionsContext } from "../../context/QuestionsContext";
import { fastApiService } from "../../services/fastApiService";
import { AnswerItem } from "./preview/AnswerItem";
import { QuestionItem } from "./preview/QuestionItem";
import { PaperHeader } from "./preview/PaperHeader";
import { PaperInstructions } from "./preview/PaperInstructions";
import { SectionHeader } from "./preview/SectionHeader";
import { useZoom } from "./hooks/useZoom";
import { usePaperItems } from "./hooks/usePaperItems";
import {
  usePaperPagination,
  PAGE_WIDTH_PX,
  PAGE_HEIGHT_PX,
  getMarginTopPx,
  getMarginRightPx,
  getMarginBottomPx,
  getMarginLeftPx,
  getContentHeightPx,
  getContentWidthPx,
} from "./hooks/usePaperPagination";
import { PaperToolbar } from "./PaperToolbar";

export function PaperPreview() {
  const { draft, sections, instructions, showInstructions } = useDraftContext();
  const { questions } = useQuestionsContext();
  const { toast } = useToast();

  const [previewMode, setPreviewMode] = useState<"paper" | "answer">("paper");
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isDownloadingDocx, setIsDownloadingDocx] = useState(false);

  const measureRef = useRef<HTMLDivElement>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  // -- Hooks --
  const { scale, setScale, MIN_SCALE, MAX_SCALE, resetZoom } = useZoom(
    previewContainerRef,
    draft
  );

  const items = usePaperItems({
    draft,
    sections,
    questions,
    instructions,
    previewMode,
    showInstructions,
  });

  const { pages } = usePaperPagination(items, measureRef);

  // Center Scroll Logic
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
  useEffect(() => {
    centeredOnce.current = false;
  }, [draft, previewMode]);

  useEffect(() => {
    const container = previewContainerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width === 0) {
          centeredOnce.current = false;
        } else if (!centeredOnce.current && pages.length > 0) {
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

  // -- Print & Download --
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: draft
      ? `${draft.paper_title || "Paper"} - ${previewMode === "paper" ? "Questions" : "Answers"}`
      : "Print",
    onBeforePrint: () => new Promise((resolve) => setTimeout(resolve, 500)),
  });

  const handleDownloadPdf = async () => {
    if (!draft) return;
    try {
      setIsDownloadingPdf(true);
      toast({
        title: "Download Started",
        description: "Your PDF is being downloaded.",
      });
      const blob = await fastApiService.downloadPdf(draft.id, previewMode);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${draft.paper_title || "Paper"}_${previewMode}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error(error);
      toast({
        title: "Download Failed",
        description: "Failed to generate PDF. Please try again or use Print.",
        variant: "destructive",
      });
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleDownloadDocx = async () => {
    if (!draft) return;
    try {
      setIsDownloadingDocx(true);
      toast({
        title: "Download Started",
        description: "Your Word file is being downloaded.",
      });
      const blob = await fastApiService.downloadDocx(draft.id, previewMode);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${draft.paper_title || "Paper"}_${previewMode}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error(error);
      toast({
        title: "Download Failed",
        description: "Failed to generate Word file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDownloadingDocx(false);
    }
  };

  if (!draft) return null;

  return (
    <div className="flex h-full flex-col bg-gray-100">
      <PaperToolbar
        previewMode={previewMode}
        setPreviewMode={setPreviewMode}
        scale={scale}
        setScale={setScale}
        minScale={MIN_SCALE}
        maxScale={MAX_SCALE}
        onResetZoom={() => {
          resetZoom();
          setTimeout(centerScroll, 100);
        }}
        isDownloadingPdf={isDownloadingPdf}
        isDownloadingDocx={isDownloadingDocx}
        onDownloadPdf={handleDownloadPdf}
        onDownloadDocx={handleDownloadDocx}
        onPrint={() => handlePrint()}
      />

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
                {pages.map((page, pageIndex) => {
                  const marginTop = getMarginTopPx();
                  const marginRight = getMarginRightPx();
                  const marginBottom = getMarginBottomPx();
                  const marginLeft = getMarginLeftPx();
                  const contentHeightPx = getContentHeightPx();
                  return (
                    <div
                      key={page.pageNumber}
                      className="print-page bg-white shadow-xl"
                      style={{
                        width: `${PAGE_WIDTH_PX}px`,
                        height: `${PAGE_HEIGHT_PX}px`,
                        paddingTop: `${marginTop}px`,
                        paddingRight: `${marginRight}px`,
                        paddingBottom: `${marginBottom}px`,
                        paddingLeft: `${marginLeft}px`,
                        marginBottom:
                          pageIndex < pages.length - 1 ? "32px" : "0",
                        boxSizing: "border-box",
                        position: "relative",
                        fontFamily: '"Times New Roman", Times, serif',
                      }}
                    >
                      {/* Content area */}
                      <div
                        style={{
                          height: `${contentHeightPx}px`,
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

                      {/* Page Footer */}
                      <div
                        className="page-footer text-right text-xs text-gray-400"
                        style={{
                          position: "absolute",
                          bottom: `${marginBottom}px`,
                          right: `${marginRight}px`,
                          left: `${marginLeft}px`,
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
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden Measure Layer */}
      <div
        id="measure-layer"
        ref={measureRef}
        aria-hidden="true"
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          width: `${getContentWidthPx()}px`,
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
    </div>
  );
}
