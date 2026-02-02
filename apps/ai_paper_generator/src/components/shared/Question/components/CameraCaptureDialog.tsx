import { useState, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Button,
  Textarea,
} from "@skolist/ui";
import { Camera, Check, X, Loader2, Crop, Move } from "lucide-react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";

interface CameraCaptureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCapture: (file: File, customPrompt?: string) => Promise<void>;
  isProcessing?: boolean;
  initialFile?: File | null;
}

// Utility to create a cropped image from the original
async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area
): Promise<Blob | null> {
  const image = new Image();
  image.src = imageSrc;

  await new Promise((resolve) => {
    image.onload = resolve;
  });

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        resolve(blob);
      },
      "image/jpeg",
      0.9
    );
  });
}

export function CameraCaptureDialog({
  open,
  onOpenChange,
  onCapture,
  initialFile,
}: CameraCaptureDialogProps) {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Cropping state
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isCropping, setIsCropping] = useState(true);

  // Custom prompt state
  const [customPrompt, setCustomPrompt] = useState("");

  // Handle initial file
  useEffect(() => {
    if (open && initialFile) {
      setError(null);
      setCustomPrompt("");
      setCrop({ x: 0, y: 0 });
      setZoom(1);
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

  // Handle crop complete
  const onCropComplete = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  // Toggle cropping mode
  const toggleCropMode = useCallback(() => {
    setIsCropping((prev) => !prev);
    if (!isCropping) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    }
  }, [isCropping]);

  // Confirm and send photo
  const confirmPhoto = useCallback(async () => {
    if (!capturedImage) return;

    let blobToSend: Blob | null = null;

    if (isCropping && croppedAreaPixels) {
      blobToSend = await getCroppedImg(capturedImage, croppedAreaPixels);
    } else if (initialFile) {
      // Use original file if not cropping
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
    croppedAreaPixels,
    onCapture,
    onOpenChange,
    customPrompt,
    initialFile,
  ]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[95vh] max-w-2xl overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="space-y-1">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-xl">
            <Camera className="h-4 w-4 sm:h-5" />
            Process Photo
          </DialogTitle>
          <DialogDescription className="text-xs leading-tight sm:text-sm">
            Adjust your image and add optional instructions for the AI.
          </DialogDescription>
        </DialogHeader>

        <div className="relative mt-2 sm:mt-4">
          {error && (
            <div className="flex h-48 items-center justify-center rounded-lg border border-destructive bg-destructive/10 p-4 text-center sm:h-64">
              <div className="text-destructive">
                <X className="mx-auto mb-2 h-6 w-6 sm:h-8 sm:w-8" />
                <p className="text-xs sm:text-sm">{error}</p>
              </div>
            </div>
          )}

          {!error && !capturedImage && (
            <div className="flex h-48 items-center justify-center rounded-lg border bg-muted sm:h-64">
              <div className="text-center text-muted-foreground">
                <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin sm:h-8 sm:w-8" />
                <p className="text-xs sm:text-sm">Loading image...</p>
              </div>
            </div>
          )}

          {!error && capturedImage && (
            <div className="relative overflow-hidden rounded-lg bg-black/5">
              {isCropping ? (
                <div
                  className="relative w-full rounded-lg"
                  style={{ height: "250px" }}
                >
                  <Cropper
                    image={capturedImage}
                    crop={crop}
                    zoom={zoom}
                    aspect={undefined} // Free-form cropping
                    onCropChange={setCrop}
                    onCropComplete={onCropComplete}
                    onZoomChange={setZoom}
                    showGrid={true}
                  />
                  {/* Zoom slider */}
                  <div className="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-lg bg-background/80 px-2 py-0.5 backdrop-blur-sm sm:px-3 sm:py-1">
                    <span className="text-[10px] text-muted-foreground sm:text-xs">
                      Zoom:
                    </span>
                    <input
                      type="range"
                      min={1}
                      max={3}
                      step={0.1}
                      value={zoom}
                      onChange={(e) => setZoom(Number(e.target.value))}
                      className="w-16 sm:w-24"
                    />
                  </div>
                </div>
              ) : (
                <img
                  src={capturedImage}
                  alt="Original"
                  className="max-h-[250px] w-full rounded-lg sm:max-h-[400px]"
                  style={{ objectFit: "contain" }}
                />
              )}
            </div>
          )}

          {/* Custom prompt input (shown after capture) */}
          {capturedImage && (
            <div className="mt-3 sm:mt-4">
              <label
                htmlFor="custom-prompt"
                className="mb-1 block text-xs font-medium text-foreground sm:text-sm"
              >
                Custom Instructions{" "}
                <span className="text-muted-foreground">(optional)</span>
              </label>
              <Textarea
                id="custom-prompt"
                placeholder="Add instructions... e.g. 'Extract 2nd Question' or 'Use the diagram'"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                className="min-h-[60px] resize-none text-xs sm:min-h-[80px] sm:text-sm"
              />
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="mt-4 flex flex-col justify-end gap-2 sm:flex-row">
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-row">
            <Button
              variant="outline"
              className="h-9 text-xs sm:h-10 sm:text-sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              className="h-9 text-xs sm:h-10 sm:text-sm"
              onClick={toggleCropMode}
            >
              {isCropping ? (
                <>
                  <Move className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
                  Original
                </>
              ) : (
                <>
                  <Crop className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
                  Crop
                </>
              )}
            </Button>
            <Button
              className="col-span-2 h-9 sm:col-auto sm:h-10"
              onClick={confirmPhoto}
              variant="default"
              disabled={!capturedImage}
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
