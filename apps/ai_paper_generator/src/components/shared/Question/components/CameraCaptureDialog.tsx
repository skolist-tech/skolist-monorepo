import { useRef, useState, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Button,
} from "@skolist/ui";
import { Camera, RotateCcw, Check, X, Loader2 } from "lucide-react";

interface CameraCaptureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCapture: (file: File) => Promise<void>;
  isProcessing?: boolean;
}

export function CameraCaptureDialog({
  open,
  onOpenChange,
  onCapture,
  isProcessing = false,
}: CameraCaptureDialogProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Start the camera when dialog opens
  const startCamera = useCallback(async () => {
    try {
      setError(null);
      setIsCameraReady(false);
      setCapturedImage(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // Prefer back camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          setIsCameraReady(true);
        };
      }
    } catch (err) {
      console.error("Failed to access camera:", err);
      setError(
        "Unable to access camera. Please ensure camera permissions are granted."
      );
    }
  }, []);

  // Stop the camera when dialog closes
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraReady(false);
    setCapturedImage(null);
    setError(null);
  }, []);

  // Effect to start/stop camera based on dialog state
  useEffect(() => {
    if (open) {
      startCamera();
    } else {
      stopCamera();
    }

    // Cleanup on unmount
    return () => {
      stopCamera();
    };
  }, [open, startCamera, stopCamera]);

  // Capture photo from video stream
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get the image data URL
    const imageDataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setCapturedImage(imageDataUrl);
  }, []);

  // Retake photo
  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
  }, []);

  // Confirm and send photo
  const confirmPhoto = useCallback(async () => {
    if (!capturedImage || !canvasRef.current) return;

    // Convert canvas to blob
    canvasRef.current.toBlob(
      async (blob) => {
        if (!blob) {
          setError("Failed to process image");
          return;
        }

        // Create a File from the blob
        const file = new File([blob], `camera_capture_${Date.now()}.jpg`, {
          type: "image/jpeg",
        });

        try {
          await onCapture(file);
          onOpenChange(false);
        } catch (err) {
          console.error("Failed to process captured image:", err);
          setError("Failed to process the captured image. Please try again.");
        }
      },
      "image/jpeg",
      0.9
    );
  }, [capturedImage, onCapture, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Capture Photo
          </DialogTitle>
          <DialogDescription>
            Take a photo of reference material to help regenerate the question.
          </DialogDescription>
        </DialogHeader>

        <div className="relative mt-4">
          {/* Error state */}
          {error && (
            <div className="flex h-64 items-center justify-center rounded-lg border border-destructive bg-destructive/10 p-4 text-center">
              <div className="text-destructive">
                <X className="mx-auto mb-2 h-8 w-8" />
                <p>{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startCamera}
                  className="mt-4"
                >
                  Try Again
                </Button>
              </div>
            </div>
          )}

          {/* Loading state */}
          {!error && !isCameraReady && !capturedImage && (
            <div className="flex h-64 items-center justify-center rounded-lg border bg-muted">
              <div className="text-center text-muted-foreground">
                <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin" />
                <p>Initializing camera...</p>
              </div>
            </div>
          )}

          {/* Camera view / Captured image */}
          {!error && (
            <div className="relative overflow-hidden rounded-lg">
              {/* Video element (hidden when photo is captured) */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full rounded-lg ${capturedImage ? "hidden" : ""}`}
                style={{ maxHeight: "400px", objectFit: "contain" }}
              />

              {/* Captured image preview */}
              {capturedImage && (
                <img
                  src={capturedImage}
                  alt="Captured"
                  className="w-full rounded-lg"
                  style={{ maxHeight: "400px", objectFit: "contain" }}
                />
              )}

              {/* Hidden canvas for capturing */}
              <canvas ref={canvasRef} className="hidden" />
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="mt-4 flex justify-end gap-2">
          {!capturedImage ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={capturePhoto}
                disabled={!isCameraReady || !!error}
              >
                <Camera className="mr-2 h-4 w-4" />
                Capture
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={retakePhoto}
                disabled={isProcessing}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Retake
              </Button>
              <Button onClick={confirmPhoto} disabled={isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Use Photo
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
