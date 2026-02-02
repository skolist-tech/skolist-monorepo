import { useState, useCallback, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  Textarea,
} from "@skolist/ui";
import { Camera, Check, X, Loader2 } from "lucide-react";
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  Crop as CropType,
  PixelCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

interface CameraCaptureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCapture: (file: File, customPrompt?: string) => Promise<void>;
  isProcessing?: boolean;
  initialFile?: File | null;
}

// Utility to create a cropped image from the original

async function getCroppedImg(
  image: HTMLImageElement,
  pixelCrop: PixelCrop
): Promise<Blob | null> {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // Handle object-fit: contain offsets
  // The image might be rendered smaller than the element if visible constraints apply
  const { width: elementWidth, height: elementHeight } = image;
  const { naturalWidth, naturalHeight } = image;
  const aspect = naturalWidth / naturalHeight;
  const elementAspect = elementWidth / elementHeight;

  let renderWidth = elementWidth;
  let renderHeight = elementHeight;
  let offsetX = 0;
  let offsetY = 0;

  if (aspect > elementAspect) {
    // Image is wider than element (fits width), empty space top/bottom
    renderHeight = elementWidth / aspect;
    offsetY = (elementHeight - renderHeight) / 2;
  } else if (aspect < elementAspect) {
    // Image is taller than element (fits height), empty space left/right
    renderWidth = elementHeight * aspect;
    offsetX = (elementWidth - renderWidth) / 2;
  }

  const scaleX = naturalWidth / renderWidth;
  const scaleY = naturalHeight / renderHeight;

  canvas.width = pixelCrop.width * scaleX;
  canvas.height = pixelCrop.height * scaleY;

  ctx.imageSmoothingQuality = "high";

  ctx.drawImage(
    image,
    (pixelCrop.x - offsetX) * scaleX,
    (pixelCrop.y - offsetY) * scaleY,
    pixelCrop.width * scaleX,
    pixelCrop.height * scaleY,
    0,
    0,
    pixelCrop.width * scaleX,
    pixelCrop.height * scaleY
  );

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        resolve(blob);
      },
      "image/jpeg",
      0.95
    );
  });
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number | undefined
) {
  if (aspect === undefined) {
    return centerCrop(
      {
        unit: "%",
        width: 90,
        height: 90,
      },
      mediaWidth,
      mediaHeight
    );
  }
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

export function CameraCaptureDialog({
  open,
  onOpenChange,
  onCapture,
  initialFile,
}: CameraCaptureDialogProps) {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Cropping state
  const [crop, setCrop] = useState<CropType>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isCropping, setIsCropping] = useState(true);

  // Custom prompt state
  const [customPrompt, setCustomPrompt] = useState("");

  // Handle initial file
  useEffect(() => {
    if (open && initialFile) {
      setError(null);
      setCustomPrompt("");
      setCrop(undefined);
      setCompletedCrop(undefined);
      setIsCropping(true);

      const reader = new FileReader();
      reader.onload = () => {
        setCapturedImage(reader.result as string);
      };
      reader.onerror = () => {
        setError("Failed to read the selected file.");
      };
      reader.readAsDataURL(initialFile);
    } else if (!open) {
      setCapturedImage(null);
      setError(null);
    }
  }, [open, initialFile]);

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, undefined));
  }

  // Confirm and send photo
  const confirmPhoto = useCallback(async () => {
    if (!capturedImage || !imgRef.current) return;

    let blobToSend: Blob | null = null;

    if (isCropping && completedCrop) {
      blobToSend = await getCroppedImg(imgRef.current, completedCrop);
    } else if (initialFile) {
      blobToSend = initialFile;
    }

    if (!blobToSend) {
      setError("Failed to process image");
      return;
    }

    const file = new File([blobToSend], `camera_capture_${Date.now()}.jpg`, {
      type: "image/jpeg",
    });

    try {
      onOpenChange(false);
      await onCapture(file, customPrompt.trim() || undefined);
    } catch (err) {
      console.error("Failed to process image:", err);
    }
  }, [
    capturedImage,
    isCropping,
    completedCrop,
    onCapture,
    onOpenChange,
    customPrompt,
    initialFile,
  ]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[95vh] max-w-2xl flex-col p-4 sm:max-h-[90vh] sm:p-6">
        {/* Header (Fixed) */}
        <DialogHeader className="mb-2 space-y-1">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-xl">
            <Camera className="h-4 w-4 sm:h-5" />
            Process Photo
          </DialogTitle>
        </DialogHeader>

        {/* Center Cropper Section - Fixed Height & Scaling */}
        <div className="mb-2 flex min-h-0 flex-1 items-center justify-center rounded-lg bg-black/5">
          <div className="relative flex h-full w-full items-center justify-center p-2">
            {error && (
              <div className="p-4 text-center">
                <X className="mx-auto mb-2 h-6 w-6 text-destructive" />
                <p className="text-xs text-destructive">{error}</p>
              </div>
            )}

            {!error && !capturedImage && (
              <div className="p-4 text-center text-muted-foreground">
                <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin" />
                <p className="text-xs">Loading image...</p>
              </div>
            )}

            {!error && capturedImage && (
              <>
                {isCropping ? (
                  <ReactCrop
                    crop={crop}
                    onChange={(c) => setCrop(c)}
                    onComplete={(c) => setCompletedCrop(c)}
                    className="max-h-full"
                  >
                    {/* 
                        Use a responsive height that fits nicely. 
                        object-contain ensures it SCALES, doesn't crop.
                    */}
                    <img
                      ref={imgRef}
                      src={capturedImage}
                      alt="Crop source"
                      onLoad={onImageLoad}
                      className="h-[50vh] w-auto object-contain sm:h-[60vh]"
                      style={{ maxHeight: "100%" }}
                    />
                  </ReactCrop>
                ) : (
                  <img
                    src={capturedImage}
                    alt="Original"
                    className="h-[50vh] w-auto object-contain sm:h-[60vh]"
                  />
                )}
              </>
            )}
          </div>
        </div>

        {/* Sticky Footer Area (Prompt + Buttons) */}
        <div className="flex-shrink-0 space-y-4 border-t pt-4">
          {capturedImage && (
            <div className="space-y-1.5">
              <label
                htmlFor="custom-prompt"
                className="block text-xs font-medium text-foreground sm:text-sm"
              >
                Custom Instructions{" "}
                <span className="text-muted-foreground">(optional)</span>
              </label>
              <Textarea
                id="custom-prompt"
                placeholder="e.g. 'Extract 2nd Question' or 'Use the diagram'"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                className="max-h-[80px] min-h-[50px] resize-none text-xs sm:text-sm"
              />
            </div>
          )}

          <div className="grid w-full grid-cols-2 gap-3 sm:flex sm:w-auto sm:flex-row sm:justify-end">
            <Button
              variant="destructive"
              className="h-10 text-xs sm:text-sm"
              onClick={() => onOpenChange(false)}
              type="button"
            >
              Cancel
            </Button>
            <Button
              className="h-10 bg-blue-600 text-xs text-white hover:bg-blue-700 sm:text-sm"
              onClick={confirmPhoto}
              variant="default"
              disabled={!capturedImage}
              type="button"
            >
              <Check className="mr-1 h-4 w-4 sm:mr-2" />
              Extract Question
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
