import { useEffect, useRef, useState, useCallback } from "react";
import * as fabric from "fabric";

interface UseFabricCanvasOptions {
  /** Initial SVG string to load */
  svgString: string;
  /** Callback when SVG content changes */
  onChange: (svgString: string) => void;
  /** Whether the editor is disabled */
  disabled?: boolean;
}

interface UseFabricCanvasReturn {
  /** Ref to attach to the canvas element */
  canvasRef: React.RefObject<HTMLCanvasElement>;
  /** Currently selected object */
  selectedObject: fabric.FabricObject | null;
  /** Current zoom level */
  zoom: number;
  /** Delete the currently selected object */
  handleDelete: () => void;
  /** Zoom in, out, or reset */
  handleZoom: (direction: "in" | "out" | "reset") => void;
}

/**
 * Custom hook to manage Fabric.js canvas for SVG editing
 * Handles canvas initialization, SVG loading, object manipulation, and export
 */
export function useFabricCanvas({
  svgString,
  onChange,
  disabled = false,
}: UseFabricCanvasOptions): UseFabricCanvasReturn {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const [selectedObject, setSelectedObject] =
    useState<fabric.FabricObject | null>(null);
  const [zoom, setZoom] = useState(1);
  const lastExportedSvgRef = useRef<string | null>(null);
  const svgOptionsRef = useRef<{ width: number; height: number }>({
    width: 200,
    height: 200,
  });

  // Export canvas to SVG
  const exportSvg = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const { width, height } = svgOptionsRef.current;

    const svgOutput = canvas.toSVG({
      width: String(width),
      height: String(height),
      viewBox: {
        x: 0,
        y: 0,
        width: width,
        height: height,
      },
    });

    lastExportedSvgRef.current = svgOutput;
    onChange(svgOutput);
  }, [onChange]);

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current || fabricRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      backgroundColor: "#f8f9fa",
      selection: true,
      preserveObjectStacking: true,
    });

    fabricRef.current = canvas;

    // Selection events
    canvas.on("selection:created", (e) => {
      setSelectedObject(e.selected?.[0] || null);
    });

    canvas.on("selection:updated", (e) => {
      setSelectedObject(e.selected?.[0] || null);
    });

    canvas.on("selection:cleared", () => {
      setSelectedObject(null);
    });

    // Object modified event - export SVG on changes
    canvas.on("object:modified", () => {
      exportSvg();
    });

    // Text editing events
    canvas.on("text:changed", () => {
      exportSvg();
    });

    return () => {
      canvas.dispose();
      fabricRef.current = null;
    };
  }, [exportSvg]);

  // Load SVG into canvas
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas || !svgString) return;

    // Prevent reloading if the SVG string matches the last exported strings
    // This avoids re-centering/resetting the canvas on internally triggered updates
    if (svgString === lastExportedSvgRef.current) return;

    // Clear existing objects
    canvas.clear();
    canvas.backgroundColor = "#f8f9fa";

    // Load SVG from string
    fabric
      .loadSVGFromString(svgString)
      .then((result) => {
        const { objects, options } = result;

        if (!objects || objects.length === 0) return;

        // Store original dimensions
        const svgWidth = options.width || 200;
        const svgHeight = options.height || 200;
        svgOptionsRef.current = { width: svgWidth, height: svgHeight };

        // Set dimensions for the canvas element (UI size)
        // Use optimal size: matches SVG size but ensures a minimum usable area
        const finalCanvasWidth = Math.max(svgWidth, 300);
        const finalCanvasHeight = Math.max(svgHeight, 300);

        canvas.setDimensions({
          width: finalCanvasWidth,
          height: finalCanvasHeight,
        });

        // Add all objects to canvas without modifying their internal transforms
        objects.forEach((obj) => {
          if (!obj) return;

          // Convert Text to IText for inline editing
          if (obj instanceof fabric.Text && !(obj instanceof fabric.IText)) {
            const options = obj.toObject();
            // Remove type to prevent conflicts during instantiation
            delete options.type;

            // Ensure visible defaults if SVG attributes are missing
            if (!options.fill || options.fill === "none") {
              options.fill = "#000000";
            }
            if (!options.fontFamily) {
              options.fontFamily = "Arial, sans-serif";
            }

            const itext = new fabric.IText(obj.text || "", {
              ...options,
              selectable: !disabled,
              hasControls: true,
              editable: !disabled,
            });
            canvas.add(itext);
          } else {
            obj.set({
              selectable: !disabled,
              hasControls: true,
              hasBorders: true,
              cornerStyle: "circle",
              cornerColor: "#6366f1",
              cornerStrokeColor: "#4f46e5",
              borderColor: "#6366f1",
              transparentCorners: false,
              cornerSize: 8,
            });
            canvas.add(obj);
          }
        });

        // Set default zoom to 1 (100%) as requested for stable UI
        const defaultZoom = 1;

        // Center on canvas
        const centerX = finalCanvasWidth / 2;
        const centerY = finalCanvasHeight / 2;

        // Center the 100% scale SVG in the canvas
        // We want (svgWidth/2, svgHeight/2) to be at (centerX, centerY)
        const panX = centerX - (svgWidth * defaultZoom) / 2;
        const panY = centerY - (svgHeight * defaultZoom) / 2;

        canvas.setViewportTransform([
          defaultZoom,
          0,
          0,
          defaultZoom,
          panX,
          panY,
        ]);
        setZoom(defaultZoom);

        canvas.renderAll();
      })
      .catch((error) => {
        console.error("Failed to load SVG:", error);
      });
  }, [svgString, disabled]);

  // Delete selected object
  const handleDelete = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas || !selectedObject) return;

    canvas.remove(selectedObject);
    setSelectedObject(null);
    canvas.renderAll();
    exportSvg();
  }, [selectedObject, exportSvg]);

  // Zoom controls
  const handleZoom = useCallback(
    (direction: "in" | "out" | "reset") => {
      const canvas = fabricRef.current;
      if (!canvas) return;

      let newZoom = zoom;
      if (direction === "in") {
        newZoom = Math.min(zoom * 1.2, 3);
      } else if (direction === "out") {
        newZoom = Math.max(zoom / 1.2, 0.5);
      } else {
        newZoom = 1;
      }

      setZoom(newZoom);
      canvas.setZoom(newZoom);
      canvas.renderAll();
    },
    [zoom]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        // Only delete if not editing text
        const canvas = fabricRef.current;
        const activeObject = canvas?.getActiveObject();
        const isEditingText =
          activeObject instanceof fabric.IText && activeObject.isEditing;
        if (canvas && !isEditingText) {
          handleDelete();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleDelete]);

  return {
    canvasRef,
    selectedObject,
    zoom,
    handleDelete,
    handleZoom,
  };
}
