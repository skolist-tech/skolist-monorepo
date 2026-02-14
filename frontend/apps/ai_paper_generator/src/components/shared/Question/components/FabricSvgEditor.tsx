import { Button } from "@skolist/ui";
import { Trash2, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { useFabricCanvas } from "../hooks/useFabricCanvas";

interface FabricSvgEditorProps {
  /** Initial SVG string to load */
  svgString: string;
  /** Callback when SVG content changes */
  onChange: (svgString: string) => void;
  /** Whether the editor is disabled */
  disabled?: boolean;
}

/**
 * Visual SVG editor using Fabric.js
 * Allows drag/move, resize, text editing, and delete of SVG elements
 */
export function FabricSvgEditor({
  svgString,
  onChange,
  disabled = false,
}: FabricSvgEditorProps) {
  const { canvasRef, selectedObject, zoom, handleDelete, handleZoom } =
    useFabricCanvas({
      svgString,
      onChange,
      disabled,
    });

  return (
    <div className="flex flex-col gap-2">
      {/* Toolbar */}
      <div className="flex items-center gap-2 rounded-md border bg-muted/50 p-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={handleDelete}
          disabled={disabled || !selectedObject}
          className="h-8 gap-1"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
        <div className="mx-2 h-4 w-px bg-border" />
        <Button
          size="icon"
          variant="ghost"
          onClick={() => handleZoom("out")}
          disabled={disabled}
          className="h-8 w-8"
          title="Zoom Out"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="min-w-[3rem] text-center text-sm text-muted-foreground">
          {Math.round(zoom * 100)}%
        </span>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => handleZoom("in")}
          disabled={disabled}
          className="h-8 w-8"
          title="Zoom In"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => handleZoom("reset")}
          disabled={disabled}
          className="h-8 w-8"
          title="Reset Zoom"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      {/* Canvas Container */}
      <div className="flex items-center justify-center overflow-auto rounded-md border bg-white p-4">
        <canvas ref={canvasRef} />
      </div>

      {/* Help text */}
      <p className="text-xs text-muted-foreground">
        Click to select • Drag to move • Corner handles to resize • Double-click
        text to edit • Delete key to remove
      </p>
    </div>
  );
}
