import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  FileText,
  CheckSquare,
  FileDown,
  ChevronDown,
  Download,
  Loader2,
  Printer,
} from "lucide-react";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@skolist/ui";
import { cn } from "@skolist/utils";

interface PaperToolbarProps {
  previewMode: "paper" | "answer";
  setPreviewMode: (mode: "paper" | "answer") => void;
  scale: number;
  setScale: React.Dispatch<React.SetStateAction<number>>;
  minScale: number;
  maxScale: number;
  onResetZoom: () => void;
  isDownloadingPdf: boolean;
  isDownloadingDocx: boolean;
  onDownloadPdf: () => void;
  onDownloadDocx: () => void;
  onPrint: () => void;
}

export function PaperToolbar({
  previewMode,
  setPreviewMode,
  scale,
  setScale,
  minScale,
  maxScale,
  onResetZoom,
  isDownloadingPdf,
  isDownloadingDocx,
  onDownloadPdf,
  onDownloadDocx,
  onPrint,
}: PaperToolbarProps) {
  return (
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
            onClick={() => setScale((s) => Math.max(minScale, s - 0.1))}
            className="p-1 hover:text-primary"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          {/* Hide slider on mobile, show only on sm+ */}
          <input
            type="range"
            min={minScale}
            max={maxScale}
            step={0.1}
            value={scale}
            onChange={(e) => setScale(parseFloat(e.target.value))}
            className="hidden w-16 accent-primary sm:block md:w-24"
          />
          <button
            onClick={() => setScale((s) => Math.min(maxScale, s + 0.1))}
            className="p-1 hover:text-primary"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <span className="w-8 text-center text-xs font-medium md:w-10">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={onResetZoom}
            className="ml-1 border-l p-1 text-gray-400 hover:text-gray-600"
          >
            <RotateCcw className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Download Button Group */}
      <div className="flex items-center">
        <Button
          size="sm"
          className="gap-2 rounded-r-none border-r border-white/20 px-3 md:px-4"
          onClick={onDownloadPdf}
          disabled={isDownloadingPdf || isDownloadingDocx}
        >
          {isDownloadingPdf ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">Download</span>
          <span className="sm:hidden">Download</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              className="rounded-l-none border-l-0 px-1 shadow-none md:px-2"
              disabled={isDownloadingPdf || isDownloadingDocx}
            >
              <ChevronDown className="h-3 w-3 md:h-4 md:w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={onDownloadDocx}
              className="gap-2"
              disabled={isDownloadingDocx}
            >
              {isDownloadingDocx ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileDown className="h-4 w-4" />
              )}
              Download Word File
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onPrint} className="gap-2">
              <Printer className="h-4 w-4" />
              Print PDF (Browser)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
